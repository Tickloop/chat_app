const WebSocket = require('ws');
const express = require('express');
const app = express();
const server = app.listen(process.env.PORT || 3000);
const wss = new WebSocket.Server({ server });

wss.on('connection', function connection (ws){
    ws.on('message', function message(data){
        wss.clients.forEach(function each(client){
            if(client.readyState === WebSocket.OPEN){
                client.send(JSON.stringify({
                    'type': 'USER_MESSAGE',
                    'message': JSON.parse(data)
                }));
            }
        });
    });
    console.log(`new user connected. total users: ${wss.clients.size}`);

    wss.clients.forEach(updateLiveCount);

    ws.on('close', function close(){
        wss.clients.forEach(updateLiveCount);
        console.log(`user disconnected. total users: ${wss.clients.size}`);
    })
});

function updateLiveCount(client){
    if(client.readyState === WebSocket.OPEN){
        client.send(JSON.stringify({
            'type': 'USER_COUNT',
            'count': wss.clients.size
        }));
    }
}

app.use(express.static(__dirname));
app.get('/', (req, res) => {
    res.sendFile('index.html', {
        root: __dirname
    });
});