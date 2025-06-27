const http = require('http');
const fs = require('fs');
const path = require('path');
const { Server } = require("socket.io");
const db = require('./database');
const cookie = require('cookie');

const validAuthTokens = [];

const indexHtmlFile = fs.readFileSync(path.join(__dirname, 'static', 'index.html'));
const scriptFile = fs.readFileSync(path.join(__dirname, 'static', 'script.js'));
const styleFile = fs.readFileSync(path.join(__dirname, 'static', 'style.css'));
const authFile = fs.readFileSync(path.join(__dirname, 'static', 'auth.js'));
const registerFile = fs.readFileSync(path.join(__dirname, 'static', 'register.html'));
const loginFile = fs.readFileSync(path.join(__dirname, 'static', 'login.html'));

const server = http.createServer((req, res) => {
    if (req.method === 'GET') {
        switch(req.url) {
            case '/script.js': return res.end(scriptFile);
            case '/style.css': return res.end(styleFile);
            case '/auth.js': return res.end(authFile);
            case '/register': return res.end(registerFile);
            case '/login': return res.end(loginFile);
            default: return guarded(req, res);
        }
    }
    if (req.method === 'POST') {
        switch(req.url) {
            case '/api/register': return registerUser(req, res);
            case '/api/login': return login(req, res);
            default: return guarded(req, res);
        }
    }
    
    res.statusCode = 404;
    return res.end('Error 404');
});

function guarded(req, res) {
    const credentionals = getCredentionals(req.headers?.cookie);
    if (!credentionals) {
        res.writeHead(302, {'Location': '/register'});
        return res.end();
    }
    if (req.method === 'GET') {
        switch(req.url) {
            case '/': return res.end(indexHtmlFile);
            case '/script.js': return res.end(scriptFile);
        }
    }
    res.statusCode = 404;
    return res.end('Error 404');
}

function getCredentionals(c = '') {
    const cookies = cookie.parse(c);
    const token = cookies?.token;
    if (!token || !validAuthTokens.includes(token)) return null;
    const [user_id, login] = token.split('.');
    if (!user_id || !token) return null;
    return {user_id, login};
}

function registerUser(req, res) {
    let data = '';
    req.on('data', function(chunk) {
        data += chunk;
    });
    req.on('end', async function() {
        try {
            const user = JSON.parse(data);
            if (!user.login || !user.password) {
                return res.end('Empty login or password');
            }
            if (await db.isUserExist(user.login)) {
                return res.end('User alresdy exist');
            }
            await db.addUser(user);
            return res.end('Registration is successfull');
        } catch(e) {
            return res.end('Error: ' + e);
        }
    });
};

function login(req, res) {
    let data = '';
    req.on('data', function(chunk) {
        data += chunk;
    });
    req.on('end', async function() {
        try {
            const user = JSON.parse(data);
            const token = await db.getAuthToken(user);
            validAuthTokens.push(token);
            res.writeHead(200);
            return res.end(token);
        } catch(e) {
            res.writeHead(500);
            return res.end('Error: ' + e);
        }
    });
};

server.listen(3000);

const io = new Server(server);

io.use((socket, next) => {
    const cookie = socket.handshake.auth.cookie;
    const credentionals = getCredentionals(cookie);
    if (!credentionals) {
        next(new Error("no auth"));
    }
    socket.credentionals = credentionals;
    next();
});

io.on('connection', async (socket) => {
    console.log('a user connected. id - ' + socket.id);
    let userNickname = socket.credentionals?.login;
    let userId = socket.credentionals?.user_id;
    let messages = await db.getMessages();

    socket.emit('all_messages', messages);

    socket.on('new_message', async (message) => {
        db.addMessage(message, userId);
        let photo = await db.getPhoto(userId);
        io.emit('message', photo, userNickname + ': ' + message);
    });
});
