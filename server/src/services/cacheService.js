/**
 * Cache Service for Quizify API
 * Seamlessly switches between high-performance Redis and local memory fallback storage.
 */

const Redis = require('ioredis');
const env = require('../config/env');

class CacheService {
  constructor() {
    this.redisClient = null;
    this.memoryCache = new Map();

    // Connect to Redis if REDIS_URL is configured and active
    if (env.REDIS_URL && env.REDIS_URL !== 'redis://localhost:6379' && env.REDIS_URL !== '') {
      try {
        console.log(`[Cache] Initializing Redis connection to: ${env.REDIS_URL}`);
        this.redisClient = new Redis(env.REDIS_URL, {
          maxRetriesPerRequest: 1,
          connectTimeout: 3000,
        });

        this.redisClient.on('error', (err) => {
          console.warn('[Cache] Redis error detected. Falling back to secure in-memory cache:', err.message);
          this.redisClient = null; // Disable Redis and fallback
        });
      } catch (err) {
        console.warn('[Cache] Redis setup failed, utilizing in-memory cache:', err.message);
      }
    } else {
      console.log('[Cache] REDIS_URL not configured. Utilizing in-memory cache storage.');
    }
  }

  /**
   * Retrieves data from Cache
   * @param {string} key
   * @returns {Promise<any>}
   */
  async get(key) {
    if (this.redisClient) {
      try {
        const val = await this.redisClient.get(key);
        return val ? JSON.parse(val) : null;
      } catch (err) {
        console.warn(`[Cache] Redis GET failed for key: ${key}. Using in-memory fallback.`, err.message);
      }
    }

    const item = this.memoryCache.get(key);
    if (!item) return null;

    if (item.expiry && Date.now() > item.expiry) {
      this.memoryCache.delete(key);
      return null;
    }
    return item.value;
  }

  /**
   * Stores data in Cache with Time-To-Live (TTL)
   * @param {string} key
   * @param {any} value
   * @param {number} ttlSeconds
   */
  async set(key, value, ttlSeconds = 60) {
    if (this.redisClient) {
      try {
        await this.redisClient.set(key, JSON.stringify(value), 'EX', ttlSeconds);
        return true;
      } catch (err) {
        console.warn(`[Cache] Redis SET failed for key: ${key}. Using in-memory fallback.`, err.message);
      }
    }

    this.memoryCache.set(key, {
      value,
      expiry: Date.now() + (ttlSeconds * 1000),
    });
    return true;
  }

  /**
   * Evicts a key from Cache
   * @param {string} key
   */
  async delete(key) {
    if (this.redisClient) {
      try {
        await this.redisClient.del(key);
        return true;
      } catch (err) {
        console.warn(`[Cache] Redis DEL failed for key: ${key}. Using in-memory fallback.`, err.message);
      }
    }

    this.memoryCache.delete(key);
    return true;
  }

  /**
   * Flushes all stored cache contents
   */
  async flush() {
    if (this.redisClient) {
      try {
        await this.redisClient.flushdb();
        return true;
      } catch (err) {
        console.warn('[Cache] Redis FLUSH failed. Using in-memory fallback.', err.message);
      }
    }

    this.memoryCache.clear();
    return true;
  }
}

module.exports = new CacheService();
