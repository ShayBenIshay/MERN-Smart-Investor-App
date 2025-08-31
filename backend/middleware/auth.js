const jwt = require("jsonwebtoken");
const User = require("../models/User");
const asyncHandler = require("../utils/asyncHandler");

// Get config based on environment
const env = process.env.NODE_ENV || "development";
const config = require("../config/config")[env];

const auth = asyncHandler(async (req, res, next) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");

  if (!token) {
    return res.status(401).json({ success: false, error: "No token provided" });
  }

  const decoded = jwt.verify(token, config.jwtSecret);
  const user = await User.findById(decoded.userId);

  if (!user) {
    return res.status(401).json({ success: false, error: "Invalid token" });
  }

  req.user = user;
  next();
});

module.exports = auth;
