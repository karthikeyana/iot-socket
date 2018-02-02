'use strict';

const net = require('net');
const PORT = 3030;
const ADDRESS = '127.0.0.1';

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
    console.log(`${clientName} said: ${m}`);
    socket.write(`We got your message (${m}). Thanks!\n`);
  });

  socket.on('end', () => {
    console.log(`${clientName} disconnected.`);
  });

}
