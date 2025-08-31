const cacheService = require("../services/cacheService");
const asyncHandler = require("../utils/asyncHandler");

/**
 * Middleware to cache user data in authentication
 */
const cacheUser = asyncHandler(async (req, res, next) => {
  if (!req.user?._id) {
    return next();
  }

  const userId = req.user._id.toString();
  const cachedUser = cacheService.getUserFromCache(userId);

  if (cachedUser) {
    req.user = cachedUser;
    return next();
  }

  // Cache the user after the request if it's successful
  const originalSend = res.send;
  res.send = function (data) {
    if (res.statusCode === 200 && req.user) {
      cacheService.setUserCache(userId, req.user);
    }
    originalSend.call(this, data);
  };

  next();
});

/**
 * Middleware to cache transaction lists
 */
const cacheTransactions = (req, res, next) => {
  if (!req.user?._id) {
    return next();
  }

  const userId = req.user._id.toString();
  const cachedTransactions = cacheService.getTransactionsFromCache(userId);

  if (cachedTransactions) {
    return res.json({
      success: true,
      data: cachedTransactions,
      cached: true,
    });
  }

  // Cache the transactions after successful fetch
  const originalJson = res.json;
  res.json = function (data) {
    if (res.statusCode === 200 && data.success && data.data) {
      cacheService.setTransactionsCache(userId, data.data);
    }
    originalJson.call(this, data);
  };

  next();
};

/**
 * Middleware to invalidate user cache when user data changes
 */
const invalidateUserCache = (req, res, next) => {
  const originalJson = res.json;
  res.json = function (data) {
    if (res.statusCode === 200 && req.user?._id) {
      const userId = req.user._id.toString();
      cacheService.invalidateUserCache(userId);
    }
    originalJson.call(this, data);
  };
  next();
};

/**
 * Middleware to invalidate transaction cache when transactions change
 */
const invalidateTransactionCache = (req, res, next) => {
  const originalJson = res.json;
  res.json = function (data) {
    if ((res.statusCode === 200 || res.statusCode === 201) && req.user?._id) {
      const userId = req.user._id.toString();
      cacheService.invalidateTransactionsCache(userId);
    }
    originalJson.call(this, data);
  };
  next();
};

module.exports = {
  cacheUser,
  cacheTransactions,
  invalidateUserCache,
  invalidateTransactionCache,
};
