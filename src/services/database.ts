import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import { TextChannel } from 'discord.js';

export class DatabaseService {
  private db: Database | null = null;

  /**
   * Initialize the database
   */
  public async initialize(): Promise<void> {
    try {
      this.db = await open({
        filename: './bot-data.sqlite',
        driver: sqlite3.Database,
      });

      // Create channels table if it doesn't exist
      await this.db.exec(`
        CREATE TABLE IF NOT EXISTS channels (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          guild_id TEXT NOT NULL,
          guild_name TEXT NOT NULL,
          added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Failed to initialize database:', error);
      throw error;
    }
  }

  /**
   * Add a channel to the database
   */
  public async addChannel(channel: TextChannel): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    try {
      // Check if channel already exists
      const existing = await this.db.get('SELECT id FROM channels WHERE id = ?', channel.id);

      if (existing) {
        // Update existing channel
        await this.db.run(
          'UPDATE channels SET name = ?, guild_id = ?, guild_name = ?, added_at = CURRENT_TIMESTAMP WHERE id = ?',
          channel.name,
          channel.guild.id,
          channel.guild.name,
          channel.id
        );
        return;
      }

      // Insert new channel
      await this.db.run(
        'INSERT INTO channels (id, name, guild_id, guild_name) VALUES (?, ?, ?, ?)',
        channel.id,
        channel.name,
        channel.guild.id,
        channel.guild.name
      );

      console.log(`Channel ${channel.name} (${channel.id}) added to database`);
    } catch (error) {
      console.error('Failed to add channel to database:', error);
      throw error;
    }
  }

  /**
   * Get all channels from the database
   */
  public async getAllChannels(): Promise<any[]> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    try {
      return await this.db.all('SELECT * FROM channels ORDER BY added_at DESC');
    } catch (error) {
      console.error('Failed to get channels from database:', error);
      throw error;
    }
  }

  /**
   * Get all channels from the database for a guild
   */
  public async getAllChannelsByGuildId(guildId: string): Promise<any[]> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    try {
      return await this.db.all('SELECT * FROM channels WHERE guild_id = ? ORDER BY added_at DESC', guildId);
    } catch (error) {
      console.error('Failed to get channels from database:', error);
      throw error;
    }
  }

  /**
   * Remove a channel from the database
   */
  public async removeChannel(channelId: string): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    try {
      await this.db.run('DELETE FROM channels WHERE id = ?', channelId);
      console.log(`Channel ${channelId} removed from database`);
    } catch (error) {
      console.error('Failed to remove channel from database:', error);
      throw error;
    }
  }

  /**
   * Close the database connection
   */
  public async close(): Promise<void> {
    if (this.db) {
      await this.db.close();
      this.db = null;
      console.log('Database connection closed');
    }
  }
}
