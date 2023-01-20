// IMPORT ////
require("dotenv").config()
const express = require("express");
const mongoose = require("mongoose")
const bodyParser = require("body-parser");
const ejs = require("ejs");
const session = require('express-session')
const passport = require("passport")
const passportLocalMongoose = require("passport-local-mongoose")
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require("mongoose-findorcreate")
require('https').globalAgent.options.rejectUnauthorized = false;



// SETUP ////

const app = express();
app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));


app.use(session({
    secret: "Our little secret!",
    resave: false,
    saveUninitialized: false,
})); //using express-session

app.use(passport.initialize()); //using passport
app.use(passport.session());

mongoose.set("strictQuery",false)
mongoose.connect("mongodb://localhost:27017/userDB", {useNewUrlParser: true}, ()=>{
    console.log("Connected to MongoDB ")
})

// Schema ////
const userSchema = new mongoose.Schema ({
    email: String,
    password: String,
    googleId: String //remember User's Google ID for login again
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);//plugin Schema for the mongoose-findorcreate


const User = new mongoose.model("User", userSchema);
passport.use(User.createStrategy());
passport.serializeUser(function(user, cb) {
    process.nextTick(function() {
      cb(null, { id: user.id, username: user.username, name: user.displayName });
    });
  });
  
  passport.deserializeUser(function(user, cb) {
    process.nextTick(function() {
      return cb(null, user);
    });
  });

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
  },
  function(accessToken, refreshToken, profile, cb) {
    console.log(profile)
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

// APP GET/POST ////
app.get("/", function(req, res){
    res.render("home")
})

app.get("/auth/google", 
    passport.authenticate("google", { scope: ["profile"] }))

app.get("/auth/google/secrets", 
passport.authenticate("google", { failureRedirect: "/login" }),
function(req, res) {
    // Successful authentication, redirect to /secrets.
    res.redirect('/secrets');
});

app.get("/login", function(req, res){
    res.render("login")
})

app.get("/register", function(req, res){
    res.render("register")
})

app.get("/secrets", function(req, res){
    if(req.isAuthenticated()){
        res.render("secrets")
    }else{
        res.redirect("/login")
    }
})

app.get('/logout', function(req, res, next) {
    req.logout(function(err) {
      if (err) { 
        console.log(err); 
        }
      res.redirect('/');
    });
  });

app.post("/login", function(req, res){
    const user = new User({
        username: req.body.username,
        password: req.body.password
    })

    req.login(user, function(err){
        if(err){
            console.log(err)
        }else{
            passport.authenticate("local")(req, res, function(){
                res.redirect("/secrets")
            })
        }
    })
})

app.post("/register", function(req, res){
   User.register({username: req.body.username, active: true}, req.body.password, function(err, user){
    if(err){
        console.log(err)
        res.redirect("/register")
    }else{
        passport.authenticate("local")(req, res, function(){
            res.redirect("/secrets")
        });
    }
   });
})

// LISTEN ////
app.listen(3000, ()=>{
    console.log("Server started on port 3000!")
})