"use strict";

import Zwave from "openzwave-shared";

class ZwaveController extends Zwave {
	
	constructor(options){
		super(options);
		this.nodes = [];
		this.isReady= false;
		this.on('driver ready', function(home_id) {
		  console.log('scanning homeid=0x%s...', home_id.toString(16));
		});

		this.on('driver failed', function() {
		  console.log('failed to start driver');
		});
		
		var object = this;
		this.on('node added', function(nodeid) {
		  object.nodes[nodeid] = {
			manufacturer: '',
			manufacturerid: '',
			product: '',
			producttype: '',
			productid: '',
			type: '',
			name: '',
			loc: '',
			classes: {},
			ready: false,
		  };
		});

		this.on('node event', function(nodeid, data) {
		  console.log('node%d event: Basic set %d', nodeid, data);
		});

		this.on('value added', function(nodeid, comclass, value) {
		  if (!object.nodes[nodeid]['classes'][comclass])
			   object.nodes[nodeid]['classes'][comclass] = {};
			   object.nodes[nodeid]['classes'][comclass][value.index] = value;
		});

		this.on('value changed', function(nodeid, comclass, value) {
		  if (object.nodes[nodeid]['ready']) {
			console.log('node%d: changed: %d:%s:%s->%s', nodeid, comclass,
			  value['label'],
			  object.nodes[nodeid]['classes'][comclass][value.index]['value'],
			  value['value']);
		  }
		  object.nodes[nodeid]['classes'][comclass][value.index] = value;
		});

		this.on('value removed', function(nodeid, comclass, index) {
		  if (object.nodes[nodeid]['classes'][comclass] &&
			object.nodes[nodeid]['classes'][comclass][index])
			delete object.nodes[nodeid]['classes'][comclass][index];
		});

		this.on('node ready', function(nodeid, nodeinfo) {
		  object.nodes[nodeid]['manufacturer'] = nodeinfo.manufacturer;
		  object.nodes[nodeid]['manufacturerid'] = nodeinfo.manufacturerid;
		  object.nodes[nodeid]['product'] = nodeinfo.product;
		  object.nodes[nodeid]['producttype'] = nodeinfo.producttype;
		  object.nodes[nodeid]['productid'] = nodeinfo.productid;
		  object.nodes[nodeid]['type'] = nodeinfo.type;
		  object.nodes[nodeid]['name'] = nodeinfo.name;
		  object.nodes[nodeid]['loc'] = nodeinfo.loc;
		  object.nodes[nodeid]['ready'] = true;
		  console.log('node%d: %s, %s', nodeid,
			nodeinfo.manufacturer ? nodeinfo.manufacturer : 'id=' + nodeinfo.manufacturerid,
			nodeinfo.product ? nodeinfo.product : 'product=' + nodeinfo.productid +
			', type=' + nodeinfo.producttype);
		  console.log('node%d: name="%s", type="%s", location="%s"', nodeid,
			nodeinfo.name,
			nodeinfo.type,
			nodeinfo.loc);
		  for (var comclass in object.nodes[nodeid]['classes']) {
			switch (comclass) {
			  case 0x25: // COMMAND_CLASS_SWITCH_BINARY
			  case 0x26: // COMMAND_CLASS_SWITCH_MULTILEVEL
				object.enablePoll(nodeid, comclass);
				break;
			}
			object.nodes[nodeid]['value'] = true;
			var values = object.nodes[nodeid]['classes'][comclass];
			console.log('node%d: class %d', nodeid, comclass);
			//for (idx in values)
			  //console.log('node%d:   %s=%s', nodeid, values[idx]['label'], values[idx]['value']);
		  }
		});

		this.on('scan complete', function() {
			console.log('====> scan complete');
			object.isReady= true;
		});
	}
	
	turnOn(nodeId){
		if(this.isReady){
			if(this.nodes[nodeId]['type']=="Multilevel Power Switch")
				this.setValue(nodeId,38,1,0,99);
			else
				this.setValue(nodeId,37,1,0,true);
			
		}
	}
	
	turnOff(nodeId){
		if(this.isReady){
			if(this.nodes[nodeId]['type']=="Multilevel Power Switch")
				this.setValue(nodeId,38,1,0,0);
			else
				this.setValue(nodeId,37,1,0,false);
		}
	}
	
	getNodeValue(nodeId){
		if(this.isReady){
			if(this.nodes[nodeId]['type']=="Multilevel Power Switch")
				return this.nodes[nodeId]['classes'][38][0]['value'];
			else
				return this.nodes[nodeId]['classes'][37][0]['value']
		}
		return false;
	}
}

export default ZwaveController;