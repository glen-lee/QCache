// src/utils/generateCacheKey.js
const crypto = require('crypto');

function generateCacheKey(cacheName, params) {
  const upperCaseParams = {};
  for (const [key, value] of Object.entries(params)) {
    // Call toUpperCase() to make params consistent with OracleDb
    upperCaseParams[key.toUpperCase()] = value;
  }
  const paramString = JSON.stringify(upperCaseParams);
  const hash = cacheName + '_' + crypto.createHash('md5').update(paramString).digest('hex');
  return hash;
}

module.exports = generateCacheKey;
