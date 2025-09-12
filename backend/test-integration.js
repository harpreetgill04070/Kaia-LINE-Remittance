const fetch = require('node-fetch');

async function testIntegration() {
  console.log('🧪 Testing Backend Integration...\n');

  try {
    // Test 1: Health Check
    console.log('1️⃣ Testing Health Check...');
    const healthResponse = await fetch('http://localhost:3000/health');
    const healthData = await healthResponse.json();
    console.log('✅ Health:', healthData.status);
    console.log('📊 Intents Count:', healthData.intentsCount);

    // Test 2: Contract Info
    console.log('\n2️⃣ Testing Contract Integration...');
    const contractResponse = await fetch('http://localhost:3000/contract-info');
    const contractData = await contractResponse.json();
    console.log('✅ Contract Connected:', contractData.isConnected);
    if (contractData.isConnected) {
      console.log('📋 Network:', contractData.network);
      console.log('📋 Chain ID:', contractData.chainId);
      console.log('📋 Fee Rate:', contractData.feeRate);
      console.log('📋 Supported Tokens:', contractData.supportedTokens);
    } else {
      console.log('⚠️ Contract Error:', contractData.error);
    }

    // Test 3: Webhook Test
    console.log('\n3️⃣ Testing Webhook...');
    const webhookPayload = {
      events: [{
        type: 'message',
        message: {
          type: 'text',
          text: 'send 200 USDT to @brother'
        },
        replyToken: 'test-webhook-123',
        source: {
          userId: 'test-user-456',
          type: 'user'
        },
        timestamp: Date.now()
      }]
    };

    const webhookResponse = await fetch('http://localhost:3000/webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'LINEBotWebhook/2.0'
      },
      body: JSON.stringify(webhookPayload)
    });

    const webhookResult = await webhookResponse.text();
    console.log('✅ Webhook Response:', webhookResult);

    // Test 4: Check Stored Intents
    console.log('\n4️⃣ Checking Stored Intents...');
    const intentsResponse = await fetch('http://localhost:3000/intents');
    const intentsData = await intentsResponse.json();
    console.log('✅ Stored Intents:', Object.keys(intentsData).length);
    
    if (Object.keys(intentsData).length > 0) {
      const latestIntent = Object.values(intentsData)[Object.keys(intentsData).length - 1];
      console.log('📋 Latest Intent:', {
        amount: latestIntent.amount,
        token: latestIntent.token,
        recipient: latestIntent.recipient,
        status: latestIntent.status
      });
    }

    // Test 5: Balance Check (if contracts are connected)
    if (contractData.isConnected) {
      console.log('\n5️⃣ Testing Balance Check...');
      const balanceResponse = await fetch('http://localhost:3000/balance/0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266/TT');
      const balanceData = await balanceResponse.json();
      console.log('✅ Balance Check:', balanceData);
    }

    console.log('\n🎉 Integration Test Complete!');

  } catch (error) {
    console.error('❌ Test Error:', error.message);
  }
}

testIntegration();
