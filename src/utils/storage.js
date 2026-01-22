/**
 * Storage abstraction layer
 * Supports both in-memory and Redis storage
 */

/**
 * In-memory storage implementation
 */
class MemoryStorage {
  constructor() {
    this.data = new Map();
  }

  async get(key) {
    return this.data.get(key);
  }

  async set(key, value) {
    this.data.set(key, value);
    return true;
  }

  async delete(key) {
    return this.data.delete(key);
  }

  async has(key) {
    return this.data.has(key);
  }

  async keys() {
    return Array.from(this.data.keys());
  }

  async forEach(callback) {
    this.data.forEach(callback);
  }
}

/**
 * Redis storage implementation
 */
class RedisStorage {
  constructor(redisClient) {
    this.client = redisClient;
    this.connected = false;
  }

  async connect() {
    try {
      await this.client.connect();
      this.connected = true;
      console.log('Redis connected successfully');
    } catch (error) {
      console.error('Redis connection failed:', error.message);
      console.log('Falling back to in-memory storage');
      throw error;
    }
  }

  async get(key) {
    try {
      const value = await this.client.get(key);
      return value ? JSON.parse(value) : undefined;
    } catch (error) {
      console.error('Redis get error:', error);
      return undefined;
    }
  }

  async set(key, value) {
    try {
      await this.client.set(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('Redis set error:', error);
      return false;
    }
  }

  async delete(key) {
    try {
      const result = await this.client.del(key);
      return result > 0;
    } catch (error) {
      console.error('Redis delete error:', error);
      return false;
    }
  }

  async has(key) {
    try {
      const exists = await this.client.exists(key);
      return exists === 1;
    } catch (error) {
      console.error('Redis exists error:', error);
      return false;
    }
  }

  async keys() {
    try {
      return await this.client.keys('*');
    } catch (error) {
      console.error('Redis keys error:', error);
      return [];
    }
  }

  async forEach(callback) {
    try {
      const keys = await this.keys();
      for (const key of keys) {
        const value = await this.get(key);
        callback(value, key);
      }
    } catch (error) {
      console.error('Redis forEach error:', error);
    }
  }

  async disconnect() {
    if (this.connected) {
      await this.client.quit();
      this.connected = false;
    }
  }
}

/**
 * Create storage instance
 * @param {string} type - 'memory' or 'redis'
 * @param {object} options - Redis options if type is 'redis'
 * @returns {Promise<MemoryStorage|RedisStorage>} Storage instance
 */
async function createStorage(type = 'memory', options = {}) {
  if (type === 'redis') {
    try {
      const redis = require('redis');
      const client = redis.createClient(options);
      const storage = new RedisStorage(client);
      await storage.connect();
      return storage;
    } catch (error) {
      console.warn('Redis not available, using in-memory storage');
      return new MemoryStorage();
    }
  }
  return new MemoryStorage();
}

module.exports = {
  MemoryStorage,
  RedisStorage,
  createStorage,
};
