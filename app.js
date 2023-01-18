// IMPORT ////
require("dotenv").config()
const express = require("express");
const mongoose = require("mongoose")
const bodyParser = require("body-parser");
const ejs = require("ejs");
const md5 = require("md5")


// SETUP ////
mongoose.set("strictQuery",false)
mongoose.connect("mongodb://localhost:27017/userDB", {useNewUrlParser: true}, ()=>{
    console.log("Connected to MongoDB ")
})
const app = express();
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

// Schema ////
const userSchema = new mongoose.Schema ({
    email: String,
    password: String
})


const User = new mongoose.model("User", userSchema)




// APP GET/POST ////
app.get("/", function(req, res){
    res.render("home")
})

app.get("/login", function(req, res){
    res.render("login")
})

app.get("/register", function(req, res){
    res.render("register")
})

app.post("/login", function(req, res){
    const username = req.body.username
    const password = md5(req.body.password)
    User.findOne({email: username}, function(err, foundUser){
        if(err){
            console.log(err)
        }else{
            if(foundUser){
                if(foundUser.password === password){
                    res.render("secrets")
                } else {
                    res.send("Password is wrong!")
                }
            } else {
                res.send("Can't find a user!")
            }
        }
    })
})

app.post("/register", function(req, res){
    const newUser = new User({
        email: req.body.username,
        password: md5(req.body.password)
    })
    newUser.save(function(err){
        if(err){
            console.log(err)
        }else{
            res.render("secrets")
        }
    })
})

// LISTEN ////
app.listen(3000, ()=>{
    console.log("Server started on port 3000!")
})