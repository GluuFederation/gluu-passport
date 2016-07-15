var express = require('express');
var router = express.Router();
var jwt = require('jsonwebtoken');

var passportLinkedIn = require('../auth/linkedin');
var passportGithub = require('../auth/github');
var passportTwitter = require('../auth/twitter');
var passportFacebook = require('../auth/facebook');
var passportTumblr = require('../auth/tumblr');
var passportYahoo = require('../auth/yahoo');
var passportGoogle = require('../auth/google');
var passportWindowsLive=require('../auth/windowslive');
var passportDropbox =require('../auth/dropbox');
var config = require('../_config');

var validateToken = function(req, res, next){
  var token = req.body.token || req.params.token || req.headers['x-access-token'];
  if (token) {
    // verifies secret and checks expiration of token
    jwt.verify(token, config.applicationSecretKey, function(err, decoded) {      
      if (err) {
        return res.json({ success: false, message: 'Failed to authenticate token.' });    
      } else {
        // if everything is good, save to request for use in other routes
        req.decoded = decoded;    
        next();
      }
    });

  } else {

    // if there is no token
    // return an error
    return res.status(403).send({ 
        success: false, 
        message: 'No token provided.' 
    });
    
  }
}

router.get('/', function(req, res, next) {
  res.render('index', { title: 'Node-Passport' });
});
router.get('/login', function(req, res, next) {
  res.send('Go back and register!');
});

router.get('/auth/linkedin', passportLinkedIn.authenticate('linkedin'));

router.get('/auth/linkedin/callback',
  passportLinkedIn.authenticate('linkedin', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication
    res.json(req.user);
  });

router.get('/auth/github', passportGithub.authenticate('github', { scope: [ 'user:email' ] }));

router.get('/auth/github/callback',
  passportGithub.authenticate('github', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication
    res.json(req.user);
  });


router.use('/auth/twitter/callback',passportTwitter.authenticate('twitter'),
  function(req, res) {
    var queryUserString = encodeURIComponent(JSON.stringify(req.user));
    res.redirect(config.applicationEndpoint + '?user=' + queryUserString);
  } );

router.get('/auth/twitter/:token', 
  passportTwitter.authenticate('twitter'));


router.get('/auth/facebook', passportFacebook.authenticate('facebook'));

router.get('/auth/facebook/callback',
  passportFacebook.authenticate('facebook', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication
    res.json(req.user);
  });
  
router.get('/auth/tumblr', passportTumblr.authenticate('tumblr'));

router.get('/auth/tumblr/callback',
  passportTumblr.authenticate('tumblr', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication
    res.json(req.user);
  });
  
  
router.get('/auth/yahoo', passportYahoo.authenticate('yahoo'));

router.get('/auth/yahoo/callback',
  passportYahoo.authenticate('yahoo', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication
    res.json(req.user);
  });
  
router.get('/auth/google/', passportGoogle.authenticate('google',{ scope: 'https://www.google.com/m8/feeds' }));

router.get('/auth/google/callback',
  passportGoogle.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication
    res.json(req.user);
  });
  
 router.get('/auth/windowslive', passportWindowsLive.authenticate('windowslive'));

router.get('/auth/windowslive/callback',
  passportWindowsLive.authenticate('windowslive'),
  function(req, res) {
    // Successful authentication
    res.json(req.user);
  });
  
  
  router.get('/auth/dropbox', passportDropbox.authenticate('dropbox'));

router.get('/auth/dropbox/callback',
  passportGoogle.authenticate('dropbox'),
  function(req, res) {
    // Successful authentication
    res.json(req.user);
  });
  
  
  

module.exports = router;
