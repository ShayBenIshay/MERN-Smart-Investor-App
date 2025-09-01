const express = require("express");
const User = require("../models/User");
const auth = require("../middleware/auth");
const authService = require("../services/authService");
const asyncHandler = require("../utils/asyncHandler");
const { cacheUser, invalidateUserCache } = require("../middleware/cache");
const {
  registerValidation,
  loginValidation,
  profileUpdateValidation,
} = require("../middleware/joiValidation");

const router = express.Router();

// Register
router.post(
  "/register",
  registerValidation,
  asyncHandler(async (req, res) => {
    const result = await authService.registerUser(req.body, res);
    res.status(201).json({
      success: true,
      ...result,
    });
  })
);

// Login
router.post(
  "/login",
  loginValidation,
  asyncHandler(async (req, res) => {
    const result = await authService.loginUser(req.body, res);
    res.json({
      success: true,
      ...result,
    });
  })
);

// Get current user
router.get(
  "/me",
  auth,
  cacheUser,
  asyncHandler(async (req, res) => {
    res.json({
      success: true,
      user: authService.formatUserResponse(req.user),
    });
  })
);

// Update user profile
router.put(
  "/profile",
  auth,
  profileUpdateValidation,
  invalidateUserCache,
  asyncHandler(async (req, res) => {
    const result = await authService.updateUserProfile(req.user._id, req.body);
    res.json({
      success: true,
      ...result,
    });
  })
);

// Refresh access token
router.post(
  "/refresh",
  asyncHandler(async (req, res) => {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        error: "Refresh token is required",
      });
    }

    const result = await authService.refreshAccessToken(refreshToken, res);
    res.json({
      success: true,
      ...result,
    });
  })
);

// Logout
router.post(
  "/logout",
  auth,
  asyncHandler(async (req, res) => {
    const refreshToken = req.cookies.refreshToken;

    if (refreshToken) {
      await authService.logout(req.user._id, refreshToken, res);
    }

    res.json({
      success: true,
      message: "Logged out successfully",
    });
  })
);

module.exports = router;
