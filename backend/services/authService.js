const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Get config based on environment
const env = process.env.NODE_ENV || "development";
const config = require("../config/config")[env];

class AuthService {
  // Generate JWT token
  generateToken(userId) {
    return jwt.sign({ userId }, config.jwtSecret, { expiresIn: "7d" });
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
  async registerUser({ email, password, cash = 0 }) {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      const error = new Error("User already exists");
      error.statusCode = 400;
      throw error;
    }

    const user = new User({ email, password, cash });
    await user.save();

    const token = this.generateToken(user._id);

    return {
      token,
      user: this.formatUserResponse(user),
    };
  }

  // Login user
  async loginUser({ email, password }) {
    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      const error = new Error("Invalid credentials");
      error.statusCode = 401;
      throw error;
    }

    const token = this.generateToken(user._id);

    return {
      token,
      user: this.formatUserResponse(user),
    };
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
