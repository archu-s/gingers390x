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
 	"identifier":true,
	"width":"25%"
 	},
 	{
 	"column-id": 'chpid',
 	'display-name':'CHPID',
 	"type": 'string',
	"width":"25%"
 	},
 	{
 	"column-id": 'card_type',
 	'display-name':'Card Type',
 	"type": 'string',
	"width":"25%"
 	},
 	{
 	"column-id": 'device_ids',
 	'display-name':'Device IDs',
 	"type": 'string',
	"width":"25%"
 	}
 	];

 	opts['headers']=JSON.stringify(headers);

 	gingers390x.initHeader(opts);
 	gingers390x.initBootgrid(opts);

 	var actionButtonHtml = '<div class="col-sm-1 grid-control">'+
 	'<button class="row btn btn-primary" type="submit" id="network-enable-btn" aria-expanded="false" disabled="true">'+actionButtonText+'</button>'+
 	'</div>';
 	// var selectedRowIds = [];
 	gingers390x.addBootgridActionButton(opts, actionButtonHtml);
 	 $('#network-enable-btn').on('click', function(event){
      gingers390x.disableActionButton();
    	 gingers390x.enableNetworks(opts);
      event.preventDefault();
    });

 	 gingers390x.initNetworkBootGridData(opts);

 };

 gingers390x.initNetworkBootGridData = function(opts){

 		var result=[];
 		gingers390x.disableActionButton();
 		gingers390x.clearBootgridData(opts);
 		// $('.loading').show();

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
 		stringify_result=JSON.parse(stringify_result);

     gingers390x.initBootgridData(opts, stringify_result);

 		if(stringify_result && stringify_result.length > 0){
 	  	gingers390x.enableActionButton();
 		}else{
 			$('.no-data-found').show();
 		}

 		});

 	};

 gingers390x.enableNetworks = function(opts){
 	var selectedRowIds = gingers390x.getSelectedRows(opts);
 		wok.message.warn("Enabling "+selectedRowIds+"..On Completion success/failure message will be shown.",'#alert-modal-nw-container');

 		var taskAccepted = false;
 			var onTaskAccepted = function() {
 					if(taskAccepted) {
 							return;
 					}
 					taskAccepted = true;
 					wok.topic('gingers390x/enableNetworks').publish();
 		 };

 		 for(var i=0;i<selectedRowIds.length;i++){
 			 gingers390x.configureNetwork(selectedRowIds[i], true, function(result) {
 						onTaskAccepted();
                        var loadingHtml = ['<tbody><tr><td></td></tr></tbody><tbody><tr><td class="loading" colspan="5">Loading.....</td></tr></tbody>'].join('');  //TODO i18n
                        $(loadingHtml).appendTo($('#'+opts["gridId"])); 	
					gingers390x.initNetworkBootGridData(opts);  //Reload The list
 						var successText = result['message'];
 						gingers390x.messagecloseable.success(successText,'#alert-modal-nw-container');
 						wok.topic('gingers390x/enableNetworks').publish();
 				 }, function(result) {
 					 gingers390x.initNetworkBootGridData(opts);  //Reload the list
 						if (result['message']) { // Error message from Async Task status TODO
 								var errText = result['message'];
 						}
 						else { // Error message from standard gingers390x exception TODO
 								var errText = result['responseJSON']['reason'];
 						}
 						result && gingers390x.messagecloseable.error(errText,'#alert-modal-nw-container');
 						taskAccepted;
 				}, onTaskAccepted);
 		 }


 	};

 	gingers390x.enableActionButton = function(){
 		$('#network-enable-btn').prop("disabled", false);
 	};

 	gingers390x.disableActionButton = function(){
 		$('#network-enable-btn').prop("disabled", true);
 	};
