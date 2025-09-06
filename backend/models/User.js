const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
    },
    firstName: {
      type: String,
      default: "",
    },
    lastName: {
      type: String,
      default: "",
    },
    cash: {
      type: mongoose.Schema.Types.Decimal128,
      default: "0.00",
      get: (v) => parseFloat(v),
      set: (v) => {
        // Handle different input types safely
        if (typeof v === "number") {
          return v.toFixed(2);
        }
        return v;
      },
    },
    refreshTokens: [
      {
        token: String,
        expiresAt: Date,
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  {
    timestamps: {
      createdAt: "createdAt",
      updatedAt: "updatedAt",
    },
    versionKey: false,
    toJSON: { getters: true },
    toObject: { getters: true },
  }
);

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  // In non-production, allow empty passwords (just store as empty string)
  if (
    process.env.NODE_ENV !== "production" &&
    (!this.password || this.password === "")
  ) {
    this.password = "";
    return next();
  }

  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function (password) {
  // In non-production, allow any password if stored password is empty
  if (process.env.NODE_ENV !== "production" && this.password === "") {
    return true;
  }

  return bcrypt.compare(password, this.password);
};

// Clean expired refresh tokens
userSchema.methods.cleanExpiredRefreshTokens = function () {
  this.refreshTokens = this.refreshTokens.filter(
    (token) => token.expiresAt > new Date()
  );
};

// Add refresh token
userSchema.methods.addRefreshToken = function (token, expiresAt) {
  this.cleanExpiredRefreshTokens();
  this.refreshTokens.push({ token, expiresAt });
};

// Remove refresh token
userSchema.methods.removeRefreshToken = function (token) {
  this.refreshTokens = this.refreshTokens.filter((t) => t.token !== token);
};

// Database indexes for performance
userSchema.index({ email: 1 }); // Primary lookup index
userSchema.index({ createdAt: -1 }); // For time-based queries
userSchema.index({ email: 1, createdAt: -1 }); // Compound index for admin queries

module.exports = mongoose.model("User", userSchema);
