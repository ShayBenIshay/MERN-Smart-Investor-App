const express = require("express");
const User = require("../models/User");
const auth = require("../middleware/auth");
const authService = require("../services/authService");
const asyncHandler = require("../utils/asyncHandler");
const {
  registerValidation,
  loginValidation,
  profileUpdateValidation,
  handleValidationErrors,
} = require("../middleware/validation");

const router = express.Router();

// Register
router.post(
  "/register",
  registerValidation,
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const result = await authService.registerUser(req.body);
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
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const result = await authService.loginUser(req.body);
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
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const result = await authService.updateUserProfile(req.user._id, req.body);
    res.json({
      success: true,
      ...result,
    });
  })
);

module.exports = router;
