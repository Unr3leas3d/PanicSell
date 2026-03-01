# Setup Guide - Panic Sell

## API Keys
1. **Helius**: Get an API key from [Helius.dev](https://helius.dev).
2. **Jupiter**: No key required for basic usage, but a partner key is recommended for high volume.

## Environment Variables
Create a `.env.local` file in the root with the following:
```bash
NEXT_PUBLIC_HELIUS_RPC_URL=https://mainnet.helius-rpc.com/?api-key=YOUR_API_KEY
```

## Security Audit Notes
* All API requests that require keys are performed server-side or via environment variables.
* No private keys are ever stored; the application only requests signatures from the wallet adapter.
