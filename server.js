const mongoose = require('mongoose');
const dotenv = require('dotenv');

process.on('uncaughtException', (err) => {
  console.log('💥💥💥 Uncaught Exception! Shutting down...');
  console.log(err.name, err.message);
  process.exit(1);
});

dotenv.config({ path: './.env' });
const app = require('./app');

const DB = process.env.MONGODB_DATABASE.replace(
  '<PASSWORD>',
  process.env.MONGODB_USER_PASS,
);

mongoose.connect(DB).then(() => {
  console.log('DB connection successful.');
});

const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
  console.log(`App running on port ${port}`);
});

process.on('unhandledRejection', (err) => {
  console.log('💥💥💥 Unhandled Rejection! Shutting down...');
  console.log(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});

//npm i eslint prettier eslint-config-prettier eslint-plugin-prettier eslint-config-airbnb eslint-plugin-node eslint-plugin-import eslint-plugin-jsx-a11y eslint-plugin-react --save-dev

// console.log(app.get('env'));
// console.log(process.env);

// const testTour = new Tour({
//   name: 'The Park Camper',
//   // rating: 4.7,
//   price: 999,
// });

// testTour
//   .save()
//   .then((doc) => {
//     console.log(doc);
//   })
//   .catch((err) => {
//     console.log('ERROR: 💥', err);
//   });
