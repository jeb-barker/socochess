'use strict';

var JEB_CHESS_URL = 'https://jeb-chess.sites.tjhsst.edu/';

var routes = require('../routes');
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

const server = createServer(app);
const wss = new ws.WebSocket.Server({ server });

wss.on('connection', function (ws) {
    ws.send(JSON.stringify({pgn: "OPEN"}))
    ws.on('error', (error)=>{
        console.log('error:', error.message);
    })
    ws.on('message', function (message) {
        console.log(message);
        let m = JSON.parse(message.data);
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
                        ret = JSON.parse(dat);
                        console.log("\n-----\n"+ret);
                    })
                })
                ws.send(ret);
            }
            else if(m.message === "request_pgn"){
                //send pgn.
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
    clearInterval(id);
  });
  
  ws.on('error', (error)=>{
      console.log('error:', error.message);
  })
});

server.listen(process.env.PORT || 8080, process.env.HOST || "0.0.0.0", function () {
  console.log('Listening on port 8080');
});
