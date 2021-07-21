const url = window.location.origin.replace(/^http/, 'ws');
const ws = new WebSocket(url);
window.username = Math.floor(Math.random() * 1000);

ws.onopen = function (event){
    function send_message (msg){
        let username = document.getElementById('username').value.trim();
    
        if(username === ''){
            username = `user${window.username}`;
        }
    
        const data = {
            message: msg,
            username: username
        }
        ws.send(JSON.stringify(data));
    
        msg_box.value = "";
    }
    
    const msg_box = document.getElementById('msg_box');
    const send_btn = document.getElementById('send_btn');
    
    msg_box.addEventListener('keydown', (e) => {
        const msg = msg_box.value.trim();
        if(e.key === 'Enter' && msg !== ''){
            send_message(msg);
        }
    });
    
    send_btn.addEventListener('click', (e) => {
        const msg = msg_box.value.trim();
        if(msg !== ''){
            send_message(msg);
        }
    });
    
    ws.onmessage = function (event){
        const message = JSON.parse(event.data);
        
        switch(message['type']){
            case 'USER_COUNT':
                update_user_counter(message['count']);
                break;
            case 'USER_MESSAGE':
                show_message(message['message']);
                break;
        }
    }
    
    function show_message(data){
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

    function update_user_counter(count){
        document.getElementById('counter').innerText = count;
    }
}