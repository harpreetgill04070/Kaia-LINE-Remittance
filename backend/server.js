const express = require('express');
const crypto = require('crypto');
const bodyParser = require('body-parser');
const fetch = require('node-fetch');
const contractIntegration = require('./contract-integration');
require('dotenv').config();
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: 'http://localhost:3002',
  credentials: true
}));
app.use(bodyParser.raw({ type: 'application/json' }));

// In-memory storage for intents
let intents = {};

// LINE signature verification middleware
function verifyLineSignature(req, res, next) {
  const signature = req.get('X-Line-Signature');
  const channelSecret = process.env.LINE_CHANNEL_SECRET;
  
  if (!signature || !channelSecret) {
    return res.status(401).json({ error: 'Missing signature or channel secret' });
  }
  
  const hash = crypto
    .createHmac('SHA256', channelSecret)
    .update(req.body)
    .digest('base64');
  
  if (hash !== signature) {
    return res.status(401).json({ error: 'Invalid signature' });
  }
  
  next();
}

// Parse text message to extract remittance intent
function parseRemittanceIntent(text) {
  // Pattern: "send <amount> <token> to @<recipient>"
  const pattern = /send\s+(\d+(?:\.\d+)?)\s+(\w+)\s+to\s+@(\w+)/i;
  const match = text.match(pattern);
  
  if (!match) {
    return null;
  }
  
  return {
    amount: parseFloat(match[1]),
    token: match[2].toUpperCase(),
    recipient: match[3]
  };
}

// Generate LIFF deep link with prefilled parameters
function generateLiffDeepLink(intentId, intent) {
  const liffUrl = process.env.LIFF_APP_URL;
  const params = new URLSearchParams({
    intentId: intentId,
    amount: intent.amount,
    token: intent.token,
    recipient: intent.recipient,
    routerAddress: process.env.REMITTER_ROUTER_ADDRESS || '',
    networkName: process.env.NETWORK_NAME || 'hardhat',
    chainId: process.env.CHAIN_ID || '31337'
  });
  
  return `${liffUrl}?${params.toString()}`;
}

// Store intent and return intent ID
function storeIntent(intent) {
  const intentId = crypto.randomUUID();
  intents[intentId] = {
    ...intent,
    createdAt: new Date().toISOString(),
    status: 'pending'
  };
  return intentId;
}

// Webhook route
app.post('/webhook', verifyLineSignature, (req, res) => {
  try {
    const body = JSON.parse(req.body.toString());
    
    // Handle only message events
    if (body.events && body.events.length > 0) {
      for (const event of body.events) {
        if (event.type === 'message' && event.message.type === 'text') {
          const messageText = event.message.text;
          const replyToken = event.replyToken;
          
          // Parse the message for remittance intent
          const intent = parseRemittanceIntent(messageText);
          
          if (intent) {
            // Store the intent
            const intentId = storeIntent(intent);
            
            // Generate LIFF deep link
            const liffLink = generateLiffDeepLink(intentId, intent);
            
            // Prepare reply message
            const replyMessage = {
              type: 'flex',
              altText: `Send ${intent.amount} ${intent.token} to @${intent.recipient}`,
              contents: {
                type: 'bubble',
                body: {
                  type: 'box',
                  layout: 'vertical',
                  contents: [
                    {
                      type: 'text',
                      text: '💰 Remittance Request',
                      weight: 'bold',
                      size: 'xl',
                      color: '#1DB446'
                    },
                    {
                      type: 'separator',
                      margin: 'md'
                    },
                    {
                      type: 'box',
                      layout: 'vertical',
                      margin: 'md',
                      spacing: 'sm',
                      contents: [
                        {
                          type: 'box',
                          layout: 'baseline',
                          spacing: 'sm',
                          contents: [
                            {
                              type: 'text',
                              text: 'Amount:',
                              color: '#666666',
                              size: 'sm',
                              flex: 0
                            },
                            {
                              type: 'text',
                              text: `${intent.amount} ${intent.token}`,
                              weight: 'bold',
                              size: 'sm'
                            }
                          ]
                        },
                        {
                          type: 'box',
                          layout: 'baseline',
                          spacing: 'sm',
                          contents: [
                            {
                              type: 'text',
                              text: 'To:',
                              color: '#666666',
                              size: 'sm',
                              flex: 0
                            },
                            {
                              type: 'text',
                              text: `@${intent.recipient}`,
                              weight: 'bold',
                              size: 'sm'
                            }
                          ]
                        }
                      ]
                    },
                    {
                      type: 'separator',
                      margin: 'lg'
                    },
                    {
                      type: 'button',
                      style: 'primary',
                      height: 'sm',
                      color: '#1DB446',
                      action: {
                        type: 'uri',
                        label: 'Complete Transaction',
                        uri: liffLink
                      }
                    }
                  ]
                }
              }
            };
            
            // Send reply using LINE Messaging API
            sendLineReply(replyToken, [replyMessage]);
          } else {
            // Send help message for invalid format
            const helpMessage = {
              type: 'text',
              text: 'Please use the format: "send <amount> <token> to @<recipient>"\nExample: "send 100 USDT to @mom"'
            };
            
            sendLineReply(replyToken, [helpMessage]);
          }
        }
      }
    }
    
    res.status(200).json({ status: 'ok' });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Send reply to LINE Messaging API
async function sendLineReply(replyToken, messages) {
  const accessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  
  if (!accessToken) {
    console.error('LINE_CHANNEL_ACCESS_TOKEN not configured');
    return;
  }
  
  try {
    const response = await fetch('https://api.line.me/v2/bot/message/reply', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        replyToken: replyToken,
        messages: messages
      }),
      timeout: 30000, // 30 second timeout
      retry: {
        retries: 3,
        retryDelay: 1000
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('LINE API error:', response.status, response.statusText, errorText);
    } else {
      console.log('✅ LINE reply sent successfully');
    }
  } catch (error) {
    console.error('❌ Failed to send LINE reply:', error.message);
    // Log the intent for manual processing if needed
    console.log('💾 Stored intent can be processed manually via /intents endpoint');
  }
}

// Health check route
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    intentsCount: Object.keys(intents).length 
  });
});

// Get stored intents (for debugging)
app.get('/intents', (req, res) => {
  res.json(intents);
});

// Contract integration endpoints
app.get('/contract-info', async (req, res) => {
  try {
    const info = await contractIntegration.getContractInfo();
    res.json(info);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/balance/:address/:token', async (req, res) => {
  try {
    const { address, token } = req.params;
    const balance = await contractIntegration.getTokenBalance(address, token.toUpperCase());
    res.json({ address, token: token.toUpperCase(), balance });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/create-transaction', async (req, res) => {
  try {
    const { intentId, userAddress } = req.body;
    
    if (!intentId || !intents[intentId]) {
      return res.status(404).json({ error: 'Intent not found' });
    }
    
    if (!userAddress) {
      return res.status(400).json({ error: 'User address required' });
    }
    
    const intent = intents[intentId];
    const transaction = await contractIntegration.createRemittanceTransaction(intent, userAddress);
    
    res.json(transaction);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📱 Webhook endpoint: http://localhost:${PORT}/webhook`);
  console.log(`💚 Health check: http://localhost:${PORT}/health`);
});

module.exports = app;
