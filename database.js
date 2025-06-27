const fs = require('fs');
const crypto = require('crypto');

const dbFile = "./chat.db";
const exists = fs.existsSync(dbFile);
const sqlite3 = require('sqlite3').verbose();
const dbWrapper = require('sqlite');
let db;

dbWrapper
.open({
    filename: dbFile,
    driver: sqlite3.Database
})
.then(async dBase => {
    db = dBase;
    try {
        if (!exists) {
            await db.run(
                `CREATE TABLE user(
                user_id INTEGER PRIMARY KEY AUTOINCREMENT,
                login TEXT,
                password TEXT,
                salt TEXT,
                photo TEXT
                );`
            );

            await db.run(
                `CREATE TABLE message(
                msg_id INTEGER PRIMARY KEY AUTOINCREMENT,
                content TEXT,
                author INTEGER,
                FOREIGN KEY(author) REFERENCES user(user_id)
                );`
            );
        } else {
            console.log(await db.all("SELECT * FROM user"));
        }
    } catch (dbError) {
        console.log(dbError);
    }
});

module.exports = {
    getMessages: async () => {
        try {
            return await db.all(
                `SELECT msg_id, content, login, user_id, photo FROM message
                JOIN user ON message.author = user.user_id`
            );
        } catch (dbError) {
            console.error(dbError);
        }
    },
    addMessage: async (messages, userId) => {
        await db.run(
            `INSERT INTO message (content, author) VALUES (?, ?)`,
            [messages, userId]
        );
    },
    isUserExist: async (login) => {
        const candidate = await db.all(`SELECT * FROM user WHERE login = ?`, [login]);
        return !!candidate.length;
    },
    addUser: async (user) => {
        const salt = crypto.randomBytes(16).toString('hex');
        const password = crypto.pbkdf2Sync(user.password, salt, 1000, 64, `sha512`).toString('hex');
        await db.run(
            `INSERT INTO user (login, password, salt, photo) VALUES (?, ?, ?, ?)`,
            [user.login, password, salt, user.photo]
        );
        console.log(await db.all("SELECT * FROM user"));
    },
    getAuthToken: async (user) => {
        const candidate = await db.all(`SELECT * FROM user WHERE login = ?`, [user.login]);
        if (!candidate.length) {
            throw 'Wrong login';
        }
        const {user_id, login, password, salt} = candidate[0];
        const hash = crypto.pbkdf2Sync(user.password, salt, 1000, 64, `sha512`).toString('hex');
        if (password !== hash) {
            throw 'Wrong password';
        }
        return user_id + '.' + login + '.' + crypto.randomBytes(20).toString('hex');
    },
    getPhoto: async (userId) => {
        const user = await db.get(`SELECT photo FROM user WHERE user_id = ?`, [userId]);
        return user.photo;
    }
};