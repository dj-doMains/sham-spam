import { Client, GatewayIntentBits, Message, TextChannel, ThreadChannel } from 'discord.js';
import { CONFIG } from './config';
import { SchedulerService } from './services/scheduler';
import { DatabaseService } from './services/database';
import { getFact } from './services/factsApi';

// Configure Discord client with necessary intents
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
});

// Initialize scheduler service
let schedulerService: SchedulerService;
const databaseService = new DatabaseService();

// Command prefix
const prefix = 'hey-sham';

// Log when the bot is ready
client.once('ready', async () => {
  console.log(`Logged in as ${client.user?.tag}`);
  console.log('Bot is online and ready!');

  // Initialize database
  try {
    await databaseService.initialize();
  } catch (error) {
    console.error('Failed to initialize database, exiting...');
    client.destroy();
    process.exit(1);
  }

  // Initialize and start the scheduler
  schedulerService = new SchedulerService(client, databaseService);
  schedulerService.startScheduler();
});

// Handle messages
client.on('messageCreate', async (message: Message) => {
  // Ignore messages from bots or messages that don't start with the prefix
  if (message.author.bot || !message.content.startsWith(prefix)) return;

  // Parse the command and arguments
  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const command = args?.join(' ')?.toLowerCase();

  const isTextChannel = message.channel instanceof TextChannel || message.channel instanceof ThreadChannel;

  // Handle different commands
  if (command === 'ping') {
    // Simple ping command to check if the bot is responding
    await message.reply('Pong! 🏓');
  } else if (command === 'add') {
    // Add current channel to database
    if (isTextChannel) {
      await databaseService.addChannel(message.channel as TextChannel);
      await message.reply(`Channel **${message.channel.name}** has been added to the list!`);
    } else {
      await message.reply('This command can only be used in a text channel.');
    }
  } else if (command === 'remove') {
    // Remove current channel from database
    if (isTextChannel) {
      await databaseService.removeChannel(message.channel.id);
      await message.reply(`Channel **${message.channel.name}** has been removed from the list.`);
    } else {
      await message.reply('This command can only be used in a text channel.');
    }
  } else if (command === 'list') {
    // List all channels in database
    const channels = await databaseService.getAllChannelsByGuildId(message.guildId ?? '');
    if (channels.length === 0) {
      await message.reply('No channels have been added yet.');
    } else {
      const channelList = channels.map((c) => `- **${c.name}** in **${c.guild_name}**`).join('\n');
      await message.reply(`**Channels receiving scheduled messages**:\n${channelList}`);
    }
  } else if (command === 'status') {
    // Check scheduler status
    const status = schedulerService.isRunning() ? 'running' : 'stopped';
    await message.reply(`The scheduler is currently ${status}.`);
  } else if (command === 'are you high?') {
    await message.reply('Yes');
  } else if (command === 'fact') {
    await message.reply(await getFact());
  } else if (command === 'help') {
    // Help command
    const helpMessage = `
Available commands:
- \`${prefix} ping\` - Check if the bot is responding
- \`${prefix} add\` - Adds the channel to the list to spam
- \`${prefix} remove\` - Removes the channel to the list to spam
- \`${prefix} list\` - Shows all channels listed to spam
- \`${prefix} fact\` - Find out something you don't know
- \`${prefix} status\` - Check if the scheduler is currently running
- \`${prefix} are you high?\` - Discover if the real Sham is currently high
- \`${prefix} help\` - Show this help message
`;
    await message.reply(helpMessage);
  }
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('Shutting down...');
  if (schedulerService) {
    schedulerService.stopScheduler();
  }
  client.destroy();
  process.exit(0);
});

// Handle errors
client.on('error', (error) => {
  console.error('Discord client error:', error);
});

// Login to Discord
client.login(CONFIG.DISCORD_TOKEN).catch((error) => {
  console.error('Failed to login:', error);
  process.exit(1);
});
