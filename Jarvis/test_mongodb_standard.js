const mongoose = require('mongoose');

const MONGODB_URI = "mongodb://himeshmehta_db_user:Himesh123@ac-k5pzrez-shard-00-00.upmkip9.mongodb.net:27017,ac-k5pzrez-shard-00-01.upmkip9.mongodb.net:27017,ac-k5pzrez-shard-00-02.upmkip9.mongodb.net:27017/jarvis_db?ssl=true&authSource=admin&retryWrites=true&w=majority";

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('Successfully connected to MongoDB via standard string');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Connection failed:', err);
    process.exit(1);
  });
