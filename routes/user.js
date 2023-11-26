const express = require("express");
const bcrypt = require("bcrypt");
const dotenv = require("dotenv");
const {
  getUserByEmail,
  getUserById,
  getAll,
} = require("../controllers/userController.js");
const { User, generateToken } = require("../models/userModel.js");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const expressLayouts = require("express-ejs-layouts");


const app = express();
const router = express.Router();
dotenv.config();

// login - already existing users
router.post("/login", async (req, res) => {
  try {
    // To check whether the user  already exists in db or not
    const user = await getUserByEmail(req);
    if (!user) {
      return res.status(404).json({ error: "User does not exist." });
    }
    // To validate the password
    const validatePassword = await bcrypt.compare(
      req.body.password,
      user.password
    );
    if (!validatePassword) {
      return res.status(404).json({ error: "Invalid Credentials." });
    }
    if (user.status === "Not Verified") {
      return res.status(404).json({ error: "Acoount not activated." });
    }
    const token = generateToken(user._id);
    res.status(200).json({ message: "Logged in Successfully.", token });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal Server Error." });
  }
});

// signup - new user
router.post("/signup", async (req, res) => {
    try {
      // To check whether the user  already exists in db or not
      let user = await getUserByEmail(req);
      if (user) {
        return res.status(400).json({ error: "User Already Exists" });
      }
  
      // To generate a hashed password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(req.body.password, salt);
  
      // To store the email and password in the User dbr
      user = await new User({
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        email: req.body.email,
        password: hashedPassword,
        status: "Not Verified",
      }).save();
  
      const token = generateToken(user._id);
  
      // To generate a random string consisting of some token and secret key
      const secret = process.env.SECRET_KEY + user.password;
      const token1 = jwt.sign({ email: user.email, id: user._id }, secret, {
        expiresIn: "10m",
      });
  
      // this is sent to the user via mail to activate the account
      const link = `https://url-shortener-jgbq.onrender.com/user/account-activate/${user._id}/${token1}`;
  
      // Tho send the activation link to the user from the host
      var transporter = nodemailer.createTransport({
        service: "Gmail",
        auth: {
          user: process.env.EMAIL,
          pass: process.env.PASS,
        },
      });
  
      var mailOptions = {
        from: process.env.EMAIL,
        to: user.email,
        subject: "Account Activation Link",
        text: link,
      };
  
      transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
          console.log(error);
        } else {
          console.log("Email sent: " + info.response);
        }
      });
      res.status(201).json({
        message: "Account Activation Link as been sent to your mail.",
        token,
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({ error: "Internal Server Error." });
    }
  });

  // get account-activate routes
router.get("/account-activate/:id/:token", async (req, res) => {
    const { id, token } = req.params;
    // check user already exists by id
    const user = await User.findOne({ _id: id });
    if (!user) {
      return res.status(404).json({ error: "User does not exists." });
    }
    // verifying the random string which is sent via email using jwt
    const secret = process.env.SECRET_KEY + user.password;
    try {
      const verify = jwt.verify(token, secret);
      // This load the html file to activate the account
      res.render("./index1.ejs", { email: verify.email, status: "Not Verified" });
    } catch (error) {
      res.send("Not Verified");
      console.log(error);
    }
  });
  
  // post account-activate routes
  router.post("/account-activate/:id/:token", async (req, res) => {
    const { id, token } = req.params;
    // checking whether the new password and confirm password is same
    // check user is exits
    const user = await User.findOne({ _id: id });
    if (!user) {
      return res.status(404).json({ error: "User does not exists." });
    }
    const secret = process.env.SECRET_KEY + user.password;
    try {
      const verify = jwt.verify(token, secret);
      await User.updateOne({ _id: id }, { $set: { status: "Verified" } });
      // This load the html file to activate the account
      res.render("./index1.ejs", { email: verify.email, status: "verified" });
    } catch (error) {
      res.json({ status: "Something went wrong" });
      console.log(error);
    }
  });

  // forgot-password
router.post("/forgot-password", async (req, res) => {
    try {
      // To check whether the user  already exists in db or not
      const user = await getUserByEmail(req);
      if (!user) {
        return res.status(404).json({ error: "User does not exists." });
      }
      // To generate a random string consist of some token and secret key
      const secret = process.env.SECRET_KEY + user.password;
      const token = jwt.sign({ email: user.email }, secret, {
        expiresIn: "15m"
      });
  
      // password reset link to be sent to the user via email
      const link = `https://url-shortener-jgbq.onrender.com/user/reset-password/${user._id}/${token}`;
  
      // to send the reset email to the user from the host
      var transporter = nodemailer.createTransport({
        service: "Gmail",
        auth: {
          user: process.env.EMAIL,
          pass: process.env.PASS,
        },
      });
  
      var mailOptions = {
        from: process.env.EMAIL,
        to: user.email,
        subject: "Password Reset Link",
        text: link,
      };
  
      transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
          console.log(error);
        } else {
          console.log("Email sent: " + info.response);
        }
      });
      res.status(200).json({ message: "Password reset link sent.", token, secret });
    } catch (error) {
      console.log(error);
      res.status(500).json({ error: "Internal Server Error." });
    }
  });
  
  // get reset-password routes
  router.get("/reset-password/:id/:token", async (req, res) => {
    const { id, token } = req.params;
    // To check whether the user  already exists in db or not
    const user = await User.findOne({ _id: id });
    if (!user) {
      return res.status(404).json({ error: "User does not exists." });
    }
    // To verify the random string sent via email using jwt
    const secret = process.env.SECRET_KEY + user.password;
    
    try {
      const verify = jwt.verify(token, secret);
      console.log(verify.email);
      // To load the html file where the form is displayed to enter the new password
      res.render("./index.ejs", { email: verify.email, status: "Not Verified" });
    } catch (error) {
      res.send("Not Verified");
      console.log(error);
    } 
  });
  
  // post reset-password routes
  router.post("/reset-password/:id/:token", async (req, res) => {
    const { id, token } = req.params;
    const { password } = req.body;
    // To check whether the new password and confirm passwords are same
    // To check whether the user  already exists in db or not
    const user = await User.findOne({ _id: id });
    if (!user) {
      return res.status(404).json({ error: "User does not exists." });
    }
    const secret = process.env.SECRET_KEY + user.password;
    try {
      const verify = jwt.verify(token, secret);
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      await User.updateOne({ _id: id }, { $set: { password: hashedPassword } });

      // This load the html file where the form is displayed to enter new password
      res.render("./index.ejs", { email: verify.email, status: "verified" });
    } catch (error) {
      res.json({ status: "Something went wrong" });
      console.log(error);
    }
  });

  //home
router.get("/", async(req, res) => {
  const ans= await getAll()
  res.send(ans)
});

  
module.exports = router