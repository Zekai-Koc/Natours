const express = require('express');
const morgan = require('morgan');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');

const app = express();

// GLOBAL MIDDLEWARES
// Set security http.
app.use(helmet());

// Development logging.
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Limit requests from same IP.
const limiter = rateLimit({
  max: 100,
  windowMS: 60 * 60 * 1000,
  message: 'Too many requests from this IP! Please try it again in one hour.',
});
app.use('/api', limiter);

// Body parser: Reading data from body into req.body.
app.use(express.json({ limit: '10kb' }));

// Data sanitization against NoSQL query injection.
app.use(mongoSanitize());

// Data sanitization agains XSS.
app.use(xss());

// Prevent parameter pollution.
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsQuantity',
      'ratingsAverage',
      'maxGroupSize',
      'difficulty',
      'price',
    ],
  }),
);

// Serving static files.
app.use(express.static(`${__dirname}/public`));

// Test middleware.
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  // console.log(req.headers);
  next();
});

// ROUTES
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);

app.all('*', (req, res, next) => {
  // res.status(404).json({
  //   status: 'fail',
  //   message: `Can't find ${req.originalUrl} on this server!`,
  // });

  // const err = new Error(`Can't find ${req.originalUrl} on this server!`);
  // err.status = 'fail';
  // err.statusCode = 404;
  // next(err);

  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// app.use((err, req, res, next) => {
//   console.log('😒😒😒');
//   console.log(err.stack);
//   console.log('😒😒😒');
//   err.statusCode = err.statusCode || 500;
//   err.status = err.status || 'error';
//   res.status(err.statusCode).json({
//     status: err.status,
//     message: err.message,
//   });
// });

app.use(globalErrorHandler);

module.exports = app;

/* ---------------------PREVIOUS CODE---------------------------------- */
/* -------------------------------------------------------------------- */

// console.log(process.env.NODE_ENV);

// app.get('/', (req, res) => {
//   res
//     .status(200)
//     .json({ message: 'hello from my natours server.', app: 'Natours' });
// });

// app.post('/', (req, res) => {
//   res.status(200).json({ message: 'post request...' });
// });

// app.get('/api/v1/tours', getAllTours);
// app.get('/api/v1/tours/:id', getTour);
// app.post('/api/v1/tours', createTour);
// app.patch('/api/v1/tours/:id', updateTour);
// app.delete('/api/v1/tours/:id', deleteTour);

// MIDDLEWARES
// app.use((req, res, next) => {
//   console.log('hello from the middleware.  💣 😽');
//   next();
// });

// app.use((req, res, next) => {
//   req.requestTime = new Date().toISOString();
//   console.log(req.requestTime);
//   next();
// });
