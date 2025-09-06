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
  getTransactionsFromCache(userId, urlSuffix) {
    const key = urlSuffix
      ? `transactions:${userId}:${urlSuffix}`
      : `transactions:${userId}`;
    const cached = transactionCache.get(key);
    if (cached) {
      logger.debug("Cache hit for transactions", { userId, key });
      return cached;
    }
    logger.debug("Cache miss for transactions", { userId, key });
    return null;
  }

  setTransactionsCache(userId, transactions, urlSuffix) {
    const key = urlSuffix
      ? `transactions:${userId}:${urlSuffix}`
      : `transactions:${userId}`;
    transactionCache.set(key, transactions);
    logger.debug("Transactions cached", {
      userId,
      key,
      count: transactions.length,
    });
  }

  invalidateTransactionsCache(userId) {
    const prefix = `transactions:${userId}`;
    const keys = transactionCache.keys();
    const toDelete = keys.filter((k) => k.startsWith(prefix));
    if (toDelete.length > 0) {
      transactionCache.del(toDelete);
    }
    logger.debug("Transactions cache invalidated", {
      userId,
      deleted: toDelete.length,
    });
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
