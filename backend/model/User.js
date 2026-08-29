import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

// Define the shape of a User document in MongoDB
const userSchema = new mongoose.Schema(
  {
    // User's display name — required, trimmed of whitespace
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },

    // User's email — required, must be unique, stored in lowercase
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [
        /^\S+@\S+\.\S+$/,
        'Please provide a valid email address',
      ],
    },

    // User's password — required, minimum 6 characters
    // We do NOT return this field by default (select: false)
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false, // Never include password in query results by default
    },
  },
  {
    // Automatically add createdAt and updatedAt fields
    timestamps: true,
  }
);

// ─── Pre-save Hook: Hash the password before saving ────────────────────────
// This runs automatically every time a user document is saved
userSchema.pre('save', async function () {
  // Only hash the password if it has been modified (or is new)
  // This prevents re-hashing an already-hashed password on profile updates
  if (!this.isModified('password')) {
    return;
  }

  // Generate a salt with 10 rounds (higher = slower = more secure)
  const salt = await bcrypt.genSalt(10);

  // Replace the plain-text password with the hashed version
  this.password = await bcrypt.hash(this.password, salt);

});

// ─── Instance Method: Compare passwords during login ───────────────────────
// This method can be called on any user document
userSchema.methods.matchPassword = async function (enteredPassword) {
  // bcrypt.compare hashes enteredPassword and compares it to the stored hash
  return await bcrypt.compare(enteredPassword, this.password);
};

// Create and export the User model
const User = mongoose.model('User', userSchema);

export default User;
