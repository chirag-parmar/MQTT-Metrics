import csv
import paho.mqtt.client as mqtt
import time

path = "Output.csv"


def csvlog(csvfile,fields):
    with open(csvfile, 'a') as f:
        writer = csv.writer(f, delimiter =',' , lineterminator='\n')
        writer.writerow(fields)
        time.sleep(0.750)


def on_connect(self, mosq, userdata, rc):
    self.subscribe("") #Add Channel Name


def on_message(client, userdata, msg):
    print "Topic: ", msg.topic + '\nMessage: ' + str(msg.payload)
    mqttdump = str(msg.payload)
    logData = mqttdump.split(',')
    csvlog(path, logData)


def on_disconnect(client, userdata, rc=0):
    logging.debug("DisConnected result code " + str(rc))
    client.loop_stop()

client = mqtt.Client()
username = "" #Add Username
client.username_pw_set(username, password="") #Add Password

client.on_connect = on_connect
client.on_message = on_message

client.connect("mqtt.host", 1883, 60) #Put Host,Port and timeout
client.loop_forever()


