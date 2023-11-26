const mongoose = require('mongoose');
const dotenv = require("dotenv");

// This to connect the server to database
dotenv.config();

module.exports.dataBaseConnection = ()=>{
  const params = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  };

  try {
    mongoose.connect(process.env.MONGO_URL, params);
    console.log("Connected to database");
  } catch (error) {
    console.log("Error connecting to database ", error);
  }
}