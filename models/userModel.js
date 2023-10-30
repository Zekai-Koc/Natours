const crypto = require('crypto');
const mongoose = require('mongoose');
const validator = require('validator');
const bcyrpt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'A user must have a name!'],
    trim: true,
    maxlength: [40, 'User name must have less then or equal 40 characters!'],
    minlength: [4, 'User name must have less then or equal 5 characters!'],
  },
  email: {
    type: String,
    required: [true, 'A user must have an email!'],
    unique: true,
    lowercase: true,
    trim: true,
    validate: [validator.isEmail, 'Invalid email!'],
  },
  photo: String,
  role: {
    type: String,
    enum: ['user', 'guide', 'lead-guide', 'admin'],
    default: 'user',
  },
  password: {
    type: String,
    required: [true, 'A user must have a password!'],
    trim: true,
    minlength: [5, 'User password must have less then or equal 5 characters!'],
    select: false,
  },
  passwordConfirm: {
    type: String,
    required: [true, 'A user must have a password!'],
    trim: true,
    validate: {
      // Only works on CREATE and SAVE...
      validator: function (el) {
        return el === this.password;
      },
      message: 'Passwords are not same!',
    },
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
});

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcyrpt.hash(this.password, 11);
  this.passwordConfirm = undefined;
  next();
});

userSchema.pre('save', function (next) {
  if (!this.isModified('password') || this.isNew) return next();

  this.passwordChangedAt = Date.now() - 1000;
  next();
});

userSchema.pre(/^find/, function (next) {
  // Points to current query.
  this.find({ active: true });
  next();
});

userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword,
) {
  return await bcyrpt.compare(candidatePassword, userPassword);
};

userSchema.methods.passwordChangedAfterTokenIssued = async function (
  JWTTimestamp,
) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10,
    );
    console.log(
      'JWTTimestamp < changedTimestamp: ',
      JWTTimestamp < changedTimestamp,
    );
    return JWTTimestamp < changedTimestamp;
  }
  return false;
};

userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');

  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  console.log({ resetToken }, this.passwordResetToken);

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
