var express = require('express'),
    passport = require('passport'),
    sys = require('system'),
    session = require('express-session'),
    TwitterStrategy = require('passport-twitter').Strategy,
    app = express(),
    TwitterAuthentication = new TwitterStrategy({
            consumerKey: 'JRlwuS9xCdHoLdQTWoRtmnOAI',
            consumerSecret: '5IhUb030L7cljuxMzvY4uFux5VjmGiDt9THB2enLX76qwzG6N9',
            callbackURL: "http://127.0.0.1:3000/auth/twitter/callback"
        },
        function(token, tokenSecret, profile, done) {
            profile.twitter_token = token;
            profile.twitter_token_secret = tokenSecret;
            return done(null, profile);
        }
    );

// Passport session setup.
passport.serializeUser(function(user, done) {
    done(null, user);
});

passport.deserializeUser(function(obj, done) {
    done(null, obj);
});

passport.use(TwitterAuthentication);


app.use(session({
    secret: 'keyboard cat',
    key: 'sid',
    name: 'sid',
    resave: true,
    saveUninitialized: true
}));
app.use(passport.initialize());
app.use(passport.session());

app.get('/', function (req, res) {
    res.send('Hello World! | <a href="/account">account</a> | <a href="/list">list</a> | <a href="/login">login</a>');
});

app.get('/auth/twitter/callback',
    passport.authenticate('twitter', { successRedirect : '/', failureRedirect: '/login' }),
    function(req, res) {
        res.redirect('/');
    }
);

app.get('/account', ensureAuthenticated, function(req, res){
    res.send(req.user);
});

app.get('/list', ensureAuthenticated, function(req, res){
    getTwitterTimeLine(req, function (err, data, response) {
        if(err) {
            res.send(err, 500);
            return;
        }
        res.send(data);
    });
});

app.get('/login', passport.authenticate('twitter'));



app.listen(3000, function () {
    console.log('Example app listening on port 3000!');
});

function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) { return next(); }
    res.redirect('/login')
}

function getTwitterTimeLine(req, callback) {
    var uri = 'https://api.twitter.com/1.1/statuses/user_timeline.json?screen_name=dbashyal&count=';
    if(req.query.count) {
        uri += req.query.count;
    } else {
        uri += "10";
    }

    passport._strategies.twitter._oauth._performSecureRequest(
        req.user.twitter_token,
        req.user.twitter_token_secret,
        'GET',
        uri,
        null,
        null, null, function (err, data, response) {
            var processedData;
            if(!err) {
                result = [];
                var max_id, since_id;
                var jsonData = JSON.parse(data);
                for (var i = 0; i < jsonData.length; i++) {
                    var record = jsonData[i];
                    var place_full_name = null;
                    if(record.place != undefined)
                        place_full_name = record.place.full_name;
                    result.push({
                        id_str: record.id_str,
                        created_at: record.created_at,
                        text: record.text,
                        user_screen_name: record.user.screen_name,
                        user_name: record.user.name,
                        user_profile_image_url: record.user.profile_image_url,
                        place_full_name: place_full_name
                    });
                }
            }
            callback(err, result, response);
        });
}