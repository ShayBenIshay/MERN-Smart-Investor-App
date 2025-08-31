const NodeCache = require("node-cache");
const logger = require("../utils/logger");

// Create cache instances with different TTL for different data types
const userCache = new NodeCache({
  stdTTL: 300, // 5 minutes for user data
  checkperiod: 60, // Check for expired keys every minute
  useClones: false, // Better performance, but be careful with object mutations
});

const transactionCache = new NodeCache({
  stdTTL: 120, // 2 minutes for transaction lists
  checkperiod: 60,
});

class CacheService {
  // User cache methods
  getUserFromCache(userId) {
    const cached = userCache.get(`user:${userId}`);
    if (cached) {
      logger.debug("Cache hit for user", { userId });
      return cached;
    }
    logger.debug("Cache miss for user", { userId });
    return null;
  }

  setUserCache(userId, userData) {
    userCache.set(`user:${userId}`, userData);
    logger.debug("User cached", { userId });
  }

  invalidateUserCache(userId) {
    userCache.del(`user:${userId}`);
    logger.debug("User cache invalidated", { userId });
  }

  // Transaction cache methods
  getTransactionsFromCache(userId) {
    const cached = transactionCache.get(`transactions:${userId}`);
    if (cached) {
      logger.debug("Cache hit for transactions", { userId });
      return cached;
    }
    logger.debug("Cache miss for transactions", { userId });
    return null;
  }

  setTransactionsCache(userId, transactions) {
    transactionCache.set(`transactions:${userId}`, transactions);
    logger.debug("Transactions cached", { userId, count: transactions.length });
  }

  invalidateTransactionsCache(userId) {
    transactionCache.del(`transactions:${userId}`);
    logger.debug("Transactions cache invalidated", { userId });
  }

  // General cache methods
  clearAllCache() {
    userCache.flushAll();
    transactionCache.flushAll();
    logger.info("All caches cleared");
  }

  getCacheStats() {
    return {
      userCache: {
        keys: userCache.keys().length,
        hits: userCache.getStats().hits,
        misses: userCache.getStats().misses,
      },
      transactionCache: {
        keys: transactionCache.keys().length,
        hits: transactionCache.getStats().hits,
        misses: transactionCache.getStats().misses,
      },
    };
  }
}

module.exports = new CacheService();
