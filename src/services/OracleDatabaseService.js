// src/services/OracleDatabaseService.js
const oracledb = require('oracledb');
const IDatabaseService = require('../interfaces/IDatabaseService');

class OracleDatabaseService extends IDatabaseService {
  constructor(pool) {
    super();
    this.pool = pool;
  }

  async select(sql, params) {
    let connection;
    try {
      connection = await this.pool.getConnection();
      const result = await connection.execute(sql, params, { outFormat: oracledb.OUT_FORMAT_OBJECT });
      return result.rows ?? [];
    } finally {
      if (connection) {
        await connection.close();
      }
    }
  }
}

module.exports = OracleDatabaseService;
