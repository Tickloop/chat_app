const WebSocket = require('ws');
const express = require('express');
const app = express();
const server = app.listen(process.env.PORT || 3000);
const wss = new WebSocket.Server({ server });

wss.on('connection', function connection (ws){
    ws.on('message', function message(data){
        wss.clients.forEach(function each(client){
            if(client.readyState === WebSocket.OPEN){
                client.send(data);
            }
        });
    });
    console.log(`new user connected`);
});

app.use(express.static(__dirname));
app.get('/', (req, res) => {
    res.sendFile('index.html', {
        root: __dirname
    });
});