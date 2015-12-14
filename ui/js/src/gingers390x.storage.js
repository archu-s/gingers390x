gingers390x.initFCPLunsDetails = function(){
  gingers390x.loadFCPLunsList();

    $('#discoverLuns').on("click",function(){
      wok.message.warn("Searching Luns ",'#alert-modal-storage-container');

   		var taskAccepted = false;
   			var onTaskAccepted = function() {
   					if(taskAccepted) {
   							return;
   					}
   					taskAccepted = true;
   					//wok.topic('gingers390x/enableNetworks').publish();
   		 };
      gingers390x.lunsDiscovery(function(result){
          onTaskAccepted();
          gingers390x.retrieveLunsList();  //Reload The list
          var successText = result['message'];
          gingers390x.messagecloseable.success(successText,'#alert-modal-storage-container');
        //  wok.topic('gingers390x/enableNetworks').publish();
      },function(result){
          gingers390x.retrieveLunsList();;  //Reload the list
          if (result['message']) { // Error message from Async Task status TODO
              var errText = result['message'];
          }
          else { // Error message from standard gingers390x exception TODO
              var errText = result['responseJSON']['reason'];
          }
          result && gingers390x.messagecloseable.error(errText,'#alert-modal-storage-container');
          taskAccepted;
       },onTaskAccepted);
  });

  $("#enableLunsScan").on("click",function(){
      gingers390x.getLunsScanStatus(function(result){
        alert(result.current);
         gingers390x.lunsScanStatusChange(result.current,function(response){
           alert(JSON.stringify(response));
           var lunsStatusButtonText = (response.current)?'Disable LUN Scan':'Enable LUN Scan';
             $('#enableLunsScan').text(lunsStatusButtonText);
         });
    });
  });

  gingers390x.getLunsScanStatus(function(result){
    var lunsStatusButtonText = (result.current)?'Disable LUN Scan':'Enable LUN Scan';
      $('#enableLunsScan').text(lunsStatusButtonText);

  });
}
gingers390x.loadFCPLunsList = function(){
  gingers390x.addFCPActions();
  var opts =[];
  opts['containerId']='fcp-luns-list-container';
  opts['gridId']= "fcp-luns-table-grid";
  var formattedResult = [];
  var headers = [
  {
    "column-id":'hbaId',
    'display-name':'Host Adapter',
    "type": 'string',
    "width":"15%"
  },
  {
    "column-id":'remoteWwpn',
    'display-name':'Remote Wwpn',
    "type": 'string',
    "width":"30%"
  },
  {
    "column-id": 'controllerSN',
    'display-name':'SAN Controller Id/Serial No',
    "type": 'string',
     "width":'30%'
  },
    {
    "column-id": 'lunId',
    'display-name':'Lun Id',
    "type": 'string',
    "width":"20%"
  },
  {
    "column-id":'Srno',
    'display-name':'id',
    "type": 'numeric',
    "identifier":true,
    "invisible":true
  }
  ];

  opts['headers']=JSON.stringify(headers);

  gingers390x.initHeader(opts);
  gingers390x.initBootgrid(opts);

  gingers390x.retrieveLunsList();

};
gingers390x.addFCPActions=function(){
  var opts={};
  opts['gridId'] = 'fcp-luns-table-grid';

  var actionButton = [{
          id:'add-selected-button',
          class: 'fa fa-plus-circle',
          label: 'Add Selected',
          onClick: function(event) {
             var selectedRows = gingers390x.getSelectedRows(opts);
             var currentRows = gingers390x.getCurrentRows(opts);
             var identifier = 'Srno';

             var selectedRowDetails = gingers390x.getSelectedRowsData(currentRows,selectedRows,identifier);
             var rowIndex = 0;
            var failedlLuns = [];
            var successLuns = [];
            var isConfigured = null;
            var lunsDetails= '';
             $.each(selectedRowDetails,function(i,row){
              var lunAddDetails = {
                'hbaId':row['hbaId'],
                'remoteWwpn':row['remoteWwpn'],
                'lunId':row['lunId']
              }
               gingers390x.addLuns(lunAddDetails,function(result){
                 isConfigured = result.configured;
                 lunsDetails = result.hbaId+"|"+result.remoteWwpn;
                 if(isConfigured){
                    successLuns.push(lunsDetails);
                 }else{
                   failedlLuns.push(lunsDetails);
                 }
               },function(result){
                 isConfigured = false;
                 failedlLuns.push(result['message']);
               });
            });
            if(selectedRowDetails.length==successLuns.length){
               gingers390x.messagecloseable.success("Luns sucessfully added",'#alert-modal-storage-container');
            }else{
               gingers390x.messagecloseable.error("Error occured while adding Luns",'#alert-modal-storage-container');
            }
               gingers390x.retrieveLunsList();
          }

      },
      {
          id:'add-all-button',
          class: 'fa fa-plus-circle',
          label: 'Add All',
          onClick: function(event) {
            var selectedRowDetails = gingers390x.getCurrentRows(opts);
            var rowIndex = 0;
             var failedlLuns = [];
             var successLuns = [];
             var isConfigured = null;
             var lunsDetails= '';

            $.each(selectedRowDetails,function(i,row){
             var lunAddDetails = {
               'hbaId':row['hbaId'],
               'remoteWwpn':row['remoteWwpn'],
               'lunId':row['lunId']
             }
             gingers390x.addLuns(lunAddDetails,function(result){
               isConfigured = result.configured;
               lunsDetails = result.hbaId+"|"+result.remoteWwpn;
               if(isConfigured){
                  successLuns.push(lunsDetails);
               }else{
                 failedlLuns.push(lunsDetails);
               }
             },function(result){
               isConfigured = false;
               failedlLuns.push(result['message']);
             });
          });

          if(selectedRowDetails.length==successLuns.length){
             gingers390x.messagecloseable.success("Luns sucessfully added",'#alert-modal-storage-container');
          }else{
             gingers390x.messagecloseable.error("Error occured while adding Luns",'#alert-modal-storage-container');
          }
             gingers390x.retrieveLunsList();
          }
      }];

      var actionListSettings = {
        panelID:'fcp-storage-actions',
        buttons : actionButton,
        type :'action'
      };

      ginger.createActionList(actionListSettings);
};

gingers390x.enableDisableLuns =  function(){

};
gingers390x.retrieveLunsList = function(){
    gingers390x.listFCPluns(function(result){
      var opts =[];
      opts['containerId']='fcp-luns-list-container';
      opts['gridId']= "fcp-luns-table-grid";
      var formattedResult = [];

      for(var i=0;i<result.length;i++){
        var lunsDetails = result[i];
        lunsDetails["Srno"]=i;
        formattedResult.push(lunsDetails);
      }
      gingers390x.initBootgridData(opts,formattedResult);
  });
};
