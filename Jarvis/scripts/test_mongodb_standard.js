const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || "your_mongodb_uri_here";

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('Successfully connected to MongoDB via standard string');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Connection failed:', err);
    process.exit(1);
  });
