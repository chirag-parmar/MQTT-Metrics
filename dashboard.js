var mqtt = require('mqtt')
var fs = require('fs')
const express        = require('express');
const bodyParser     = require('body-parser');
const app            = express();
const os             = require('os');

var port = process.env.PORT || 8000;
var request = require('request')

function cpuAverage() {
  var totalIdle = 0, totalTick = 0;
  var cpus = os.cpus();
  for(var i = 0, len = cpus.length; i < len; i++) {
    var cpu = cpus[i];
    for(type in cpu.times) {
      totalTick += cpu.times[type];
   }
    totalIdle += cpu.times.idle;
  }
  return {idle: totalIdle / cpus.length,  total: totalTick / cpus.length};
}

var startMeasure = cpuAverage();

app.use(bodyParser.urlencoded({ extended: true }));

app.post('/', function(req,res) {
  console.log(req.body)

  var endMeasure = cpuAverage();

  var idleDifference = endMeasure.idle - startMeasure.idle;
  var totalDifference = endMeasure.total - startMeasure.total;
  var percentageCPU = 100 - ~~(100 * idleDifference / totalDifference)

  startMeasure = cpuAverage();

  metricData['CPU'] = percentageCPU;
  metricData['totalMem'] = os.totalmem();
  metricData['freeMem'] = os.freemem();
  res.send(JSON.stringify(metricData))
})

app.listen(port, () => {
  console.log('We are live on ' + port);
});


var client = mqtt.connect('mqtt://127.0.0.1:1883')

var metricTopics = ["$SYS/broker/uptime","$SYS/broker/load/bytes/sent/1min","$SYS/broker/load/bytes/received/1min",
"$SYS/broker/clients/connected","$SYS/broker/load/messages/received/1min",
"$SYS/broker/load/messages/sent/1min","#"]
// DATABASE MANAGEMENT
var metricData = {}
metricData['bytesSent'] = ""
metricData['bytesReceived'] = ""
metricData['messagesSent'] = ""
metricData['messagesReceived'] = ""
metricData['lastMessage'] = []
metricData['upTime'] = ""
metricData['clientsConnected'] = ""
metricData['CPU'] = 0
metricData['totalMem'] = 0
metricData['freeMem'] = 0

//DATABASE MANAGEMENT

client.on('connect', mqtt_connect);
client.on('reconnect', mqtt_reconnect);
client.on('error', mqtt_error);
client.on('message', mqtt_messsageReceived);
client.on('close', mqtt_close);

function mqtt_connect() {
    console.log("Connecting MQTT");
    for (var i =0; i< metricTopics.length; i++){
      client.subscribe(metricTopics[i], mqtt_subscribe);
    }
};

function mqtt_subscribe(err, granted) {
    console.log("Subscribed");
    if (err) {console.log(err);}
};

function mqtt_reconnect(err) {
    console.log("Reconnect MQTT");
    if (err) {console.log(err);}
	client = mqtt.connect('127.0.0.1:1883');
};

function mqtt_error(err) {
    console.log("Error!");
	if (err) {console.log(err);}
};

function after_publish() {
	//do nothing
};


function mqtt_messsageReceived(topic, message, packet) {
	var message_str = message.toString();
	message_str = message_str.replace(/\n$/, '');
  switch(topic) {
    case "$SYS/broker/uptime":
      metricData['upTime'] = message_str
      break;
    case "$SYS/broker/load/bytes/sent/1min":
      metricData['bytesSent'] = message_str
      break;
    case "$SYS/broker/load/bytes/received/1min":
      metricData['bytesReceived'] = message_str
      break;
    case "$SYS/broker/clients/connected":
      metricData['clientsConnected'] = message_str
      break;
    case "$SYS/broker/load/messages/received/1min":
      metricData['messagesReceived'] = message_str
      break;
    case "$SYS/broker/load/messages/sent/1min":
      metricData['messagesSent'] = message_str
      break;
    default:
      metricData['lastMessage'] = topic + " | " + message_str + " | " + Date().toISOString();
  }
};

function mqtt_close() {
	//console.log("Close MQTT");
};
