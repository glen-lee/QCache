// src/services/RedisCacheService.js
const ICacheService = require('../interfaces/ICacheService');

class RedisCacheService extends ICacheService {
  constructor(connection) {
    super();
    this.connection = connection;
  }

  async get(key, filterPath = '.') {
    return await this.connection.get(key);
  }
  
  async set(key, value) {
    const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
    await this.connection.set(key, stringValue);
  }

  async mGet(keys) {
    if (!keys.length) return [];
    const pipeline = this.connection.multi();
    keys.forEach(key => pipeline.get(key));
    const results = await pipeline.exec();
    return results.map(([err, result]) => (err ? null : result));
  }

  async del(key) {
    await this.connection.del(key);
  }

  async keys(pattern) {
    return await this.connection.keys(pattern);
  }

  async updateFields(key, value, where) {
    try {
      const existingValue = await this.get(key);
      if (!existingValue) throw new Error('Key does not exist.');

      const jsonValue = JSON.parse(existingValue);

      if (Array.isArray(jsonValue)) {
        const index = jsonValue.findIndex(item =>
          Object.keys(where).every(field => item[field] === where[field])
        );

        if (index !== -1) {
          Object.assign(jsonValue[index], value);
        } else {
          throw new Error('No matching item found in the array.');
        }
      } else {
        Object.assign(jsonValue, value);
      }

      await this.set(key, jsonValue);
    } catch (err) {
      throw new Error(`Failed to update JSON object: ${err.message}`);
    }
  }

  multi() {
    return this.connection.multi();
  }

  async exec(pipeline) {
    return await pipeline.exec();
  }
}

module.exports = RedisCacheService;
