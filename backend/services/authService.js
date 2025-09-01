const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Get config based on environment
const env = process.env.NODE_ENV || "development";
const config = require("../config/config")[env];

class AuthService {
  // Generate access token (short-lived)
  generateAccessToken(userId) {
    return jwt.sign({ userId }, config.jwtSecret, { expiresIn: "15m" });
  }

  // Generate refresh token (long-lived)
  generateRefreshToken(userId) {
    return jwt.sign({ userId, type: "refresh" }, config.jwtSecret, {
      expiresIn: "7d",
    });
  }

  // Format user response (remove sensitive data)
  formatUserResponse(user) {
    return {
      id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      cash: user.cash,
    };
  }

  // Register new user
  async registerUser({ email, password, cash = 0 }, res) {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      const error = new Error("User already exists");
      error.statusCode = 400;
      throw error;
    }

    const user = new User({ email, password, cash });
    await user.save();

    const accessToken = this.generateAccessToken(user._id);
    const refreshToken = this.generateRefreshToken(user._id);

    // Store refresh token
    const refreshExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    user.addRefreshToken(refreshToken, refreshExpiresAt);
    await user.save();

    // Set httpOnly cookies
    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return {
      user: this.formatUserResponse(user),
    };
  }

  // Login user
  async loginUser({ email, password }, res) {
    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      const error = new Error("Invalid credentials");
      error.statusCode = 401;
      throw error;
    }

    const accessToken = this.generateAccessToken(user._id);
    const refreshToken = this.generateRefreshToken(user._id);

    // Store refresh token
    const refreshExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    user.addRefreshToken(refreshToken, refreshExpiresAt);
    await user.save();

    // Set httpOnly cookies
    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return {
      user: this.formatUserResponse(user),
    };
  }

  // Refresh access token
  async refreshAccessToken(refreshToken, res) {
    try {
      const decoded = jwt.verify(refreshToken, config.jwtSecret);

      if (decoded.type !== "refresh") {
        const error = new Error("Invalid token type");
        error.statusCode = 401;
        throw error;
      }

      const user = await User.findById(decoded.userId);
      if (!user) {
        const error = new Error("User not found");
        error.statusCode = 401;
        throw error;
      }

      // Check if refresh token exists and is valid
      const tokenExists = user.refreshTokens.some(
        (t) => t.token === refreshToken && t.expiresAt > new Date()
      );

      if (!tokenExists) {
        const error = new Error("Invalid refresh token");
        error.statusCode = 401;
        throw error;
      }

      const accessToken = this.generateAccessToken(user._id);

      // Set new access token cookie
      res.cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 15 * 60 * 1000, // 15 minutes
      });

      return {
        user: this.formatUserResponse(user),
      };
    } catch (error) {
      if (error.name === "TokenExpiredError") {
        error.statusCode = 401;
        error.message = "Refresh token expired";
      }
      throw error;
    }
  }

  // Logout (invalidate refresh token and clear cookies)
  async logout(userId, refreshToken, res) {
    const user = await User.findById(userId);
    if (user) {
      user.removeRefreshToken(refreshToken);
      await user.save();
    }

    // Clear cookies
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");
  }

  // Update user profile
  async updateUserProfile(userId, updateData) {
    const { firstName, lastName, email, cash } = updateData;

    // Check if email is being changed and if it's already taken
    if (email) {
      const currentUser = await User.findById(userId);
      if (email !== currentUser.email) {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
          const error = new Error("Email already exists");
          error.statusCode = 400;
          throw error;
        }
      }
    }

    // Prepare update data (only include defined values)
    const updateFields = {};
    if (firstName !== undefined) updateFields.firstName = firstName;
    if (lastName !== undefined) updateFields.lastName = lastName;
    if (email !== undefined) updateFields.email = email;
    if (cash !== undefined) updateFields.cash = parseFloat(cash);

    const user = await User.findByIdAndUpdate(userId, updateFields, {
      new: true,
      runValidators: true,
    });

    if (!user) {
      const error = new Error("User not found");
      error.statusCode = 404;
      throw error;
    }

    return {
      user: this.formatUserResponse(user),
    };
  }
}

module.exports = new AuthService();
