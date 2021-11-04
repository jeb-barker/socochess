'use strict';

var JEB_CHESS_URL = 'https://jeb-chess.sites.tjhsst.edu/';

var routes = require('../routes');
//var async = require('async');
const express = require('express');
const path = require('path');
const { createServer } = require('http');
var https = require('https');

const ws = require('ws');

const app = express();
app.use(express.static("../public"));

app.get('/', function (req, res) {

    console.log('user landed at main page');

    let obj = {}

    let dater = new Date();
    let month = dater.getMonth() + 1;
    let date = dater.getDate();
    let year = dater.getFullYear();
    console.log("\tGot date as: " + month + "/" + date + "/" + year);

    res.render("index.hbs", obj);
});

routes.do_setup(app);

app.get('*', function (req, res) {
    res.status(404).send('Someone did an oopsie! you tried to go to ' + req.protocol + '://' + req.get('host') + req.originalUrl);
});

var passport = require('passport')
var mysql = require('mysql');
var cookieSession = require('cookie-session')
const {AuthorizationCode} = require('simple-oauth2');
var GoogleStrategy = require('passport-google-oauth20').Strategy;
var GOOGLE_CLIENT_ID     = '221807810876-crak3hle4q6dsti76vb00tf9mir3uj7e.apps.googleusercontent.com';
var GOOGLE_CLIENT_SECRET = '44XG9hKl3Ywg8c5mebiJV293';
var google_redirect_uri  = 'https://socochess.sites.tjhsst.edu/login_helper';
var userProfile = ""

app.use(cookieSession({name: "google-cookie", keys: ['googleauthKey', 'secretionauthKey', 'superduperextrasecretcookiegoogleKey'], maxAge: 86400000}))
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, done) => {
    done(null, user.id);
});
passport.deserializeUser((id, done) => {
    done(null, id)
});
passport.use(new GoogleStrategy({
    clientID: GOOGLE_CLIENT_ID,
    clientSecret: GOOGLE_CLIENT_SECRET,
    callbackURL: google_redirect_uri
},
function(accessToken, refreshToken, profile, cb) {
    //console.log(res.locals.userProfile)
    return cb(null, profile);
}
));

class Database {
    constructor( config ) {
        this.connection = mysql.createConnection( config );
    }
    query( sql, args ) {
        return new Promise( ( resolve, reject ) => {
            this.connection.query( sql, args, ( err, rows ) => {
                if ( err )
                    return reject( err );
                resolve( rows );
            } );
        } );
    }
    close() {
        return new Promise( ( resolve, reject ) => {
            this.connection.end( err => {
                if ( err )
                    return reject( err );
                resolve();
            } );
        } );
    }
}

var database = new Database({
    host: process.env.DIRECTOR_DATABASE_HOST,
    user: process.env.DIRECTOR_DATABASE_USERNAME,
    password: process.env.DIRECTOR_DATABASE_PASSWORD,
    database: process.env.DIRECTOR_DATABASE_NAME
 })

const server = createServer(app);
const wss = new ws.WebSocket.Server({ server });

wss.on('connection', async function connection(ws, request, client) {
    let userData = await database.query("SELECT data FROM chess_players WHERE id=\'"+116264767626572588517+"\'")
    ws.send(JSON.stringify({mess: "OPEN", current_game: userData.chess.current_game}))
    ws.on('error', (error)=>{
        console.log('error:', error.message);
    })
    ws.on('message', async (message) => {
        console.log(message);
        let m = JSON.parse(message);
        let ret = {};
        let dat = '';
        if(m.message){
            if(m.message === "request_move"){
                let options = {headers:{'User-Agent': 'request'}};
                https.get(JEB_CHESS_URL + "ai2?pgn=" + m.pgn + "&t=5", options, function(response){
                    response.on('data', function(chunk){
                        dat+=chunk;
                        console.log("DAT= " + dat)
                    })
                    response.on('end', function(){
                        ret = dat
                        console.log("\n-----\n"+ret);
                        let userData = database.query("SELECT data FROM chess_players WHERE id=\'"+116264767626572588517+"\'")
                        userData.chess.current_game = m.pgn;
                        //await database.query("UPDATE chess_players SET data=\'"+JSON.stringify(userData)+"\' WHERE id=\'"+116264767626572588517+"\'");
                        ws.send(JSON.stringify({"move":ret}));
                    })
                })
            }
            else if(m.message === "request_pgn"){
                passport.authenticate("google")
                // if (req.user){
                    let userData = database.query("SELECT data FROM chess_players WHERE id=\'"+116264767626572588517+"\'")
                    ws.send(JSON.stringify({current_game: userData.chess.current_game}))
                // }
                // else{
                    //res.redirect('/login')
                // }
            }
        }
    })
    console.log('started client interval');

    ws.on('close', function () {
        console.log('stopping client interval');
    });
  
    ws.on('error', (error)=>{
        console.log('error:', error.message);
    })
});

server.listen(process.env.PORT || 8080, process.env.HOST || "0.0.0.0", function () {
  console.log('Listening on port 8080');
});
