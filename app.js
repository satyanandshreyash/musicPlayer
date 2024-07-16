require('dotenv').config();
const express = require("express");
const bodyParser =  require("body-parser");
const ejs = require('ejs');
const mongoose = require('mongoose');
// const md5 = require('md5');
const passport = require('passport');
const session = require('express-session');
const LocalStrategy = require('passport-local');
const passportLocalMongoose = require('passport-local-mongoose');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');

const app = express();
app.use(bodyParser.urlencoded({extended: true}));
app.set('view engine', 'ejs');
app.use(express.static("public"));

app.use(session({
    secret: 'Rolling Thunder Again',
    resave: false,
    saveUninitialized: false,
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/musicUserDB").then(()=>{
    console.log("connection successfull");
}).catch(()=>{console.log("connection failed")});

const musicUserSchema = new mongoose.Schema({
    username: String,
    password: String,
    googleId: String
});

musicUserSchema.plugin(passportLocalMongoose);
musicUserSchema.plugin(findOrCreate);

const MusicUser = mongoose.model('MusicUser', musicUserSchema);

passport.use(new LocalStrategy(
    function(username, password, done){
        MusicUser.findOne({username: username}).then((user)=>{
            if(!user)return done(null, false);
            if(!user.password === password)return done(null, false);
            return done(null, user);
        }).catch((err)=>{
            return done(err)});
    }
));

passport.serializeUser(function(user, cb) {
    process.nextTick(function() {
      return cb(null, {
        id: user.id,
        username: user.username,
        picture: user.picture
      });
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
    callbackURL: "http://localhost:3000/auth/google/home"
  },
  function(accessToken, refreshToken, profile, cb) {
    MusicUser.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

app.get("/", function(req, res){
    res.render("index");
});

app.get('/login', function(req, res){
    res.render('login');
})

app.get('/loginerr', function(req, res){
    res.render('loginerr');
})

app.get('/signup', function(req, res){
    res.render('signup');
})

app.get('/signuperr', function(req, res){
    res.render('signuperr');
})

app.get('/home', function(req, res){
    if(req.isAuthenticated()){
        res.render('home');
    }else{
        res.redirect('/login');
    }
})

app.get('/logout', function(req, res, next){
    req.logout(function(err){
        if(err)return next(err);
        res.redirect('/');
    });
})

app.get('/auth/google',
    passport.authenticate('google', { scope: ['profile'] })
);

app.get('/auth/google/home', 
    passport.authenticate('google', { failureRedirect: '/loginerr' }),
    function(req, res) {
      // Successful authentication, redirect home.
      res.redirect('/home');
    }
);

app.post('/signup', function(req, res){
    MusicUser.findOne({username: req.body.username}).then((user)=>{
        if(!user){
            const newUser = new MusicUser({
                username: req.body.username,
                password: req.body.password
            });
            newUser.save();
            res.redirect('/login');
        }
        if(user){
            // alert("Account with this username already exists login to continue.");
            res.redirect('/signuperr');
        }
    })
})

app.post('/login', 
    passport.authenticate('local', { failureRedirect: '/loginerr' }),
    function(req, res) {
      res.redirect('/home');
    }
)

app.listen(3000, function(req,res){
    console.log("server up and running on http://localhost:3000");
})