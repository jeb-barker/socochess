'use strict';

var JEB_CHESS_URL = 'https://jeb-chess.sites.tjhsst.edu/';

var routes = require('../routes');
const express = require('express');
const path = require('path');
const { createServer } = require('http');
var https = require('https');

var crypto = require("crypto");


const app = express();
app.use(express.static("../public"));

var passport = require('passport')
var mysql = require('mysql');
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

var cookieSession = require('cookie-session');
const {AuthorizationCode} = require('simple-oauth2');
var GoogleStrategy = require('passport-google-oauth20').Strategy;
var GOOGLE_CLIENT_ID     = '221807810876-crak3hle4q6dsti76vb00tf9mir3uj7e.apps.googleusercontent.com';
var GOOGLE_CLIENT_SECRET = '44XG9hKl3Ywg8c5mebiJV293';
var google_redirect_uri  = 'https://socochess.sites.tjhsst.edu/login_helper';
var userProfile = "";

app.use(cookieSession({name: "google-cookie", keys: ['googleauthKey', 'secretionauthKey', 'superduperextrasecretcookiegoogleKey'], maxAge: 36000000}));
app.use(passport.initialize());
app.use(passport.session());
const expressWs = require('express-ws')(app);

passport.serializeUser((user, done) => {
    done(null, user.id);
});
passport.deserializeUser((id, done) => {
    done(null, id);
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

app.get("/login", passport.authenticate("google", {scope: ["profile", "email"]}));

//warnings are due to async keyword.
app.get('/login_helper', passport.authenticate("google"), async (req,res)=>{
    userProfile = req.user
    try{
        let results = await database.query("SELECT id FROM chess_players")
        let newUser = true;
        console.log("results: ", results);
        for (let x=0; x<results.length; x++){
            console.log(results[x].id, " --- ", req.user.id);
            if (results[x].id === req.user.id){
                newUser = false;
                break;
            }
        }
    
    
        //insert new user into chess_players ONLY IF they aren't in chess_players
        if (newUser){
            let userData = {personal:{}, chess:{}};
            userData.personal.id = req.user.id;
            userData.personal.name = req.user.displayName;
            userData.personal.email = req.user.emails[0].value;
            userData.chess.games_won = 0;
            userData.chess.games_lost = 0;
            userData.chess.current_game = "";
            userData.chess.game_history = [];
            var sql = "INSERT INTO chess_players (id, name, data) VALUES (\'"+req.user.id+"\', \'"+req.user.displayName+"\', \'"+JSON.stringify(userData)+"\')";
            console.log(sql);
            await database.query(sql)
        }
        res.redirect('/');
    }
    catch(err){
     console.log(err);
     res.redirect("/login")
    }
});

//const server = createServer(app);
//const wss = new ws.WebSocket.Server({ server });

app.get('/', async function (req, res) {
    console.log('user landed at main page');

    let obj = {}

    let dater = new Date();
    let month = dater.getMonth() + 1;
    let date = dater.getDate();
    let year = dater.getFullYear();
    
    console.log("\tGot date as: " + month + "/" + date + "/" + year);
    passport.authenticate("google")
    if (req.user){
        res.locals.user_id = req.user;
        console.log("in the func: ", res.locals.user_id)
        let userData = await database.query("SELECT data FROM chess_players WHERE id=\'"+req.user+"\'")
        
        res.render('index.hbs', JSON.parse(userData[0].data));//, JSON.parse(userData[0].data)) 
    }
    else{
        //res.redirect('/login')
        //let userData = await database.query("SELECT data FROM chess_players WHERE id=\'"+req.user+"\'")
        res.redirect('/login');//, JSON.parse(userData[0].data))
    }
});

app.get('/play/menu', async function (req, res) {
    console.log('user landed at menu page');

    let obj = {}

    let dater = new Date();
    let month = dater.getMonth() + 1;
    let date = dater.getDate();
    let year = dater.getFullYear();
    
    console.log("\tGot date as: " + month + "/" + date + "/" + year);
    passport.authenticate("google")
    if (req.user){
        res.locals.user_id = req.user;
        console.log("in the func: ", res.locals.user_id)
        let userData = await database.query("SELECT data FROM chess_players")
        let dat = {nameList: []}
        for(let i = 0; i < userData.length; i+=1){
            dat.nameList[i] = JSON.parse(userData[i].data);
        }
        //userData is a list of RowDataPackets
        console.log("name: ",dat)
        res.render('menu.hbs', (dat));//, JSON.parse(userData[0].data)) 
    }
    else{
        //res.redirect('/login')
        //let userData = await database.query("SELECT data FROM chess_players WHERE id=\'"+req.user+"\'")
        res.redirect('/login');//, JSON.parse(userData[0].data))
    }
});

app.get('/play/ai', async function (req, res) {
    console.log('user landed at main page');

    let obj = {}

    let dater = new Date();
    let month = dater.getMonth() + 1;
    let date = dater.getDate();
    let year = dater.getFullYear();
    
    console.log("\tGot date as: " + month + "/" + date + "/" + year);
    passport.authenticate("google")
    if (req.user){
        res.locals.user_id = req.user;
        console.log("in the func: ", res.locals.user_id)
        let userData = await database.query("SELECT data FROM chess_players WHERE id=\'"+req.user+"\'")
        
        res.render('ai.hbs', JSON.parse(userData[0].data));//, JSON.parse(userData[0].data)) 
    }
    else{
        //res.redirect('/login')
        //let userData = await database.query("SELECT data FROM chess_players WHERE id=\'"+req.user+"\'")
        res.redirect('/login');//, JSON.parse(userData[0].data))
    }
});



app.ws('/play/ai', async function (ws, req) {
    let user_id = "";
    let userData = await database.query("SELECT data FROM chess_players WHERE id=\'"+req.user+"\'")
    userData = JSON.parse(userData[0].data) 
    if(userData.chess.current_game === ""){
        ws.send(JSON.stringify({pgn: "OPEN"}))
    }
    else{
        ws.send(JSON.stringify({pgn: "OPEN", resume: true, resume_pgn: userData.chess.current_game}))
    }
    ws.on('error', (error)=>{
        console.log('websocket error:', error.message);
    })
    ws.on('message', async function (messages) {
        //console.log(messages);
        // console.log("BRUHHHH--- ",String.fromCharCode.apply(null, new Uint16Array(messages)));
        // let mes = String.fromCharCode.apply(null, new Uint16Array(messages))
        let m = JSON.parse(messages);
        console.log('message in onmessage: ', m)
        let ret = {};
        let dat = '';
        if(m.message){
            if(m.message === "request_move_1"){
                let options = {headers:{'User-Agent': 'request'}};
                let userData = await database.query("SELECT data FROM chess_players WHERE id=\'"+req.user+"\'")
                userData = JSON.parse(userData[0].data) 
                userData.chess.current_game = m.pgn
                await database.query("UPDATE chess_players SET data=\'"+JSON.stringify(userData)+"\' WHERE id=\'"+req.user+"\'")
                console.log(req.user, " requested move from AI1. \n", userData)
                https.get(JEB_CHESS_URL + "ai1?pgn=" + m.pgn + "&t=5", options, function(response){
                    response.on('data', function(chunk){
                        dat+=chunk;
                        console.log("DAT= " + dat)
                    })
                    response.on('end', function(){
                        ret = {move:dat}
                        console.log("\n-----\n"+ret);
                        //replace here?
                        ws.send(JSON.stringify(ret));
                    })
                })
            }
            else if(m.message === "request_move_2"){
                let options = {headers:{'User-Agent': 'request'}};
                https.get(JEB_CHESS_URL + "ai2?pgn=" + m.pgn + "&t=5", options, function(response){
                    response.on('data', function(chunk){
                        dat+=chunk;
                        console.log("DAT= " + dat)
                    })
                    response.on('end', function(){
                        ret = {move:dat}
                        console.log("\n-----\n"+ret);
                        ws.send(JSON.stringify(ret));
                    })
                })
            }
            else if(m.message === "opening"){
                user_id = m.id
                console.log("uID: ", user_id)
            }
            else if(m.message === "game_over"){
                let userData = await database.query("SELECT data FROM chess_players WHERE id=\'"+req.user+"\'")
                userData = JSON.parse(userData[0].data)
                let status = ""
                if (m.code == "1"){
                    userData.chess.games_won += 1
                    status = "win"
                }
                if (m.code == "-1"){
                    userData.chess.games_lost += 1
                    status = "loss"
                }
                if (m.code == "0"){
                    status = "draw"
                }
                userData.chess.game_history.push(userData.chess.current_game + " --- " + status)
                userData.chess.current_game = ""
                await database.query("UPDATE chess_players SET data=\'"+JSON.stringify(userData)+"\' WHERE id=\'"+req.user+"\'")
                //res.redirect('/')
            }
        }
    })
//     const id = setInterval(function () {
//     //ws.send(JSON.stringify(process.memoryUsage()), function () {
//       //
//       //
//     //});
//   }, 1000);
  console.log('started client interval');

  ws.on('close', function () {
    console.log('stopping client interval');
    //clearInterval(id);
  });
  
  ws.on('error', (error)=>{
      console.log('error:', error.message);
  })
});

app.get('/play/createLink', async function (req, res) {
    console.log('user landed at main page');

    let obj = {}
    
    let id = crypto.randomBytes(20).toString('hex');
    
    passport.authenticate("google")
    if (req.user){
        //var sql = "INSERT INTO chess_players (id, name, data) VALUES (\'"+req.user.id+"\', \'"+req.user.displayName+"\', \'"+JSON.stringify(userData)+"\')";
        let game_data = await database.query("SELECT userIDs, game_id FROM chess_games")
        for(let i = 0; i < game_data.length; i+=1){
            let uid = JSON.parse(game_data[i].userIDs);
            if((uid.white == req.user && uid.black == req.query.opp) || (uid.white == req.query.opp && uid.black == req.user)){
                res.redirect('/play/versus/'+game_data[i].game_id+'/')
            }
        }
        let userIDs = {};
        userIDs.white = req.query.opp;
        userIDs.black = req.user;
        await database.query("INSERT INTO chess_games (game_id, userIDs, pgn) VALUES (\'"+id+"\', \'"+JSON.stringify(userIDs)+"\', \'\')");
        res.redirect('/play/versus/'+id+'/'); 
    }
    else{
        //res.redirect('/login')
        //let userData = await database.query("SELECT data FROM chess_players WHERE id=\'"+req.user+"\'")
        res.redirect('/login');//, JSON.parse(userData[0].data))
    }
});

app.get('/play/versus/:secret([a-fA-F0-9]+\/)/', async function (req, res) {
    console.log('user landed at versus');

    let obj = {}
    
    
    passport.authenticate("google")
    if (req.user){
        res.render('pvp.hbs')
    }
    else{
        //res.redirect('/login')
        //let userData = await database.query("SELECT data FROM chess_players WHERE id=\'"+req.user+"\'")
        res.redirect('/login');//, JSON.parse(userData[0].data))
    }
});
//fix this please!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

var pvpWss = expressWs.getWss('/play/versus/:secret([a-fA-F0-9]+\/)/');

app.ws('/play/versus/:secret([a-fA-F0-9]+\/)/', async function (ws, req) {
    req.params.secret = req.params.secret.substring(0,40)
    console.log("Inside the pvp wss\n_______________________\n"+req.params.secret+"\n")
    let user_id = "";
    
    let userData = await database.query("SELECT data FROM chess_players WHERE id=\'"+req.user+"\'")
    let game_data = await database.query("SELECT userIDs, pgn FROM chess_games WHERE game_id=\'"+ req.params.secret +"\'")
    userData = JSON.parse(userData[0].data);
    console.log(game_data)
    let game_data_pgn = game_data[0].pgn;
    let game_data_userIDs = JSON.parse(game_data[0].userIDs);
    let userColor = "white";
    if(req.user == game_data_userIDs.black){
        userColor = "black";
    }
    if(game_data_pgn == ''){
        ws.send(JSON.stringify({pgn: "OPEN", color: userColor, special: req.params.secret}))
    }
    else{
        ws.send(JSON.stringify({pgn: "OPEN", resume: true, resume_pgn: game_data_pgn, color: userColor, special: req.params.secret}))
    }
    ws.on('error', (error)=>{
        console.log('websocket error:', error.message);
    })
    ws.on('message', async function (messages) {
        //console.log(messages);
        // console.log("BRUHHHH--- ",String.fromCharCode.apply(null, new Uint16Array(messages)));
        // let mes = String.fromCharCode.apply(null, new Uint16Array(messages))
        let m = JSON.parse(messages);
        console.log('message in onmessage: ', m)
        let ret = {};
        let dat = '';
        if(m.message){
            if(m.message === "request_move"){
                let options = {headers:{'User-Agent': 'request'}};
                let game_data = await database.query("SELECT userIDs, pgn FROM chess_games WHERE game_id=\'"+ req.params.secret +"\'")
                console.log(m.pgn)
                let game_data_userIDs = JSON.parse(game_data[0].userIDs); 
                let game_data_pgn = m.pgn
                await database.query("UPDATE chess_games SET pgn=\'"+game_data_pgn+"\' WHERE game_id=\'"+req.params.secret+"\'")
                userData.chess.current_game = game_data_pgn
                pvpWss.clients.forEach(function (client) {
                    client.send(JSON.stringify({broadcast: req.params.secret, uData: userData, color: userColor}));
                });
                
            }
            else if(m.message === "game_over"){
                let userData = await database.query("SELECT data FROM chess_players WHERE id=\'"+req.user+"\'")
                userData = JSON.parse(userData[0].data)
                let status = ""
                if (m.code == "1"){
                    userData.chess.games_won += 1
                    status = "win"
                }
                if (m.code == "-1"){
                    userData.chess.games_lost += 1
                    status = "loss"
                }
                if (m.code == "0"){
                    status = "draw"
                }
                userData.chess.game_history.push(userData.chess.current_game + " --- " + status)
                //userData.chess.current_game = ""
                await database.query("UPDATE chess_players SET data=\'"+JSON.stringify(userData)+"\' WHERE id=\'"+req.user+"\'")
                await database.query("UPDATE chess_games SET userIDs=\'"+JSON.stringify({white:-1,black:-1})+"\' WHERE id=\'"+req.params.secret+"\'")
                
                //res.redirect('/')
            }
        }
    })
//     const id = setInterval(function () {
//     //ws.send(JSON.stringify(process.memoryUsage()), function () {
//       //
//       //
//     //});
//   }, 1000);
  console.log('started client interval');

  ws.on('close', function () {
    console.log('stopping client interval');
    //clearInterval(id);
  });
  
  ws.on('error', (error)=>{
      console.log('error:', error.message);
  })
});

//routes.do_setup(app);

app.get('*', function (req, res) {
    res.status(404).send('Someone did an oopsie! you tried to go to ' + req.protocol + '://' + req.get('host') + req.originalUrl);
});

app.listen(process.env.PORT || 8080, process.env.HOST || "0.0.0.0", function () {
  console.log('Listening on port 8080');
});