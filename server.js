const WebSocket = require('ws')
const express = require('express')
const app = express()
const HTML_PATH = __dirname + "/public/html/"
const fs = require('fs')
const { logger } = require('./logging')

app.use('/assets', express.static("public/assets"))

app.get('/', (req, res) => {
    res.sendFile(HTML_PATH + 'home.html')
})

app.get('/rooms/:id', (req, res) => {
    function checkRoomCode(code){
        const rxp = /[A-Z0-9]{5}/
        const matches = code.match(rxp)
        return matches !== null && matches.length == 1 && matches[0] == code
    }

    if(!checkRoomCode(req.params.id)){
        res.redirect('/')
    }
    
    //id is the room id of the current room
    res.sendFile(HTML_PATH + 'room.html')
})

const server = app.listen(process.env.PORT || 3000)
const wss = new WebSocket.Server({ server: server })

const ROOMS = []

function updateLiveCount(clients, room){
    clients.forEach(client => {
        if(client.readyState === WebSocket.OPEN && client.room_id == room){
            client.send(JSON.stringify({
                'type': 'USER_COUNT',
                'count': ROOMS[room]
            }))
        }
    })
}

function handleOnMessage(data) {
    const ROOM_ID = this.room_id
    fs.appendFile(`./logs/msg/${ROOM_ID}.jsonl`, data + '\n', { flag: 'a' }, err => {
        if(err) logger.error("Error persisting message: ", data)
    })
    data = JSON.parse(data)
    
    wss.clients.forEach(function each(client){
        if(client.readyState === WebSocket.OPEN && client.room_id == data.room){
            client.send(JSON.stringify({
                'type': 'USER_MESSAGE',
                'message': data
            }))
        }
    })
}

function handleOnClose (close) {
    const ROOM_ID = this.room_id
    ROOMS[ROOM_ID] -= 1
    updateLiveCount(wss.clients, ROOM_ID)
    logger.info(`user disconnected from room: ${ROOM_ID}. total users in room: ${ROOMS[ROOM_ID]}. total users: ${wss.clients.size}`)
}

wss.on('connection', function connection (ws, req){
    //the id of the room where the connection was made
    const match = req.url.match(/[A-Z0-9]{5}/)
    
    //checking to make sure that connection has been made from room url
    if(match === undefined && match.length !== 1){
        ws.close()
    }
    const room_id = match[0]

    //assigning the room_id to that connection
    ws.room_id = room_id

    //updating the number of connections in each room
    if(room_id in ROOMS){
        ROOMS[room_id] += 1
    }else{
        ROOMS[room_id] = 1
    }
        
    ws.on('message', handleOnMessage)
    ws.on('close', handleOnClose)
    
    logger.info(`new user connected to room: ${room_id}. total users in room: ${ROOMS[room_id]}. total users: ${wss.clients.size}`)
    updateLiveCount(wss.clients, room_id)
})

