
// factories/DatabaseFactory.js
const OracleDatabaseService = require('../services/OracleDatabaseService');

class DatabaseFactory {
    static createDatabase(type, connection) {
        switch (type) {
            case 'oracle':
                return new OracleDatabaseService(connection);
            // Add more cases for different database types
            default:
                throw new Error('Unsupported database type');
        }
    }
}

module.exports = DatabaseFactory;