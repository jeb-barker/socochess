'use strict';

var routes = require('../routes');
const express = require('express');
const path = require('path');
const { createServer } = require('http');

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
    ws.on('error', (error)=>{
        console.log('error:', error.message);
    })
  const id = setInterval(function () {
    ws.send(JSON.stringify(process.memoryUsage()), function () {
      //
      //
    });
  }, 10);
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
