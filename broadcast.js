'use strict';

const net = require('net');
const MongoClient= require('mongodb').MongoClient;
const PORT = 3030;
const ADDRESS = '0.0.0.0';
const url = 'mongodb://localhost:27017/gprs';
const clients = [];

let server = net.createServer(onClientConnected);
server.listen(PORT, ADDRESS);

function onClientConnected(socket) {
  console.log(`New client: ${socket.remoteAddress}:${socket.remotePort}`);
  socket.destroy();
}

console.log(`Server started at: ${ADDRESS}:${PORT}`);

function onClientConnected(socket) {

  socket.name = `${socket.remoteAddress}:${socket.remotePort}`;
  clients.push(socket);
  console.log(`${socket.name} connected.`);
  socket.on('data', (data) => {
    let m = data.toString().replace(/[\n\r]*$/, '');
	  var d = {msg:{info:m}};
	  insertData(d);
    console.log(`${socket.name} said: ${m}`);
    broadcast(socket.name + "> " + data, socket);
    socket.write(`We got your message (${m}). Thanks!\n`);
  });

  socket.on('end', () => {
    clients.splice(clients.indexOf(socket), 1);
    console.log(`${socket.name} disconnected.`);
  });

}

function insertData(data){
  console.log(data,'data');
		MongoClient.connect(url, function(err, db){
		console.log(data);
		db.collection('gprs').save(data.msg , (err,result)=>{
			if(err){
				console.log("not inserted");
			}else {
				console.log("inserted");
			}
		});
	});
}

function broadcast(message, sender) {
    clients.forEach(function (client) {
      if (client === sender) return;
      client.write(message);
    });
    process.stdout.write(message)
}
