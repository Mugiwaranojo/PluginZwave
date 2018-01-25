"use strict";

import Plugin from "../../models/Plugin.js";
import ZwaveController from "./ZwaveController.js";

class ZwavePlugin extends Plugin {
	
	constructor(path){
		super(path);
		this.controller = new ZwaveController({ConsoleOutput: false});
		this.controller.connect('/dev/ttyUSB0');
	}
	
	getView(){
		this.view.list = this.config.devices;
		for(var i in this.view.list){
			this.view.list[i]["itemId"]= this.view.list[i].node;
			this.view.list[i]["activated"]= this.controller.getNodeValue(this.view.list[i].node);
			this.view.list[i]["event"]= "clientDeviceSwitchEvent";
			this.view.list[i]["eventSubscribe"]= "serverDevice"+this.view.list[i].node+"SwitchEvent";
		}
		return this.view;
	}
	
	setService(service){
		this.service= service;
		var obj=this;
		this.service.pluginsEvents.on("serverSensorpresenceValues", function(data){
			//console.log("---> serverSensorpresenceValues");
			//console.log(data);
		});
		this.service.pluginsEvents.on("serverSensortemperatureValues", function(data){
			if(data.temperature < 19 &&  !obj.controller.getNodeValue(4)){
				console.log(data);
				obj.doRequest("deviceOn", {"deviceName": "chauffage"});
			}else if(data.temperature > 19 &&  obj.controller.getNodeValue(4)){
				console.log(data);
				obj.doRequest("deviceOff", {"deviceName": "chauffage"});
			}
		});
		this.service.pluginsEvents.on("serverSensorphotoresistanceValues", function(data){
			//console.log("---> serverSensorphotoresistanceValues");
			//console.log(data);
		});
		this.service.pluginsEvents.on("clientDeviceSwitchEvent", function(data){
			console.log("clientDeviceSwitchEvent");
			console.log(data);
			switch(data.id){
				case "On":
					obj.controller.turnOn(data.node);
					break;
				case "Off":
					obj.controller.turnOff(data.node);
					break;
			}
		});
	}
	
	suscribeEvent(socketClient){
		const obj= this;
		socketClient.on("clientDeviceSwitchEvent", function(data){
			console.log("clientDeviceSwitchEvent");
			console.log(data);
			switch(data.id){
				case "On":
					obj.controller.turnOn(data.node);
					break;
				case "Off":
					obj.controller.turnOff(data.node);
					break;
			}
		});
	}
	
	doRequest(id, data) {
		console.log("request : "+id);
		console.log("device : "+data.deviceName);
		var device = this.searchDeviceByName(data.deviceName);
		if(!device){
			return null;
		}else{
			switch(id){
				case "deviceOn":
					this.service.emitEvent("serverDevice"+device.node+"SwitchEvent", true);
					this.controller.turnOn(device.node);
					return "Ok";
				case "deviceOff":
					this.service.emitEvent("serverDevice"+device.node+"SwitchEvent", false);
					this.controller.turnOff(device.node);
					return "Ok";
			}
			return null;
		}
	}
	
	searchDeviceByName(name){
		for(var i in this.config.devices){
			if(this.config.devices[i].name===name){
				return this.config.devices[i];
			}
		}
		return null;
	}
	
}

export default new ZwavePlugin(__dirname);