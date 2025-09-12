
# Kaia Remittance

A full-stack remittance platform leveraging LINE Messaging, LIFF mini-app, and Ethereum smart contracts for secure token transfers.

---

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Features](#features)
- [Project Structure](#project-structure)
- [Setup & Installation](#setup--installation)
  - [Backend](#backend)
  - [Smart Contracts](#smart-contracts)
  - [Frontend (LIFF Mini-App)](#frontend-liff-mini-app)
- [Usage](#usage)
- [API Endpoints](#api-endpoints)
- [Smart Contracts](#smart-contracts-details)
- [Testing](#testing)
- [Environment Variables](#environment-variables)
- [Development Notes](#development-notes)
- [License](#license)

---

## Overview

Kaia Remittance enables users to initiate and complete token transfers via LINE chat and a LIFF mini-app. The backend parses remittance intents from LINE messages, generates deep links to the LIFF app, and interacts with Ethereum smart contracts for secure token transfers.

---

## Architecture

- **LINE Bot**: Receives remittance requests via chat.
- **Backend (Node.js/Express)**: Parses intents, stores them, generates LIFF links, and interacts with smart contracts.
- **LIFF Mini-App (React/Vite)**: Guides users through wallet connection and transaction execution.
- **Smart Contracts (Hardhat/Solidity)**: Handles token transfers and fee collection.

---

## Features

- LINE webhook integration with signature verification.
- Natural language parsing for remittance requests.
- In-memory intent storage with unique IDs.
- LIFF deep link generation with prefilled transaction parameters.
- Rich Flex Messages for transaction details.
- Smart contract integration for token transfers and fee management.
- Health check and debugging endpoints.

---

## Project Structure

```
kaia-remittance/
├── backend/            # Node.js Express backend
├── contracts/          # Hardhat smart contracts
├── frontend/           # LIFF mini-app (React + Vite)
```

---

## Setup & Installation

### Backend

1. **Install dependencies:**
   ```bash
   cd backend
   npm install
   ```

2. **Configure environment variables:**
   - Copy and edit `.env` and `env.contracts`:
     ```bash
     cp env.example .env
     cp env.contracts.example env.contracts
     ```
   - Add your LINE credentials and contract addresses.

3. **Start the backend server:**
   ```bash
   npm run dev   # Development (nodemon)
   npm start     # Production
   ```

### Smart Contracts

1. **Install dependencies:**
   ```bash
   cd contracts
   npm install
   ```

2. **Compile contracts:**
   ```bash
   npx hardhat compile
   ```

3. **Deploy contracts locally:**
   ```bash
   npx hardhat node
   npx hardhat run scripts/deploy.js --network localhost
   ```
   - Deployment info is saved to `deployment-info.json`.

4. **Run tests:**
   ```bash
   npx hardhat test
   ```

### Frontend (LIFF Mini-App)

1. **Install dependencies:**
   ```bash
   cd frontend/vite-project
   npm install
   ```

2. **Start development server:**
   ```bash
   npm run dev
   ```

3. **Build for production:**
   ```bash
   npm run build
   ```

4. **Serve static files:**
   ```bash
   cd ..
   npm start   # Runs Express static server
   ```

---

## Usage

### LINE Bot

- Send a message in the format:
  ```
  send <amount> <token> to @<recipient>
  ```
  Example: `send 100 USDT to @mom`

- The bot replies with a Flex Message and a button to open the LIFF mini-app.

### LIFF Mini-App

- Connect your wallet.
- Review transaction details.
- Execute the transaction (calls backend, which interacts with the smart contract).

---

## API Endpoints

**Backend (`/backend/server.js`):**

- `POST /webhook`  
  LINE Messaging API webhook endpoint. Parses remittance requests and replies with Flex Messages.

- `GET /health`  
  Health check endpoint.

- `GET /intents`  
  Returns stored remittance intents.

- `GET /contract-info`  
  Returns contract/network info.

- `GET /balance/:address/:token`  
  Returns token balance for a given address.

- `POST /create-transaction`  
  Initiates a remittance transaction via smart contract.

---

## Smart Contracts Details

**RemittanceRouter.sol**

- Allows owner to set allowed tokens and fee rates.
- Handles remittance transactions, charging a fee and transferring net amount to recipient.
- Emits events for each transaction.

**TestToken.sol**

- Simple ERC20-like token for testing.

**Lock.sol**

- Example contract for time-locked Ether withdrawals.

---

## Testing

- **Backend Integration:**  
  Run `node test-integration.js` in the backend folder to test endpoints and contract connectivity.

- **Smart Contracts:**  
  Run `npx hardhat test` in the contracts folder.

---

## Environment Variables

**Backend `.env` and `env.contracts`:**

- `LINE_CHANNEL_ACCESS_TOKEN`  
- `LINE_CHANNEL_SECRET`  
- `LIFF_APP_URL`  
- `REMITTER_ROUTER_ADDRESS`  
- `TEST_TOKEN_ADDRESS`  
- `USDT_CONTRACT_ADDRESS`  
- `USDC_CONTRACT_ADDRESS`  
- `NETWORK_NAME`  
- `CHAIN_ID`  
- `RPC_URL`  

**Frontend:**  
- Configure LIFF ID and backend URL in `index.html` or via environment variables.

---

## Development Notes

- Contracts are deployed locally by default (`localhost:8545`, chainId `31337`).
- Update contract addresses in backend and frontend after deployment.
- Intents are stored in memory; use a database for production.
- For production, deploy contracts to Sepolia or Polygon and update RPC URLs and addresses.

---

## License

MIT

---

## References

- [LINE Messaging API](https://developers.line.biz/en/docs/messaging-api/)
- [LIFF App](https://developers.line.biz/en/docs/liff/)
- [Hardhat](https://hardhat.org/)
- [Vite](https://vitejs.dev/)
- [React](https://react.dev/)
