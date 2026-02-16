# Semicolon

A decentralized marketplace for encrypted digital assets built on NEAR Protocol, leveraging NOVA SDK for privacy-first file storage and AI-powered credibility scoring via TEE (Trusted Execution Environment) and Near Intents for seamless cross chain payments.

## 🌟 Overview

Semicolon enables users to securely buy and sell digital assets with end-to-end encryption. Files are encrypted clientside, stored on NOVA Protocol, and access is managed through NEAR smart contracts. Each listing is verified using NEAR AI's private inference in TEE for credibility scoring.

Each listing is verified using NEAR AI's private inference running in a Trusted Execution Environment (TEE), providing an AI-powered credibility score that helps buyers assess product quality before purchase. The entire system is built on zero-knowledge principles: encryption keys are managed off-chain in hardware-secured TEEs via Shade Agents, sellers maintain granular control over who can decrypt their files, and even cloud providers cannot access the plaintext data. This creates a decentralized marketplace where privacy, security, and transparency coexist—you own your data, control who accesses it, and can verify every transaction on-chain while keeping your intellectual property completely private. 


### Key Features

- 🔑**Contract Address**: singlelibrary5839.near
- 🔐 **End-to-End Encryption**: Files encrypted client-side using AES-256-GCM
- 🌐 **Decentralized Storage**: IPFS storage via NOVA Protocol with Pinata
- 🤖 **AI Credibility Scoring**: TEE-verified analysis (20-100 score)
- 💳 **Multi-Chain Payments**: NEAR, Optimism, Arbitrum, Ethereum support
- 🔑 **Granular Access Control**: Smart contract-managed buyer access
- 🛡️ **Privacy-First**: Zero-knowledge architecture with TEE attestation
- 🚀 **Cross-Chain Swaps**: 1Click api(Near Intent) integration

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- NEAR account
- NOVA account from [nova-sdk.com](https://nova-sdk.com)
- MetaMask (for cross-chain payments)

### Installation
```bash
# Clone repository
git clone https://github.com/yourusername/novamarket.git
cd novamarket

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your API keys

# Start development server
npm run dev
```

Visit `http://localhost:5173`

### Environment Variables
```env

# NEAR AI API Key (for TEE credibility scoring)
VITE_OPENAI_API_KEY=your_near_ai_key

# 1Click api Token (for cross-chain swaps)
VITE_TOKEN=your_1click_token
```

## 📖 Usage Guide

### 1. Connect Wallet & Setup NOVA

1. Click **"LOGIN"** to connect NEAR testnet wallet
2. Click **"Setup NOVA"** to configure credentials:
   - NOVA Account ID (ends with `.nova-sdk.near`)
   - API Key (starts with `nova_sk_`)

### 2. Upload & List Files

1. Navigate to **Upload** page
2. Select asset type (Image/Dataset/Audio/Other)
3. Set price in NEAR
4. Add description (for AI scoring)
5. Upload file

**Process:**
- AI analyzes file → TEE credibility score
- File encrypted client-side
- Uploaded to IPFS via NOVA
- Listing created on NEAR contract

### 3. Buy Digital Assets

1. Browse **Marketplace**
2. View TEE credibility scores:
   - 80-100 (Green) - Highly trustworthy
   - 60-79 (Yellow) - Good quality
   - 40-59 (Orange) - Moderate
   - <40 (Red) - Low credibility

3. Choose payment method(powered by near intents):
   - **Direct NEAR**: Fastest, no fees
   - **Cross-Chain**: Pay with USDC/ETH from other chains

### 4. Manage Access (Sellers)

1. Navigate to **Profile** page
2. View pending buyers
3. Click **"Grant Access"** to:
   - Add buyers to NOVA group
   - Update contract access
   - Enable file decryption

## 🔐 Security Architecture

### Multi-Layer Protection

1. **Client-Side Encryption**: AES-256-GCM before upload
2. **TEE Key Management**: Hardware-enforced isolation via Shade Agents
3. **Smart Contract Access**: On-chain authorization tracking
4. **AI Verification**: Private inference in TEE for credibility

### Privacy Guarantees

- Files: Always encrypted
- Keys: Off-chain in TEE only
- Metadata: Minimal on-chain footprint
- AI Analysis: Zero data leakage

## 🏗️ Architecture
```
User Interface (React + TypeScript)
         ↓
   NEAR Wallet + MetaMask
         ↓
    ┌────┴────┐
    ↓         ↓
NEAR Chain   NOVA Protocol (Mainnet)
    ↓
    ↓        IPFS + Shade/TEE
    ↓
Smart Contract
(Marketplace Logic)
```

## 📝 Smart Contract API
```rust
// Create listing
create_listing(product_id, price, nova_group_id, ...)

// Purchase
buy(p_id, nova_account_id)

// Grant access (owner only)
grant_buyer_access(p_id, buyer)

// View functions
get_listings() -> Vec<Listing>
has_access(p_id, buyer) -> bool
```

## 🔄 Cross-Chain Payments

Powered by 1Click API:

1. Select origin chain (Optimism/Arbitrum/Ethereum)
2. 1Click generates deposit address
3. Send USDC/ETH via MetaMask
4. Atomic swap to wNEAR on NEAR
5. Payment delivered to seller

## 🐛 Troubleshooting

**"NOVA credentials not configured"**
- Setup credentials from [nova-sdk.com](https://nova-sdk.com)
- Account must end with `.nova-sdk.near`
- API key must start with `nova_sk_`

**"Failed to grant access"**
- Verify ownership of listing
- Check buyer has purchased
- Ensure NOVA credentials configured

**CORS errors**
- Vite proxy handles automatically
- Restart dev server if needed

## 📚 Documentation

- [NOVA Protocol](https://nova-25.gitbook.io/nova-docs/)
- [NEAR Protocol](https://docs.near.org)
- [NEAR AI Cloud](https://docs.near.ai)
- [1Click Protocol](https://docs.defuse.org)

## 🤝 Contributing

Contributions welcome!

1. Fork repository
2. Create feature branch
3. Commit changes
4. Push and open PR

## 📄 License

MIT License - see LICENSE file

## 🙏 Acknowledgments

Built with:
- **NOVA Protocol** - Encrypted storage
- **NEAR Protocol** - Smart contracts
- **NEAR AI Cloud** - Private inference
- **1Click Protocol** - Cross-chain swaps
- **Shade Agents** - TEE key management

---

**Built with ❤️ for the decentralized future**
