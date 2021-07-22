const WebSocket = require('ws');
const express = require('express');
const app = express();
const HTML_PATH = __dirname + "/public/html/";

app.use('/assets', express.static("public/assets"));

app.get('/', (req, res) => {
    res.sendFile(HTML_PATH + 'home.html');
});

app.get('/rooms/:id', (req, res) => {
    function checkRoomCode(code){
        const rxp = /[A-Z0-9]{5}/;
        const matches = code.match(rxp);
        return matches !== null && matches.length == 1 && matches[0] == code
    }

    if(!checkRoomCode(req.params.id)){
        res.redirect('/');
    }
    
    //id is the room id of the current room
    res.sendFile(HTML_PATH + 'room.html');
});

const server = app.listen(process.env.PORT || 3000);
const wss = new WebSocket.Server({ server: server });

const ROOMS = [];

wss.on('connection', function connection (ws, req){
    //the id of the room where the connection was made
    const match = req.url.match(/[A-Z0-9]{5}/);
    
    //checking to make sure that connection has been made from room url
    if(match === undefined && match.length !== 1){
        ws.close();
    }

    const room_id = match[0];

    //assigning the room_id to that connection
    ws.room_id = room_id;

    //updating the number of connections in each room
    if(room_id in ROOMS){
        ROOMS[room_id] += 1;
    }else{
        ROOMS[room_id] = 1;
    }
        
    ws.on('message', function message(data){
        data = JSON.parse(data);
        
        wss.clients.forEach(function each(client){
            if(client.readyState === WebSocket.OPEN && client.room_id == data.room){
                client.send(JSON.stringify({
                    'type': 'USER_MESSAGE',
                    'message': data
                }));
            }
        });
    });
    
    console.log(`new user connected to room: ${room_id}. total users in room: ${ROOMS[room_id]}. total users: ${wss.clients.size}`);
    updateLiveCount(wss.clients);

    ws.on('close', function close(close){
        const room_id = this.room_id;

        //decrementing total count of users in room
        ROOMS[room_id] -= 1;

        updateLiveCount(wss.clients, room_id);
        console.log(`user disconnected from room: ${room_id}. total users in room: ${ROOMS[room_id]}. total users: ${wss.clients.size}`);
    });

    function updateLiveCount(clients, room=room_id){
        clients.forEach(client => {
            if(client.readyState === WebSocket.OPEN && client.room_id == room){
                client.send(JSON.stringify({
                    'type': 'USER_COUNT',
                    'count': ROOMS[room]
                }));
            }
        })
    }
});

