const WebSocket = require('ws');
const wss = new WebSocket.Server({port: 8000});

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