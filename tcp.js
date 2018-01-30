'use strict';

const net = require('net');
const MongoClient= require('mongodb').MongoClient;
const PORT = 5000;
const ADDRESS = '127.0.0.1';
const url = 'mongodb://localhost:27017/gprs';

let server = net.createServer(onClientConnected);
server.listen(PORT, ADDRESS);

function onClientConnected(socket) {
  console.log(`New client: ${socket.remoteAddress}:${socket.remotePort}`);
  socket.destroy();
}

console.log(`Server started at: ${ADDRESS}:${PORT}`);

function onClientConnected(socket) {

  let clientName = `${socket.remoteAddress}:${socket.remotePort}`;
  console.log(`${clientName} connected.`);
  socket.on('data', (data) => {
    let m = data.toString().replace(/[\n\r]*$/, '');
	  var d = {msg:{info:m}};
	  insertData(d);
    console.log(`${clientName} said: ${m}`);
    socket.write(`We got your message (${m}). Thanks!\n`);
  });

  socket.on('end', () => {
    console.log(`${clientName} disconnected.`);
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

