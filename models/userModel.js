const mongoose = require('mongoose');
const jwt = require("jsonwebtoken");

// Here, the user schema is intialized
const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
    unique: false,
    trim: true,
  },
  lastName: {
    type: String,
    required: true,
    unique: false,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  status: {
    type: String,
  },
});

const User = new mongoose.model("user", userSchema);

// To generate a token for each user
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.SECRET_KEY);
};

module.exports = { User, generateToken };