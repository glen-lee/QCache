const CacheFactory = require('./factories/CacheFactory');
const DatabaseFactory = require('./factories/DatabaseFactory');
const generateCacheKey = require('./utils/generateCacheKey');

class QCache {
  constructor(cacheType, dbType, cacheConnection, dbConnection) {
    this.cache = CacheFactory.createCache(cacheType, cacheConnection);
    this.database = DatabaseFactory.createDatabase(dbType, dbConnection);
  }

  async setCache(key, value) {
    return await this.cache.set(key, value);
  }

  async getCache(key, filterPath = '.') {
    return await this.cache.get(key, filterPath);
  }

  async updateCacheFields(cacheName, params, field, value) {
    if (typeof this.cache.updateFields === 'function') {
      const cacheKey = generateCacheKey(cacheName, params);
      return await this.cache.updateFields(cacheKey, field, value);
    }
  }

  async selectDatabase(query, params) {
    return await this.database.select(query, params);
  }

  async setData(cacheName, query, keys) {
    if (typeof this.cache.mGet === 'function' && typeof this.cache.multi === 'function') {
      const result = await this.selectDatabase(query, {});
      console.log("Db query has finished");
      const newDataMap = new Map();
      const redisPipeline = this.cache.multi();

      // Populate newDataMap with current Oracle data
      for (const row of result) {
        const keyParams = {};
        keys.forEach(key => {
          keyParams[key] = row[key.toUpperCase()];
        });
        const cacheKey = generateCacheKey(cacheName, keyParams);
        if (!newDataMap.has(cacheKey)) {
          newDataMap.set(cacheKey, []);
        }
        newDataMap.get(cacheKey).push(row);
      }

      // Get all keys that may exist in Redis for this cacheName
      const existingKeys = await this.cache.keys(`${cacheName}_*`);
      const existingData = existingKeys.length > 0 ? await this.cache.mGet(existingKeys) : [];
      const existingDataMap = new Map();
      existingKeys.forEach((key, index) => {
        if (existingData[index]) {
          existingDataMap.set(key, JSON.parse(existingData[index]));
        }
      });

      // Delete keys in Redis that are no longer in the Oracle data
      for (const existingKey of existingKeys) {
        if (!newDataMap.has(existingKey)) {
          redisPipeline.del(existingKey);
        }
      }

      // Process each cache key and determine what to update in Redis
      for (const [cacheKey, newRows] of newDataMap.entries()) {
        const existingRows = Array.isArray(existingDataMap.get(cacheKey)) ? existingDataMap.get(cacheKey) : [];
        const existingRowsSet = new Set(existingRows.map(row => JSON.stringify(row)));

        // Determine rows to add or update
        const rowsToAddOrUpdate = newRows.filter(newRow => {
          return !existingRowsSet.has(JSON.stringify(newRow));
        });

        if (rowsToAddOrUpdate.length > 0) {
          // Merge existing rows with new rows
          const updatedRows = [...existingRows, ...rowsToAddOrUpdate];
          redisPipeline.set(cacheKey, JSON.stringify(updatedRows));
        }
      }

      // Execute the Redis pipeline
      try {
        await redisPipeline.exec();
        console.log('Data has been synchronized with the Oracle database and cached successfully.');
      } catch (err) {
        console.error('Error executing Redis pipeline:', err);
        throw new Error('Failed to synchronize data with Redis.');
      }
    } else {
      console.log('Cache service does not support multi or mSet');
    }
  }

  async getData(cacheName, query, params, filterPath = '.') {
    const cacheKey = generateCacheKey(cacheName, params);
    const cachedJson = await this.getCache(cacheKey, filterPath);

    if (cachedJson) {
      const parsed = JSON.parse(cachedJson);
      return { fromCache: true, data: parsed };
    } else {
      const result = await this.selectDatabase(query, params);
      return { fromCache: false, data: result };
    }
  }

}

module.exports = QCache;