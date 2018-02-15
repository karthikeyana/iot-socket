'use strict';

const net = require('net');
const MongoClient= require('mongodb').MongoClient;
const PORT = 3030;
const ADDRESS = '0.0.0.0';
const url = 'mongodb://localhost:27017/iot_server_app';
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
    var m = data.toString().replace(/[\n\r]*$/, '');
    var l = typeCheck(m);
    if(typeof l === 'object' && typeof l !== 'string'){
      socket.data = { msg: l };
      insertData(socket);
    } else {
      console.log(`${socket.name} : ${l} "check the data"`);
      broadcast(socket.name + "> " + l + " check the data", socket);
      socket.write(`${l}. check the data!\n`);
    }

  });

  socket.on('end', () => {
    clients.splice(clients.indexOf(socket), 1);
    console.log(`${socket.name} disconnected.`);
  });

}

/*format String*/
function parser116(s){
  var p = {
    "header": s.slice(0,2),
    "length": s.slice(2,6),
    "alaramCode":s.slice(6,8),
    "deviceId": s.slice(8,23),
    "vehicleStatus":s.slice(24,32),
    "dateTime": dateTime(s.slice(32,44)),
    "batteryVoltage":convertBV(s.slice(44,46)),
    "supplyVoltage":convertSV(s.slice(46,48)),
    "ADC":convertADC(s.slice(48,52)),
    "temperatureA":s.slice(52,56),
    "temperatureB":s.slice(56,60),
    "LACCI":s.slice(60,64),
    "cellID":s.slice(64,68),
    "GPSSatellites":s.slice(68,70),
    "GSMsignal":s.slice(70,72),
    "angle":s.slice(72,75),
    "speed":s.slice(75,78),
    "HDOP":s.slice(78,82),
    "mileage":s.slice(82,89),
    "latitude":s.slice(89,98),
    "NS":s.slice(98,99),
    "longitude":s.slice(99,109),
    "EW":s.slice(109,110),
    "serialNumber":s.slice(110,114),
    "checksum":s.slice(114,116)
  }
  return p;
}

function dateTime(d){
  return "20" + d.slice(0,2) + "-" + d.slice(2,4) + "-" + d.slice(4,6) + "T" + d.slice(6,8) + ":" + d.slice(8,10) + ":" + d.slice(10,12)
}

function convertBV(s){
  return s[0]+"."+s[1]+"V"
}

function convertSV(s){
  return s+"V"
}

function convertADC(s){
  return s[0]+s[1]+"."+s[2]+s[3]+"V";
}

function typeCheck(str){
  if(str.length === 116){
    return parser116(str)
  } else {
    return 'data not match'
  }
}
/**************/

function insertData(socket){
  MongoClient.connect(url, function(err, db){
    var find = {deviceId:socket.data.msg.deviceId}
    console.log(find,'find');
    db.collection('deviceTracker').findOne(find, (err,result)=>{
      if(!result){
        var insert = {deviceId: socket.data.msg.deviceId, history: [socket.data.msg]};
        db.collection('deviceTracker').insert(insert, (err,result)=>{
    			if(err){
            console.log(`${socket.name} error message is : ${err}`);
            broadcast(socket.name + "> " + err, socket);
            socket.write(`error message is (${err}). Thanks!\n`);
    			}else {
            console.log(`${socket.name} said: ${JSON.stringify(result.ops[0])}`);
            broadcast(socket.name + "> " + JSON.stringify(result.ops[0]), socket);
            socket.write(`We got message (${JSON.stringify(result.ops[0])}). Thanks!\n`);
    			}
    		});
      } else {
        var update = {select: {deviceId: socket.data.msg.deviceId}, data:{$push:{history: socket.data.msg}}};
        db.collection('deviceTracker').findOneAndUpdate(update.select, update.data, (err,result)=>{
    			if(err){
            console.log(`${socket.name} error message is : ${err}`);
            broadcast(socket.name + "> " + err, socket);
            socket.write(`error message is (${err}). Thanks!\n`);
    			}else {
            var res = JSON.stringify(result.value.history[result.value.history.length-1]);
            console.log(`${socket.name} said: ${res}`);
            broadcast(socket.name + "> " + res, socket);
            socket.write(`We got message (${res}). Thanks!\n`);
    			}
    		});
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
