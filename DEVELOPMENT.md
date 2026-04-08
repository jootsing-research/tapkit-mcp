# Development

## Local Setup

```bash
git clone https://github.com/Jootsing-Research/tapkit-mcp.git
cd tapkit-mcp
npm install
cp .env.example .env  # Add your TAPKIT_API_KEY
```

## Commands

```bash
npm run dev          # Start with hot reload (tsx watch)
npm run build        # Compile TypeScript
npm run typecheck    # Type check without emitting
```

## Local MCP Config

Configure your agent to use the stdio transport:

```json
{
  "mcpServers": {
    "tapkit": {
      "command": "npx",
      "args": ["tsx", "src/index.ts"],
      "cwd": "/path/to/tapkit-mcp",
      "env": {
        "TAPKIT_API_KEY": "tk_your_key"
      }
    }
  }
}
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `TAPKIT_API_KEY` | Yes (local) | Your TapKit API key (`tk_...`) |
| `TAPKIT_API_URL` | No | API base URL (default: `https://api.tapkit.ai/v1`) |
| `SUPABASE_URL` | Yes (OAuth) | Supabase project URL |
| `SUPABASE_ANON_KEY` | Yes (OAuth) | Supabase anonymous key |
| `OAUTH_SIGNING_SECRET` | Yes (OAuth) | Random secret for signing auth codes |
| `MCP_SERVER_URL` | Yes (OAuth) | Public URL for OAuth redirects |
