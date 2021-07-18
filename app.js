//jshint esversion:6
require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const findOrCreate = require("mongoose-findorcreate");


const app = express();

app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
  extended: true
}));

app.use(session({
  secret: "Thats our little secret mate.",
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());


mongoose.connect("mongodb://" + process.env.DB_HOST + ":27017/userDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true
});
mongoose.set('useCreateIndex', true);

const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  googleId: String,
  facebookId: String
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(function(user, done) {
  done(null, user.id);
});
passport.deserializeUser(function(user, done) {
  done(null, user);
});

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    // userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo" //?
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOne( {googleId : profile.id}, function( err, foundUser ){
        if( !err ){                                                          //Check for any errors
            if( foundUser ){                                          // Check for if we found any users
                return cb( null, foundUser );                  //Will return the foundUser
            }else {                                                        //Create a new User
                const newUser = new User({
                    googleId : profile.id
                });

                newUser.save( function( err ){
                    if(!err){
                        return cb(null, newUser);                //return newUser
                    }
                    else {
                      console.log(err);
                    }
                });
            }
        }else{
            console.log( err );
        }
    });
  }
));

passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_ID,
    clientSecret: process.env.FACEBOOK_SECRET,
    callbackURL: "http://localhost:3000/auth/facebook/secrets",
    profileFields: ['id', 'emails', 'name'] //This

  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOne( {facebookId : profile.id}, function( err, foundUser ){
        if( !err ){                                                          //Check for any errors
            if( foundUser ){
              console.log(profile);                                    // Check for if we found any users
                return cb( null, foundUser );                  //Will return the foundUser
            }else {                                                        //Create a new User
                const newUser = new User({
                    facebookId : profile.id
                });

                newUser.save( function( err ){
                    if(!err){
                        return cb(null, newUser);                //return newUser
                    }
                    else {
                      console.log(err);
                    }
                });
            }
        }else{
            console.log( err );
        }
    });
  }
));

app.get("/", function(req, res) {
  res.render("home");
});

app.get("/submit", function(req,res){
  res.render("submit");
});

app.post("/submit", function(req,res){

});

app.get("/auth/google",
  passport.authenticate('google', { scope:
      [ 'email', 'profile' ] }
));

app.get("/auth/google/secrets",
  passport.authenticate('google', { failureRedirect: "/login" }),
  function(req, res) {
    res.redirect('/secrets');
  });

  app.get('/auth/facebook',
  passport.authenticate('facebook', {scope:['email']}));

  app.get('/auth/facebook/secrets',
  passport.authenticate('facebook', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/secrets');
  });


app.get("/login", function(req, res) {
  res.render("login");
});

app.post("/login", function(req, res) {

  const user = new User({
    username: req.body.username,
    password: req.body.password
  });

  req.login(user, function(err) {
    if (err) {
      console.log(err);
    } else {
      passport.authenticate("local")(req, res, function() {
        res.redirect("/secrets");
      });
    }
  });
});

app.get("/register", function(req, res) {
  res.render("register");
});


app.post("/register", function(req, res) {
  User.register({
      username: req.body.username
    }, req.body.password,
    function(err, user) {
      if (err) {
        console.log(err);
        res.redirect("/register");
      } else {
        passport.authenticate("local")(req, res, function() {
          res.redirect("/secrets");
        });
      }
    });
});



app.get("/secrets", function(req, res) {
  if (req.isAuthenticated()) {
    res.render("secrets");
  } else {
    res.redirect("/login");
  }
});

app.get("/logout", function(req,res){
  req.logout();
  res.redirect("/");
});


app.listen(3000, function() {
  console.log("Server started on port 3000");
});
