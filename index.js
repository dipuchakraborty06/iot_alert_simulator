"use strict";

const aws_iot_sdk = require('aws-iot-device-sdk');
const express = require('express');
const body_parser = require('body-parser');
const application_package = require(__dirname+'/package.json');
	
const application = express();
application.use(body_parser.urlencoded({ extended: false}));
application.use(body_parser.json());

application.get('/get-info',(request,response)=>{
	var _response = {
			"application": application_package.name,
			"description": application_package.description,
			"version": application_package.version
	};
	response.setHeader('Content-Type','application/json');
	response.statusCode = 200;
	response.send(_response);
});

application.post('/post-alert',(request,response)=>{
	var _response;	
	var alert = request.body.alert;
	if(alert.device.name !== "")
	{
		var topic_name = "topics/"+alert.device.name;
		var device = aws_iot_sdk.device({
			keyPath: __dirname+'/'+alert.device.name+'/'+alert.device.name+'-private.pem.key',
			certPath: __dirname+'/'+alert.device.name+'/'+alert.device.name+'-certificate.pem.crt',
			caPath: __dirname+'/AmazonRootCA1.pem',
			clientId: alert.device.name+"-"+Math.random(),
			host: request.body.host,
			region: 'ap-southeast-1'
		});
		
		device.on('connect',()=>{
			console.log("Conncted to AWS IoT device - "+alert.device.name+", Topic name - "+topic_name);
			device.subscribe(topic_name);
			device.publish(topic_name,JSON.stringify(alert));
		})
		.on('message', (topic,payload)=>{
			console.log("Alert send to AWS IoT core platfrom success !!!");
			console.log("Alert published to topic - "+topic+", message - "+payload);
		})
		.on('error', (error)=>{
			console.log("Error sending alert message to topic, exception reported - "+error);
		});
		
		_response = {
				message: "AWS IoT device accepted alert message!!!"
		};
		response.statusCode = 200;
	}
	else
	{
		console.log("Invalid request - no device information is specified");
		_response = {
				message: "AWS IoT device rejected alert message!!!"
		};
		response.statusCode = 501;
	}
	response.setHeader("Content-Type","application/json");
	response.send(_response);
	
});

var server = application.listen(3000, () => {
	var host = server.address().address;
	var port = server.address().port;
	console.log(application_package.name+" application listening at http://%s:%s", host, port);
});