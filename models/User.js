const bcrypt = require("bcrypt");
const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  userName: { type: String, unique: true },
  email: { type: String, unique: true },
  password: String,
});

// Password hash middleware.

UserSchema.pre('save', async function () {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) {
    return; // Just return, don't call next()
  }

  try {
    const saltRounds = 10;
    this.password = await bcrypt.hash(this.password, saltRounds);
    // No next() call needed here
  } catch (err) {
    // If you need to throw an error, Mongoose will catch it
    throw err;
  }
});


// Helper method for validating user's password.

UserSchema.methods.comparePassword = async function (candidatePassword, cb) {
  try {
    // Returns true if passwords match, false otherwise
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (err) {
    // Rethrow or handle encryption/comparison errors
    throw new Error(err);
  }
};


module.exports = mongoose.model("User", UserSchema);
