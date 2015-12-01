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
gingers390x.initHeader = function(opts){

	var containerId = opts['containerId'];
	var gridId = opts['gridId'];
	var fields = JSON.parse(opts['headers']);

	var gridHtml = [
	'<table id="',gridId,'" class="table table-condensed table-hover table-striped" >',
	'<thead>',
	'<tr>',
	'</tr>',
	'</thead>'
	].join('');
	$(gridHtml).appendTo('#'+containerId);
	var gridHeader = $('tr',gridHtml);
	for(var i=0;i<fields.length;i++){
	var columnHtml = [
	'<th data-type="',fields[i]["type"],'" data-column-id="',fields[i]["column-id"],'"',
	(fields[i].identifier)?'data-identifier="true"':'','>',
	fields[i]["display-name"],
	'</th>'
	].join('');

	$(columnHtml).appendTo($('#'+gridId).find('tr'));
	}
	$('#'+opts['gridId']).append('<div class="loading" colspan="8">Loading...</div>');
};

gingers390x.initBootgrid= function(opts){

	var gridId = opts['gridId'];

	$('#'+gridId).bootgrid({
    	selection: true,
    	multiSelect: true,
    	rowCount:-1,
    	sorting:true,
    	columnSelection:false,
    	rowSelect:true,
    	labels: {
    		search: "Filter",
    		noResults:"No offlined network device found."  // TODO common message
    	},
    	css: {   // TODO css
            actions: "actions btn-group",//??
            table: "",//???
            selectBox: "fa fa-check-circle"///???

      }
	}).on("load.rs.jquery.bootgrid", function (e) {
        	$('.input-group .glyphicon-search').removeClass('.glyphicon-search').addClass('fa fa-search');
  });

};

gingers390x.initBootgridData = function(opts, data){
  $('#'+opts['gridId']).bootgrid("append",JSON.parse(data));
  $('.loading').hide();
};

gingers390x.addBootgridActionButton = function(opts, actionButtonHtml, selectedRowIds){
	// var selectedRowIds = [];
	$('#'+opts['gridId']).bootgrid().on("selected.rs.jquery.bootgrid", function (e, rows) {
    	for (var i = 0; i < rows.length; i++) {
    	selectedRowIds.push(rows[i].name);
    	}
    	}).on("deselected.rs.jquery.bootgrid", function (e, rows) {
    	for (var i = 0; i < rows.length; i++) {
    	selectedRowIds.pop(rows[i].name);  // TODO
    	}
    	});

   $(actionButtonHtml).appendTo('#'+opts['gridId']+'-header .row .actionBar');
  //  $('#network-enable-btn').on('click', function(event){
  //  	 actionBootgridCallback(selectedRowIds);
  //    event.preventDefault();
  //  });
	// actionBootgridCallback(event, selectedRowIds);
};
