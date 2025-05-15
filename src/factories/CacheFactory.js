// factories/CacheFactory.js
const RedisCacheService = require('../services/RedisCacheService');

class CacheFactory {
    static createCache(type, connection) {
        switch (type) {
            case 'redis':
                return new RedisCacheService(connection);
            // Add more cases for different cache types
            default:
                throw new Error('Unsupported cache type');
        }
    }
}

module.exports = CacheFactory;