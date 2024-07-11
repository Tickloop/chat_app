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
    const code = req.params.id
    const rxp = /[A-Z0-9]{5}/
    const matches = code.match(rxp)
    if(!(matches !== null && matches.length == 1 && matches[0] == code)){
        res.redirect('/')
    }
    
    //id is the room id of the current room
    res.sendFile(HTML_PATH + 'room.html')
})

app.post('/rooms/:id', (req, res) => {
    const room_id = req.params.id
    fs.readFile(`./logs/msg/${room_id}.jsonl`, (err, data) => {
        if (err) {
            logger.error(err)
            res.send(JSON.stringify([]))
            return
        }
        data = data.toString().trim()
        if (data == '') {
            res.send(JSON.stringify([]))
            return
        }
        
        data = data.split('\n').map(e => JSON.parse(e))
        res.send(JSON.stringify(data))
    })
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
        if(err) logger.error(err)
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

function handleOnConnect (ws, req){
    //the id of the room where the connection was made
    const match = req.url.match(/[A-Z0-9]{5}/)
    
    //checking to make sure that connection has been made from room url
    if(match === undefined && match.length !== 1){
        ws.close()
    }
    const ROOM_ID = match[0]

    //assigning the room_id to that connection
    ws.room_id = ROOM_ID

    //updating the number of connections in each room
    if(ROOM_ID in ROOMS){
        ROOMS[ROOM_ID] += 1
    }else{
        ROOMS[ROOM_ID] = 1
    }
    
    ws.on('message', handleOnMessage)
    ws.on('close', handleOnClose)
    
    logger.info(`new user connected to room: ${ROOM_ID}. total users in room: ${ROOMS[ROOM_ID]}. total users: ${wss.clients.size}`)
    updateLiveCount(wss.clients, ROOM_ID)
}

wss.on('connection', handleOnConnect)

