# sham-spam

A Discord bot that posts random facts on a scheduled basis to configured channels and threads.

## Features

- **Scheduled Messages**: Automatically sends random facts to registered channels based on a cron schedule
- **Multi-Channel Support**: Register multiple channels and threads across different guilds
- **Message Cleanup**: Automatically cleans up old bot messages when posting new ones
- **Manual Commands**: Interactive commands for managing channels and triggering actions

## Commands

All commands use the prefix `hey-sham`:

- `hey-sham ping` - Check if the bot is responding
- `hey-sham add` - Add the current channel to receive scheduled messages
- `hey-sham remove` - Remove the current channel from receiving scheduled messages
- `hey-sham list` - Show all channels registered to receive messages (filtered by guild)
- `hey-sham fact` - Get a random fact immediately
- `hey-sham cleanup [days]` - Delete all bot messages from the past X days in the current channel (default: 7)
- `hey-sham status` - Check if the scheduler is currently running
- `hey-sham are you high?` - Discover if the real Sham is currently high
- `hey-sham help` - Show the help message

## Setup

### Prerequisites

- Node.js (v18 or higher)
- A Discord bot token
- Discord bot permissions: Send Messages, Read Message History, Manage Messages

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd sham-spam
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory:
```env
DISCORD_TOKEN=your_discord_bot_token_here
CRON_SCHEDULE=0 0 0 */3 * *
```

The default cron schedule `0 0 0 */3 * *` runs every 3 days at midnight. Modify as needed.

### Running the Bot

**Development mode** (with auto-reload):
```bash
npm run dev
```

**Production mode**:
```bash
npm run build
npm start
```

## Configuration

### Environment Variables

- `DISCORD_TOKEN` (required): Your Discord bot token
- `CRON_SCHEDULE` (optional): Cron pattern for scheduled messages. Default: `0 0 0 */3 * *` (every 3 days at midnight)

### Cron Schedule Examples

- `*/5 * * * *` - Every 5 minutes
- `0 */2 * * *` - Every 2 hours
- `0 9 * * *` - Every day at 9:00 AM
- `0 0 * * 0` - Every Sunday at midnight
- `0 0 1 * *` - First day of every month at midnight

## Database

The bot uses SQLite to store registered channels. The database file `bot-data.sqlite` is created automatically in the project root.

## How It Works

1. When the bot starts, it initializes the database and starts the scheduler
2. On each scheduled run, the bot:
   - Fetches all registered channels from the database
   - For each channel, deletes old bot messages from the past week
   - Sends a new random fact to the channel
3. Users can manually trigger cleanup or get facts on demand using commands

## License

MIT
