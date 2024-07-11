const roomID = window.location.href.match(/[A-Z0-9]{5}/)[0];
const webSocketURL = window.location.origin.replace(/^http/, 'ws') + '/rooms/' + roomID;
const ws = new WebSocket(webSocketURL);
window.username = Math.floor(Math.random() * 1000);

const msg_box = document.getElementById('msg_box');
msg_box.addEventListener('keydown', (e) => {
    const msg = msg_box.value.trim();
    if(e.key === 'Enter' && msg !== ''){
        sendMessage(msg);
    }
});

const send_btn = document.getElementById('send_btn');
send_btn.addEventListener('click', (e) => {
    const msg = msg_box.value.trim();
    if(msg !== ''){
        sendMessage(msg);
    }
});

function sendMessage (msg){
    let username = document.getElementById('username').value.trim();

    if(username === ''){
        username = `user${window.username}`;
    }

    const data = {
        type: 'USER_MESSAGE',
        room: roomID,
        message: msg,
        username: username
    }
    ws.send(JSON.stringify(data));

    msg_box.value = "";
}

function updateMessage (data) {
    const div_message = document.createElement('div');
    div_message.classList.add('message');
    
    const span_user = document.createElement('span');
    span_user.classList.add('user');
    span_user.innerText = `${data.username}: `;
    
    const span_msg = document.createElement('span');
    span_msg.classList.add('message');
    span_msg.innerText = `${data.message}`;
    
    div_message.append(span_user, span_msg);

    const chat_box = document.getElementById('chat_box');
    chat_box.append(div_message);

    chat_box.scrollTo(0, chat_box.scrollHeight);
}

function updateUserCount (count) {
    document.getElementById('counter').innerText = count;
}

function getChatHistory() {
    const url = window.location.origin + '/rooms/' + roomID;
    fetch(url, { method: 'POST' })
        .then(res => res.text())
        .then(data => JSON.parse(data))
        .then(data => {
            data.forEach(msg => {
                updateMessage(msg)
            });
        })
        .catch(err => console.log(err))
}

ws.onopen = function (){
    getChatHistory()
    
    ws.onmessage = function (event){
        const message = JSON.parse(event.data);
        
        switch(message['type']){
            case 'USER_COUNT':
                updateUserCount(message['count']);
                break;
            case 'USER_MESSAGE':
                updateMessage(message['message']);
                break;
        }
    }
}