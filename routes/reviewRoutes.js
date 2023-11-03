const express = require('express');
const reviewController = require('../controllers/reviewController');
const authController = require('../controllers/authController');

// access tourid coming from tourRoutes.
const router = express.Router({ mergeParams: true });

router.use(authController.protect);

router
  .route('/')
  .get(reviewController.getAllReviews)
  .post(
    authController.restrictTo('user'),
    reviewController.setTourUserIds,
    reviewController.createReview,
  );

router
  .route('/:id')
  .get(reviewController.getReview)
  .patch(
    authController.restrictTo('user', 'admin'),
    reviewController.updateReview,
  )
  .delete(
    authController.restrictTo('user', 'admin'),
    reviewController.deleteReview,
  );

// router
//   .route('/:id')
//   .get(getTour)
//   .patch(updateTour)
//   .delete(
//     authController.protect,
//     authController.restrictTo('admin', 'lead-guide'),
//     deleteTour,
//   );

module.exports = router;
