const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const dataBaseConnection = require("./db.js");
const userRouter = require("./routes/user.js");
const urlRouter = require("./routes/url.js");
const mongoose = require('mongoose')

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// middlewares
app.use(express.json());
app.use(cors());

app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: false }));

// connecting to the database
// dataBaseConnection();

try {
  mongoose.connect(process.env.MONGO_URL);
  console.log("Connected to database");
} catch (error) {
  console.log("Error connecting to database ", error);
}

// routes
app.use("/user", userRouter);
app.use("/", urlRouter);

// server connection
app.listen(PORT, () => {
  console.log("Server is running in Port:", PORT);
});
