const mysql = require('mysql2');
const http = require('http');

const connection = mysql.createConnection({
	host: 'localhost',
	user: 'root',
	password: 'Dfktynby',
	database: 'chat'
});

const server = http.createServer((req, res) => {
	switch(req.url) {
		case '/messages':
		connection.query(
			'SELECT * FROM message',
			function(err, results, fields) {
				let html = '<html><body><ul>';
				results.forEach(f => html += `<li>${f.content}</li>`);
				html += `</ul>
				<form action="/add">
					<input type="text" name="content">
				</form>
				</body></html>`;
				res.writeHead(200, {'Content-Type': 'text/html'})
				res.end(html);
			}
		);
		break;

		case '/friends':
		connection.query(
			'SELECT * FROM user',
			function(err, results, fields) {
				let html = '<html><body><ul>';
				results.forEach(f => html += `<li>${f.login}</li>`);
				html += '</ul></body></html>';
				res.writeHead(200, {'Content-Type': 'text/html'})
				res.end(html);
			}
		);
		break;

		case '/add':
		let data = '';
		req.on('data', function(chunk) {
			data += chunk;
		})
		req.on('end', function() {
			let sp = new URLSearchParams(data);
			let content = sp.get('content');
			console.log(content);
			connection.query(
				`INSERT INTO message (content, author_id, dialog_id) VALUES ("${content}", 4, 1)`,
				function(err, results, fields) {
					res.writeHead('302', {'Location': '/messages'});
					res.end();
				}
			);
		})
		break;

		default:
			res.writeHead(404, {'Content-Type': 'text/html'})
			res.end('<html><body><h1>Error 404</h1></body></html>');
	}
})


server.listen(3000);