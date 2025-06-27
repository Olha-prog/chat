const socket = io({
    auth: {
        cookie: document.cookie
    }
});
const messages = document.getElementById('messages');
const form = document.getElementById('form');
const input = document.getElementById('input');
const logoutBtn = document.getElementById('logout-btn');

logoutBtn.addEventListener('click', (e) => {
    document.cookie = 'token=; Max-Age=0';
    location.assign('/login');
});

form.addEventListener('submit', function(e) {
    e.preventDefault();
    if (input.value) {
        socket.emit('new_message', input.value);
        input.value = '';
    }
});

socket.on('message', function(photo, message) {
    printMessage(photo, message);
});

socket.on('all_messages', function(msgArray) {
    msgArray.forEach(msg => {
        printMessage(msg.photo, msg.login + ': ' + msg.content);
    });
});

function printMessage(photo, message) {
    var img = document.createElement('img');
    img.className = 'photo';
    img.src = photo;

    var span = document.createElement('span');
    span.className = 'msg';
    span.textContent = message;

    var item = document.createElement('li');
    item.appendChild(img);
    item.appendChild(span);

    messages.appendChild(item);
    window.scrollTo(0, document.body.scrollHeight);
}

function changeNickname() {
    let nickname = prompt('Choose your nickname');
    if (nickname) {
        socket.emit('set_nickname', nickname);
    }
}
