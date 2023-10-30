const express = require('express');
const {
  getAllUsers,
  getUser,
  updateUser,
  deleteUser,
  createUser,
  checkId,
  updateMe,
  deleteMe,
} = require('../controllers/userController');
const authController = require('../controllers/authController');

const router = express.Router();

// router.param('id', checkId);

router.post('/signup', authController.signup);
router.post('/login', authController.login);

router.post('/forgotpassword', authController.forgotPassword);
router.patch('/resetpassword/:token', authController.resetPassword);

router.patch(
  '/updatepassword',
  authController.protect,
  authController.updatePassword,
);

router.patch('/updateMe', authController.protect, updateMe);
router.delete('/deleteMe', authController.protect, deleteMe);

router.route('/').get(getAllUsers).post(createUser);
router.route('/:id').get(getUser).patch(updateUser).delete(deleteUser);

module.exports = router;
