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
    var d = typeCheck(data);
    //let m = data.toString().replace(/[\n\r]*$/, '');
    //var d = {msg:{info:m}};
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

/*format String*/
function parser116(s){
  var p = {
    "$$": s.slice(0,2),
    "Length": s.slice(2,6),
    "DataType":s.slice(6,8),
    "IMEI": s.slice(8,23),
    "VehicleStatus":s.slice(24,32),
    "Date/Time": dateTime(s.slice(32,44)),
    "BatteryVoltage":convertBV(s.slice(44,46)),
    "SupplyVoltage":s.slice(46,48),
    "ADC":convertADC(s.slice(48,52)),
    "TemperatureA":s.slice(52,56),
    "TemperatureB":s.slice(56,60),
    "LACCI":s.slice(60,64),
    "CellID":s.slice(64,68),
    "GPSSatellites":s.slice(68,70),
    "GSMsignal":s.slice(70,72),
    "Angle":s.slice(72,75),
    "Speed":s.slice(75,78),
    "HDOP":s.slice(78,82),
    "Mileage":s.slice(82,89),
    "Latitude":s.slice(89,98),
    "NS":s.slice(98,99),
    "Longitude":s.slice(99,109),
    "EW":s.slice(109,110),
    "SerialNumber":s.slice(110,114),
    "Checksum":s.slice(114,116)
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
