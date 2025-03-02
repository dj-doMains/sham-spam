import * as dotenv from 'dotenv';

dotenv.config();

export const CONFIG = {
  DISCORD_TOKEN: process.env.DISCORD_TOKEN || '',
  CRON_SCHEDULE: process.env.CRON_SCHEDULE || '0 0 0 */3 * *', // Every 3 days at midnight
};

// Validate configuration
if (!CONFIG.DISCORD_TOKEN) {
  throw new Error('Missing DISCORD_TOKEN in environment variables');
}
