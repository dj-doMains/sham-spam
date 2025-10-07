import { Client, TextChannel, ThreadChannel } from 'discord.js';
import * as cron from 'node-cron';
import { CONFIG } from '../config';
import { DatabaseService } from './database';
import { getFact } from './factsApi';

export class SchedulerService {
  private client: Client;
  private database: DatabaseService;
  private schedule: cron.ScheduledTask | null = null;

  constructor(client: Client, database: DatabaseService) {
    this.client = client;
    this.database = database;
  }

  /**
   * Start the message scheduler
   */
  public startScheduler(): void {
    if (this.schedule) {
      this.stopScheduler();
    }

    this.schedule = cron.schedule(CONFIG.CRON_SCHEDULE, async () => {
      try {
        await this.sendScheduledMessage();
      } catch (error) {
        console.error('Failed to send scheduled message:', error);
      }
    });

    console.log(`Scheduler started with cron pattern: ${CONFIG.CRON_SCHEDULE}`);
  }

  /**
   * Stop the message scheduler
   */
  public stopScheduler(): void {
    if (this.schedule) {
      this.schedule.stop();
      this.schedule = null;
      console.log('Scheduler stopped');
    }
  }

  /**
   * Check if the scheduler is running
   */
  public isRunning(): boolean {
    return this.schedule !== null;
  }

  /**
   * Clean up old bot messages in a channel
   */
  private async cleanupChannelMessages(channel: TextChannel | ThreadChannel): Promise<number> {
    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const messages = await channel.messages.fetch({ limit: 100 });
    const botMessages = messages.filter(
      msg => msg.author.id === this.client.user?.id && msg.createdTimestamp > oneWeekAgo
    );

    let deletedCount = 0;
    for (const msg of botMessages.values()) {
      await msg.delete();
      deletedCount++;
      console.log(`Deleted old message ${msg.id} from channel ${channel.id}`);
    }

    return deletedCount;
  }

  /**
   * Clean up bot messages in all registered channels
   */
  public async cleanupAllChannels(): Promise<{ total: number; channels: number }> {
    const channels = await this.database.getAllChannels();
    let totalDeleted = 0;
    let channelsProcessed = 0;

    for (const channelData of channels) {
      try {
        const channel = await this.client.channels.fetch(channelData.id);
        const isTextChannel = channel instanceof TextChannel || channel instanceof ThreadChannel;

        if (isTextChannel) {
          const deleted = await this.cleanupChannelMessages(channel);
          totalDeleted += deleted;
          channelsProcessed++;
        }
      } catch (error) {
        console.error(`Error cleaning up channel ${channelData.id}:`, error);
      }
    }

    return { total: totalDeleted, channels: channelsProcessed };
  }

  /**
   * Send the scheduled message to the configured channel
   */
  public async sendScheduledMessage(): Promise<void> {
    console.log('Sending message!');
    try {
      // Get all channels from database
      const channels = await this.database.getAllChannels();

      if (channels.length === 0) {
        console.log('No channels registered for scheduled messages');
        return;
      }

      // Count of successful messages
      let successCount = 0;

      console.log('_ALL_CHANNELS:', channels);

      // Send message to each channel
      for (const channelData of channels) {
        try {
          const channel = await this.client.channels.fetch(channelData.id);
          const isTextChannel = channel instanceof TextChannel || channel instanceof ThreadChannel;

          if (isTextChannel) {
            // Clean up old bot messages from the past week
            try {
              await this.cleanupChannelMessages(channel);
            } catch (cleanupError) {
              console.error(`Error cleaning up messages in channel ${channelData.id}:`, cleanupError);
            }

            const message = await getFact();
            await channel.send(message);
            successCount++;
            console.log(`Message sent to channel: ${channel.name} (${channel.id}) at ${new Date().toISOString()}`);
          } else {
            console.warn(`Channel not found or is not a text channel: ${channelData.id}`);
          }
        } catch (error) {
          console.error(`Error sending message to channel ${channelData.id}:`, error);
        }
      }

      console.log(`Scheduled messages sent to ${successCount}/${channels.length} channels`);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  }
}
