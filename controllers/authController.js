const crypto = require('crypto');
const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const catAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const sendEmail = require('../utils/email');
const catchAsync = require('../utils/catchAsync');

// eslint-disable-next-line arrow-body-style
const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);

  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000,
    ),
    // secure: true,
    httpOnly: true,
  };

  console.log(process.env.NODE_ENV);
  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;

  res.cookie('jwt', token, cookieOptions);

  // Remove the password from the output.
  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
};

exports.signup = catAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    passwordChangedAt: req.body.passwordChangedAt,
    role: req.body.role,
  });

  createSendToken(newUser, 201, res);
});

exports.login = catAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // CHECK IF EMAIL/PASS EXISTS
  if (!email || !password) {
    return next(new AppError('Please provde email and password!', 400));
  }

  // CHECK IF THE USER EXISTS
  const user = await User.findOne({ email }).select('+password');
  const correctPassword = user
    ? await user.correctPassword(password, user.password)
    : null;

  if (!user || !correctPassword) {
    return next(new AppError('Incorrect credentials!', 401));
  }

  createSendToken(user, 200, res);
});

exports.protect = catAsync(async (req, res, next) => {
  // GET THE TOKEN AND CHECK IF IT EXISTS
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) {
    return next(
      new AppError('You are not logged in! Please login to get access.', 401),
    );
  }

  // VERIFY TOKEN
  const verifyJwt = promisify(jwt.verify);
  const decoded = await verifyJwt(token, process.env.JWT_SECRET);

  // CHECK IF USER EXISTS
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(
      new AppError('The user blonging to this token no longer exists!', 401),
    );
  }

  //  !!!!!!!!!!!!!! FINISH THE FOLLOWING PART !!!!!!!!!!!!!!!!!!!!!!
  //                          132.video
  // CHECK IF USER CHANGED PASSW AFTER THE TOKEN WAS ISSUED
  // if (currentUser.passwordChangedAfterTokenIssued(decoded.iat)) {
  //   return next(
  //     new AppError('Password recently changed! Please login again.', 401),
  //   );
  // }

  req.user = currentUser;

  next();
});

// eslint-disable-next-line arrow-body-style
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission to perform this action!', 403),
      );
    }
    next();
  };
};

exports.forgotPassword = catAsync(async (req, res, next) => {
  // 1. Get user by email.
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError('There is no user with email address!', 404));
  }

  // 2. Generate random reset token.
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  // 3. Send email
  const resetURL = `${req.protocol}://${req.get(
    'host',
  )}/api/v1/users/resetPassword/${resetToken}`;

  const message = `Forgot your password? Submit a PATCH request for a new password to: ${resetURL}\nIf you did not forget, ignore this email`;

  try {
    await sendEmail({
      email: user.email,
      subject: 'Your password reset token. Valid for 10 minutes!',
      message,
    });
  } catch (error) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    return next(
      new AppError(
        'There was an error sending the email! Try again later.',
        500,
      ),
    );
  }

  res.status(200).json({
    status: 'success',
    message: 'Token sent to email!',
  });
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  // 1. Get user based on the token.
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: {
      $gte: Date.now(),
    },
  });

  // 2. If token has not expired and there is a user, set the new password.
  if (!user) {
    return next(new AppError('Token is invalid or has expired.', 400));
  }

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  // 3. Update changedPasswordAt property for the user.
  createSendToken(user, 200, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  // 1. Get user from the collection.
  const user = await User.findById(req.user.id).select('+password');

  // 2. Check if the POSTed current password is correct.
  if (!(await user.correctPassword(req.body.password, user.password))) {
    return next(new AppError('Your current password is wrong!', 401));
  }

  // 3. If so, update the user.
  user.password = req.body.newPassword;
  user.passwordConfirm = req.body.newPasswordConfirm;
  await user.save();

  // 4. Log user in, send JWT.
  createSendToken(user, 200, res);
});
