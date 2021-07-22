const room_btn = document.getElementById('room_btn');

room_btn.addEventListener('click', () => {
    const room_code = document.getElementById('room_code').value.trim();
    if(room_code !== ''){
        const url = window.location.origin + '/rooms/' + room_code;
        window.location.href = url;
    }
});