const roomID = window.location.href.match(/[A-Z0-9]{5}/)[0];
const webSocketURL = window.location.origin.replace(/^http/, 'ws') + '/rooms/' + roomID;
const ws = new WebSocket(webSocketURL);
window.username = Math.floor(Math.random() * 1000);

const msg_box = document.getElementById('msg_box');
msg_box.addEventListener('keydown', (e) => {
    const msg = msg_box.value.trim();
    if(e.key === 'Enter' && msg !== ''){
        encryptMessage(msg)
        .then(msg => sendMessage(msg))
        .catch(err => console.log(err))
    }
});

const send_btn = document.getElementById('send_btn');
send_btn.addEventListener('click', (e) => {
    const msg = msg_box.value.trim();
    if(msg !== ''){
        encryptMessage(msg)
        .then(msg => sendMessage(msg))
        .catch(err => console.log(err))
    }
});

function handleOnMessage(data) {
    decryptMessage(data.message)
    .then(msg => {
        data.message = msg
        updateMessage(data)
    })
    .catch(err => console.log(err))
}

function sendMessage (msg){
    let username = document.getElementById('username').value.trim();

    if(username === ''){
        username = `user${window.username}`;
    }

    const data = {
        type: 'USER_MESSAGE',
        room: roomID,
        message: Array.from(new Uint8Array(msg)),
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
                handleOnMessage(msg)
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
                handleOnMessage(message['message']);
                break;
        }
    }
}

function getKeyMaterial() {
    let password = document.getElementById('secret_key').value;
    let enc = new TextEncoder();
    return window.crypto.subtle.importKey(
        "raw", 
        enc.encode(password), 
        {name: "PBKDF2"}, 
        false, 
        ["deriveBits", "deriveKey"]
    );
}

  /*
  Given some key material and some random salt
  derive an AES-GCM key using PBKDF2.
  */
function getKey() {
    let salt = generateRandom(16)
    return getKeyMaterial().then(keyMaterial => {
        return window.crypto.subtle.deriveKey(
            {
            "name": "PBKDF2",
            salt: salt, 
            "iterations": 100000,
            "hash": "SHA-256"
            },
            keyMaterial,
            { "name": "AES-GCM", "length": 256},
            true,
            [ "encrypt", "decrypt" ]
        );
    })    
}

function generateRandom(n) {
    let secret_key = document.getElementById('secret_key').value;
    let iv = new Uint8Array(n);
    for(let i = 0 ; i < n ; i++) {
        iv[i] = secret_key.charCodeAt(i)
    }
    return iv;
}

function encryptMessage(msg) {
    return getKey()
    .then(key => {
        let iv = generateRandom(12)
        let encoded = new TextEncoder().encode(msg);
    
        return window.crypto.subtle.encrypt(
            {
              name: "AES-GCM",
              iv: iv
            },
            key,
            encoded
        ).catch(err => console.log(err))
    })
}

function decryptMessage(msg) {
    return getKey()
    .then(key => {
        let msg_buff = new Uint8Array(msg).buffer;
        let iv = generateRandom(12)
        return window.crypto.subtle.decrypt(
            {
              name: "AES-GCM",
              iv: iv
            },
            key,
            msg_buff
        ).then(msg => new TextDecoder().decode(msg))
        .catch(err => {
            return msg.reduce((acc, e) => acc + e.toString(36), '')
        })
    })
}

// window.crypto.subtle.generateKey(
//     {
//         name: "AES-CTR",
//         length: 256
//     },
//     true,
//     ["encrypt", "decrypt"]
// ).then(key => { window.aes_key = key })