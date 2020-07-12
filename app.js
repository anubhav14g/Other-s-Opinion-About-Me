// to add environment file to save private data
require('dotenv').config();

const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose=require("mongoose");
// const GoogleStrategy=require('passport-google-oauth20').Strategy;
// const findOrCreate = require('mongoose-findorcreate');

// add encryption using hashing
// const md5=require("md5");

// adding cookies and sessions
const session=require('express-session');
const passport=require('passport');
const passportLocalMongoose=require('passport-local-mongoose');

const app=express();
app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

// configuring session to save cookies
app.use(session({
  secret: process.env.SECRET,
  resave: false,
  saveUninitialized: true,
}));

// use passport to initialize session to work
app.use(passport.initialize());
app.use(passport.session());

// mongoose.connect("mongodb://localhost:27017/userDB",{useNewUrlParser:true});
mongoose.connect("mongodb+srv://admin-anubhavg:T-0101@myfirstdatabase.ewcnv.mongodb.net/userDB",{useNewUrlParser:true,useUnifiedTopology:true});
mongoose.set('useCreateIndex',true);

const userSchema=new mongoose.Schema({
  username: String,
  password: String,
  // googleId: String,
  secret: String
});

userSchema.plugin(passportLocalMongoose);
// userSchema.plugin(findOrCreate);

const User=mongoose.model("User",userSchema);

// using passport-local-mongoose to serialze and deserialize
passport.use(User.createStrategy());
passport.serializeUser(function(user, done) {
  done(null, user.id);
});
passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});

// passport.use(new GoogleStrategy({
//     clientID: process.env.CLIENT_ID,
//     clientSecret: process.env.CLIENT_SECRET,
//     callbackURL: "http://localhost:3000/auth/google/opinion",
//     userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
//   },
//   function(accessToken, refreshToken, profile, cb) {
//     User.findOrCreate({ googleId: profile.id }, function (err, user) {
//       return cb(err, user);
//     });
//   }
// ));


app.get("/",function(req,res){
  res.render("home");
});

// app.get("/auth/google",
//   passport.authenticate('google', { scope: ["profile"] })
// );
//
// app.get("/auth/google/opinion",
//   passport.authenticate('google', { failureRedirect: "/login" }),
//   function(req, res) {
//     // Successful authentication, redirect to secrets.
//     res.redirect("/secrets");
//   });

app.get("/login",function(req,res){
  res.render("login");
});

app.get("/register",function(req,res){
  res.render("register");
});

app.get("/secrets", function(req, res){
  User.find({"secret": {$ne: null}}, function(err, foundUsers){
    if (!err){
      if (foundUsers) {
        res.render("secrets", {usersWithSecrets: foundUsers});
      }
    }
  });
});

app.get("/submit", function(req, res){
  if (req.isAuthenticated()){
    res.render("submit");
  } else {
    res.redirect("/login");
  }
});

app.post("/submit", function(req, res){
  const submittedSecret = req.body.secret;

//Once the user is authenticated and their session gets saved,
// their user details are saved to req.user.id

  User.findById(req.user.id, function(err, foundUser){
    if (!err) {
      if (foundUser) {
        foundUser.secret = submittedSecret;
        foundUser.save(function(){
          res.redirect("/secrets");
        });
     }
    }
  });
});

app.get("/logout",function(req,res){
  req.logout();
  res.redirect("/");
});

app.post("/register",function(req,res){
  // const newUser=new User({
  //   email: req.body.username,
  //   password: md5(req.body.password)
  // });
  // newUser.save(function(err){
  //   if(err){
  //     console.log(err);
  //   }
  //   else{
  //     res.render("secrets");
  //   }
  // });

  User.register({username:req.body.username},req.body.password,function(err,user){
    if(err){
      res.redirect("/register");
    }
    else{
      passport.authenticate("local")(req,res,function(){
        res.redirect("/secrets");
      });
    }
  });
});

app.post("/login",function(req,res){
  // const username=req.body.username;
  // const password=md5(req.body.password);
  // User.findOne({email:username},function(err,foundUser){
  //   if(!err){
  //     if(foundUser){
  //       if(foundUser.password==password){
  //         res.render("secrets");
  //       }
  //     }
  //   }
  //   else{
  //     console.log(err);
  //   }
  // });

  const user=new User({
    username: req.body.username,
    password: req.body.password
  });
  req.login(user,function(err){
    if(!err){
      passport.authenticate("local")(req,res,function(){
      res.redirect("/secrets");
    });
   }
 });
});


app.listen(process.env.PORT || 3000, function() {
  console.log("Server started on port 3000");
});
