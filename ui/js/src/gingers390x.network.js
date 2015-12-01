/*
 * Project Ginger S390x
 *
 * Copyright IBM, Corp. 2015
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
gingers390x.network = {};

gingers390x.initNetwork = function(){

	$(".modal-dialog").addClass("modal-lg");
	$(".content-area", "#network-section").css("height", "50%"); // TODO scroll, heading css
	$("#network-section").accordion({
	event:"click",
	collapsible:true,
	active:0,
	heightStyle: "content",
	});

	gingers390x.initBlacklist();
	gingers390x.initNetworkBootgrid('Enable'); // TODO i18n
};

gingers390x.initNetworkBootgrid = function(actionButtonText){

	var opts =[];
	opts['containerId']='network-content-container';
	opts['gridId']= "network-table-grid";

	var headers = [
	{
	"column-id":'name',
	'display-name':'Name',
	"type": 'string',
	"identifier":true
	},
	{
	"column-id": 'chpid',
	'display-name':'CHPID',
	"type": 'string',

	},
	{
	"column-id": 'card_type',
	'display-name':'Card Type',
	"type": 'string'
	},
	{
	"column-id": 'device_ids',
	'display-name':'Device IDs',
	"type": 'string'
	}
	];

	opts['headers']=JSON.stringify(headers);

	gingers390x.initHeader(opts);
	gingers390x.initBootgrid(opts);

	gingers390x.initNetworkBootGridData(opts);

	var actionButtonHtml = '<div class="col-sm-1 grid-control">'+
	'<button class="row btn btn-primary" type="submit" id="network-enable-btn" aria-expanded="false">'+actionButtonText+'</button>'+
	'</div>';
	var selectedRowIds = [];
	gingers390x.addBootgridActionButton(opts, actionButtonHtml, selectedRowIds);
	 $('#network-enable-btn').on('click', function(event){
   	 gingers390x.enableNetworkCallback(selectedRowIds);
     event.preventDefault();
   });

};

gingers390x.initNetworkBootGridData = function(opts){

		var result=[];

		gingers390x.listNetworks(function(result){

		result1=[
	  	 {
	  	    "name":"0.0.1888",
	  	    "driver":"qeth",
	  	    "card_type":"OSA (QDIO)",
	  	    "chpid":"e7",
	  	    "state":"Unconfigured",
	  	    "device_ids":[
	  	      "0.0.1886",
	  	      "0.0.1887",
	  	      "0.0.1888"
	  	    ],
	  	    "type":"1731/01"
	  	  }]

		function stringifyNestedObject(key, value) {
			if (key === "device_ids" && typeof value === "object") {
				value = value.join(',');
			}
		return value;
	  }

		stringify_result=JSON.stringify(result, stringifyNestedObject);
    gingers390x.initBootgridData(opts, stringify_result)
		});

	};

gingers390x.enableNetworkCallback = function(selectedRowIds){
		alert(selectedRowIds[0])
		var taskAccepted = false;
			var onTaskAccepted = function() {
					if(taskAccepted) {
							return;
					}
					taskAccepted = true;
					wok.topic('gingerbase/debugReportAdded').publish();
		 };
		 gingers390x.configureNetwork(selectedRowIds[0], true, function(result) {
					onTaskAccepted();
					var successText = result['message'];
					gingers390x.messagecloseable.success(successText,'#alert-modal-nw-container');
					wok.topic('gingerbase/debugReportAdded').publish();
			 }, function(result) {
					if (result['message']) { // Error message from Async Task status TODO
							var errText = result['message'];
					}
					else { // Error message from standard gingers390x exception TODO
							var errText = result['responseJSON']['reason'];
					}
					result && gingers390x.messagecloseable.error(errText,'#alert-modal-nw-container');
					taskAccepted;
			}, onTaskAccepted);
	};
