const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;

console.log('Testing URI:', MONGODB_URI);

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('Successfully connected to MongoDB via SRV string');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Connection failed:', err);
    process.exit(1);
  });
