const fs = require('fs');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Tour = require('../../models/tourModel');

dotenv.config({ path: './config.env' });

const DB = process.env.MONGODB_DATABASE.replace(
  '<PASSWORD>',
  process.env.MONGODB_USER_PASS,
);

mongoose.connect(DB).then(() => {
  console.log('DB connection successful.');
});

const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours.json`, 'utf-8'));

console.log(tours);

const importData = async () => {
  try {
    await Tour.create(tours);
    console.log('Data successfuly loaded.');
  } catch (error) {
    console.log(error);
  }
  process.exit();
};

const deleteData = async () => {
  try {
    await Tour.deleteMany();
    console.log('Data successfuly deleted.');
  } catch (error) {
    console.log(error);
  }
  process.exit();
};

console.log(process.argv);

if (process.argv[2] === '--import') {
  importData();
} else if (process.argv[2] === '--delete') {
  deleteData();
}
