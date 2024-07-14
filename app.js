const express = require("express");
const bodyParser =  require("body-parser");
const ejs = require('ejs');
const mongoose = require('mongoose');
// const md5 = require('md5');
const passport = require('passport');
const session = require('express-session');
const LocalStrategy = require('passport-local');
const passportLocalMongoose = require('passport-local-mongoose');

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
    password: String
});

musicUserSchema.plugin(passportLocalMongoose);

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

passport.serializeUser(MusicUser.serializeUser());
passport.deserializeUser(MusicUser.deserializeUser());

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