var express = require('express');
var router = express.Router();
var multer = require('multer');
var upload = multer({dest:'./uploads'});
let User = require('../models/user');
var passport = require('passport');
var localStrategy = require('passport-local').Strategy;

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});
router.get('/register', function(req, res, next) {
  res.render('register',{title: 'Register'});
});
router.get('/login', function(req, res, next) {
  res.render('login', {title: 'Login'});
});
router.post('/login',
  passport.authenticate('local',{failureRedirect: '/users/login', failureFlash: 'Invalid username or password'}),
  function(req, res) {
    req.flash('success','You are now logged in.');
    res.redirect('/');
});
passport.serializeUser(function(user,done){
    done(null,user.id);
});
passport.deserializeUser(function(id,done){
    User.getUserById(id, function(err,user){
        done(err,user);
    });
});

// Local Strategy
passport.use(new localStrategy(function(username, password, done){
    User.getUserByUsername(username,function(err, user){
        if(err) throw err;
        if(!user) return done(null, false, {message: 'Unknown User'});
        User.comparePassword(password,user.password,function(err,isMatch){
            if(err) return done(err);
            if(isMatch) return done(null, user);
            else return done(null, false,{message: 'Invalid Password'});
        });
    });
}));

router.post('/register', upload.single('profileimage'),function(req, res, next) {
    let name = req.body.name;
    let email = req.body.email;
    let username = req.body.username;
    let password = req.body.password;
    let password2 = req.body.password2;
    if(req.file){
        console.log('Uploading file ...');
        var profileImg = req.file.filename;
    }else{
        console.log('No files uploaded!');
        var profileImg = 'noimage.jpg';
    }
    // Form validation
    req.checkBody('name','Name field is required').notEmpty();
    req.checkBody('email','Email field is required').notEmpty();
    req.checkBody('email','Enter a valid Email').isEmail();
    req.checkBody('username','Username field is required').notEmpty();
    req.checkBody('password','Password field is required').notEmpty();
    req.checkBody('password2','Passwords do not match').equals(req.body.password);

    // Check Errors
    var err = req.validationErrors();
    if(err){
        console.log(err);
        res.render('register',{
            title: 'Register Error',
            errors: err
        })
    }else{
        let newUser = new User({
            name: name,
            email:email,
            username:username,
            password:password,
            profileimage:profileImg
        });
        User.createUser(newUser,function(err, user){
            if(err) throw err;
            console.log(user);
        });
        req.flash('success','Welcome '+username+', You are now registered and can login');
        res.location('/');
        res.redirect('/');
    }
});

router.get('/logout',function(req,res){
    req.logout();
    req.flash('success','You are now logged out');
    res.redirect('/users/login');
});

module.exports = router;
