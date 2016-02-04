// IMPORTS //
var User = require('./models/User.js');
var Project = require('./models/Project.js');


// MIDDLEWARE FUNCTIONS //
var middle = {};

/**
 * proceed if user is logged in, redirect to home otherwise
 */
middle.auth = function (req, res, next) {
    if (req.session.email) {
        next();
    } else {
        res.status(401).send('Must be logged in for access');
    }
}

/**
 * proceed if user is logged in and is on given team or an admin, redirect to home otherwise
 * @param req.body.projectId OR req.query.projectId {string} - id of project to be protected
 */
middle.team = function (req, res, next) {
    if (req.session.isAdmin) next();
    else {
        var projectId = req.body.projectId || req.query.projectId;
        if (projectId && req.session.email) {
            Project.getProject(projectId, function (err, project) {
                if (err) res.redirect('/');
                else if (project.team.indexOf(req.session.email) !== -1) {
                    next();
                } else {
                    res.status(401).send('Must be on requested team for access');
                }
            })
        } else {
            res.status(401).send('Must be on requested team for access');
        }
    }
}

/**
 * proceed if user is logged in and has given email or an admin, redirect to home otherwise
 * @param req.body.email OR req.query.email OR req.body.user.email {string} - email of user to be protected
 */
middle.user = function (req, res, next) {
    if (req.session.isAdmin) next();
    else {
        var email = req.body.email || req.query.email || req.body.user.email;

        if (email && req.session.email) {
            if (email.toLowerCase() === req.session.email) {
                next();
            } else {
                res.status(401).send('Must be requested user for access');
            }
        } else {
            res.status(401).send('Must be requested user for access');
        }
    }
}

/**
 * proceed if user is logged in and is an admin, redirect to home otherwise
 */
middle.admin = function (req, res, next) {
    if (req.session.isAdmin) {
        next();
    } else {
        res.status(401).send('Must be admin for access');
    }
}


// EXPORTS //
module.exports = middle;
