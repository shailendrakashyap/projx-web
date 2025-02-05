// IMPORTS //
var router = require('express').Router();
var User = require('../models/User');
var perm = require('../perm');
var config = require('../../config');
var randomstring = require('randomstring');
var sha256 = require('sha256');


// ROUTES //

/**
 * GET / [user] - Get user object, return if current user matches or is admin
 * @param req.query.email - user email (required)
 */
router.get('/', perm.user, function(req, res) {
    if (!req.query.email) res.status(400).send('Email missing');
    else {
        User.getUser(req.query.email, function (err, user) {
            if (err) res.status(403).send(err);
            else res.status(200).send(user);
        });
    };
});


/**
 * GET /current - Get current user object
 */
router.get('/current', function(req, res) {
    if (!req.session.email) res.status(404).send('No user logged in');
    else {
        User.getUser(req.session.email, function (err, user) {
            if (err) res.status(403).send(err);
            else res.status(200).send(user);
        });
    };
});

/**
 * POST /assignkey - Assign a random key to current session and return it
 */
router.post('/assignkey', function(req, res) {
    if (!config.development) {
        var key = randomstring.generate(10);
        var url = 'https://' + config.scriptsUsername + '.scripts.mit.edu:444' + config.scriptsPath + '/auth.php';
        req.session.key = key;
        res.status(200).send(url + '?key=' + key);
    } else {
        var url = '/api/user/login';
        res.redirect(url);
    }
});

/**
 * GET /login - Try to log in user
 * @param req.query.email - user's email
 * @param req.query.token - user's token from cert auth site
 * @param req.query.name - user's name
 */
router.get('/login', function(req, res) {
    if (!config.development) {
        if (req.session.email) {
            // user already logged in
            res.redirect('/portal');
        } else {
            // get query params
            var email = req.query.email.toLowerCase();
            var token = req.query.token;
            var name = req.query.name;
    
            // compute token
            var key = req.session.key;
            var secret = config.authSecret;
            var correctToken = sha256(email + key + secret);
    
            if (email && token && (token === correctToken)) {
    
                // log in successful
                User.getUser(email, function (err, user) {
                    if (err) {
    
                        // user not found
                        User.createUser({
                            'email': email,
                            'name': name
                        }, function (err, newUser) {
                            if (err) {
                                res.send('Log in failed (requires valid MIT certificate)');
                            } else {
    
                                // user created, mount info to session and redirect to root
                                req.session.key = null;
                                req.session.email = newUser.email;
                                req.session.isAdmin = newUser.isAdmin;
                                res.redirect('/portal');
                            }
                        });
                    } else {
    
                        // user found, mount info to session and redirect to root
                        req.session.key = null;
                        req.session.email = user.email;
                        req.session.isAdmin = user.isAdmin;
                        res.redirect('/portal');
                    }
                });
            } else {
                // error message
                res.send('Log in failed (requires valid MIT certificate)');
            }
        }
    } else {
         // FORCE log in successful
         var email = config.devEmail;
         var name = config.devName;
         User.getUser(email, function (err, user) {
            if (err) {
                console.log("error in User.getUser()");
            } else {
                console.log("dev user confirmed")
                // user found, mount info to session and redirect to root
                req.session.key = null;
                req.session.email = user.email;
                req.session.isAdmin = user.isAdmin;
                res.status(200).send('/portal');
            };
        });

    }
    
});

/**
 * POST /logout - Log out any current user
 */
router.post('/logout', function(req, res) {
    if (req.session.email) {
        req.session = null;
        res.status(200).send('Log out successful');
    } else {
        res.status(400).send('There is no user currently logged in');
    }
});

/**
 * POST /update - [user] Update a user
 * @param req.body.user - User object
 */
router.post('/update', perm.user, function(req, res) {
    User.updateUser(req.body.user, function (err, result) {
        if (err) res.status(403).send(err);
        else res.status(200).send('User updated');
    });
});


/**
 * GET /getAdmin [admin] Get list of all admin
 */
router.get('/getAdmin', perm.admin, function(req, res) {
    User.find({ isAdmin: true }, function(err, users) {
        if (err) {
            res.status(403).send(err);
        } else {
            res.status(200).send(users);
        };
    });
});


/**
 * POST /resumeUpload - [user] Update a user's resume field
 * Request is sent from projx resume website
 * @param req.body.email
 * @param req.body.resume_url
 * @param req.body.secret_key
 */
router.post('/resumeUpload', function(req, res) {
    User.getUser(req.body.email, function (err, user) {
        if (err) {
            res.status(403).send(err);
        } else {
            if (req.body.secret == config.resumeSecretKey) {
                user.resume = req.body.url
                User.updateUser(user, function (err, result) {
                    if (err) res.status(403).send(err);
                    else res.status(200).send('User updated');
                });
            } else {
                res.status(403).send(err);
            }
        }
    });
});


// EXPORTS //
module.exports = router;
