const User = require('../models/userModel');
const APIFeatures = require('../utils/apiFeatures');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

exports.checkId = (req, res, next, val) => {
  // const { id } = req.params;
  // const user = users.find((el) => el._id === id);

  // console.log(`😽 User id is: ${val}`);

  // if (!user) {
  //   return res.status(404).json({
  //     status: 'fail',
  //     message: 'Invalid User ID',
  //   });
  // }
  next();
};

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};

  Object.keys(obj).forEach((element) => {
    if (allowedFields.includes(element)) newObj[element] = obj[element];
  });

  return newObj;
};

exports.getAllUsers = catchAsync(async (req, res, next) => {
  const users = await User.find();

  res.status(200).json({
    status: 'success',
    results: users.length,
    data: {
      users,
    },
  });
});

exports.updateMe = catchAsync(async (req, res, next) => {
  // 1. Create error if user post password data.
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        'This route is not for password updtades! Plase use /updateMyPassword.',
        400,
      ),
    );
  }
  // 2. Update the user document.
  const filteredBody = filterObj(req.body, 'name', 'email');

  //3. Update the user.
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser,
    },
  });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });

  res.status(204).json({
    status: 'success',
    data: null,
  });
});

exports.getUser = (req, res) => {
  // const { id } = req.params;
  // const user = users.find((el) => el._id === id);
  // // if (!user) {
  // //   return res.status(404).json({
  // //     status: 'fail',
  // //     message: 'Invalid User ID',
  // //   });
  // // }
  // res.status(200).json({
  //   status: 'success',
  //   data: { user },
  // });
};

exports.createUser = (req, res) => {
  // const newId = users.length + 1;
  // const newUser = Object.assign({ id: newId }, req.body);
  // users.push(newUser);
  // fs.writeFile(
  //   `${__dirname}/../dev-data/data/users.json`,
  //   JSON.stringify(users),
  //   (err) => {
  //     res.status(201).json({
  //       status: 'success',
  //       data: { user: newUser },
  //     });
  //   },
  // );
};

exports.updateUser = (req, res) => {
  // const id = req.params.id;
  // const user = users.find((el) => el._id === id);
  // if (!user) {
  //   return res.status(404).json({
  //     status: 'fail',
  //     message: 'Invalid User ID',
  //   });
  // }

  res.status(200).json({
    status: 'success',
    data: {
      user: 'updated user...',
    },
  });
};

exports.deleteUser = (req, res) => {
  // const id = req.params.id;
  // const user = users.find((el) => el._id === id);
  // if (!user) {
  //   return res.status(404).json({
  //     status: 'fail',
  //     message: 'Invalid User ID',
  //   });
  // }

  res.status(204).json({
    status: 'success',
    data: null,
  });
};
