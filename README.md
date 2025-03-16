# ARC - Art Registry Consortium

The official website for the Art Registry Consortium (ARC), an open standard designed to document, verify, and manage the provenance of physical artworks on the blockchain.

## About ARC

ARC brings transparency, authenticity, and permanence to physical art records through blockchain technology. The platform allows artists to maintain control of their catalogues, ensuring their legacy remains immutable.

Key features include:
- Decentralized & secure immutable provenance tracking
- Artist-owned contracts
- Evolving documentation for exhibition history and ownership
- Tools for galleries and collectors to verify authenticity

## Development

This project is built with Svelte and uses TailwindCSS for styling. It also integrates with Supabase for database functionality and Web3 for wallet connections.

### Setup

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
   - Edit the `.env` file with your Supabase and WalletConnect credentials

```bash
# Required environment variables:
# PUBLIC_SUPABASE_URL - Your Supabase project URL (client-side)
# PUBLIC_SUPABASE_ANON_KEY - Your Supabase anonymous key (client-side)
# PUBLIC_WALLETCONNECT_ID - Your WalletConnect project ID (client-side)
# SUPABASE_URL - Your Supabase project URL (server-side)
# SUPABASE_SERVICE_KEY - Your Supabase service role key (server-side)
```

3. Start the development server:
```bash
npm run dev

# Or start the server and open in a browser
npm run dev -- --open
```

### Building for Production

```bash
# Create a production build
npm run build

# Preview the production build
npm run preview
```

## Supabase Integration

This project uses Supabase for database functionality.

### Prerequisites

1. A Supabase account and project
2. The Supabase URL and anon key for your project

### Setup Steps

1. Create a Supabase project if you haven't already
2. Set up the required tables in your Supabase database

#### Required Tables

##### Wallets Table

You need to create the `wallets` table in your Supabase database with the following schema:

```sql
CREATE TABLE wallets (
  wallet_address TEXT PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  fee_paid BOOLEAN DEFAULT FALSE,
  setup_completed BOOLEAN DEFAULT FALSE,
  setup_step INTEGER DEFAULT 0
);

-- Enable RLS (Row Level Security)
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anonymous users to insert
CREATE POLICY "Allow anonymous insert" ON wallets
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Create policy to allow users to read their own wallet data
CREATE POLICY "Allow users to read their own wallet data" ON wallets
  FOR SELECT
  TO anon
  USING (true);

-- Create policy to allow users to update their own wallet data
CREATE POLICY "Allow users to update their own wallet data" ON wallets
  FOR UPDATE
  TO anon
  USING (true);
```

#### Environment Variables

Update your `.env` file with the following variables:

```
PUBLIC_SUPABASE_URL=your_supabase_url
PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Replace `your_supabase_url` and `your_supabase_anon_key` with the actual values from your Supabase project.

### How It Works

When a user connects their wallet and signs the verification message, the system will:

1. Check if a wallet entry exists in the Supabase database
2. If not, create a new entry with:
   - `fee_paid` set to `false`
   - `setup_completed` set to `false`
   - `setup_step` set to `0`
3. If the wallet entry already exists, update the `last_login` timestamp

This integration ensures that all connected wallets are tracked in the database, allowing for features like:
- Tracking user onboarding progress
- Managing fee payment status
- Storing user preferences and settings

### Testing

To test the integration:
1. Connect your wallet to the website
2. Sign the verification message
3. Check the Supabase database to confirm that a wallet entry was created

## Contributing

We welcome contributions to the ARC website. Please feel free to submit issues or pull requests to our [GitHub repository](https://github.com/ArtRegistryConsortium).

## Connect with ARC

- [GitHub](https://github.com/ArtRegistryConsortium)
- [Discord](https://discord.gg/TFkNXhhP)
- [X (Twitter)](https://x.com/art_registry_c)
- [Threads](https://www.threads.net/@art_registry_c)
