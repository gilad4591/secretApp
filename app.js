//jshint esversion:6
require('dotenv').config();
const md5 = require('md5');
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");

const app = express();

app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
  extended: true
}));


mongoose.connect("mongodb://"+process.env.DB_HOST+":27017/userDB", {
  useNewUrlParser: true
});
const userSchema = new mongoose.Schema({
  email: String,
  password: String
});

const User = new mongoose.model("User", userSchema);



app.get("/", function(req, res) {
  res.render("home");
});

app.get("/login", function(req, res) {
  res.render("login");
});

app.post("/login", function(req, res) {
  const connectedUser = new User({
    email: req.body.username,
    password: md5(req.body.password)
  });

  User.findOne({
    email: connectedUser.email
  }, function(err, foundUser) {
    if (!err) {
      if (foundUser && foundUser.password === connectedUser.password) {
        res.render("secrets");
      } else {
        console.log("Email or password incorrect");
      }
    } else {
      console.log(err);
    }
  });

});

app.get("/register", function(req, res) {
  res.render("register");
});

app.post("/register", function(req, res) {
  const newUser = new User({
    email: req.body.username,
    password: md5(req.body.password)
  });
  newUser.save(function(err) {
    if (!err) {
      res.render("secrets");
    } else {
      console.log(err);
    }
  });
});





app.listen(3000, function() {
  console.log("Server started on port 3000");
});
