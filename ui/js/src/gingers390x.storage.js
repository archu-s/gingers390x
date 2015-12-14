gingers390x.initFCPLunsDetails = function(){
  gingers390x.loadFCPLunsList();

    $('#refreshLuns').on("click",function(){
       gingers390x.retrieveLunsList();
     });

  $("#enableLunsScan").on("click",function(){
      gingers390x.getLunsScanStatus(function(result){
         gingers390x.lunsScanStatusChange(result.current,function(response){
            var lunsStatusButtonText ,messageText ="";
           if(response.current){
             lunsStatusButtonText = 'Disable LUN Scan';
             messageText = 'Luns Scan is enabled successfully';
           }else{
             lunsStatusButtonText = 'Enable LUN Scan';
             messageText = 'Luns Scan disabled successfully';
           }
             gingers390x.messagecloseable.success(messageText,'#alert-modal-storage-container');
             $('#enableLunsScan').text(lunsStatusButtonText);
         },function(result){
           gingers390x.messagecloseable.error("LUNs scan enable/disable failed",'#alert-modal-storage-container');
         });
     },function(result){
         gingers390x.messagecloseable.error("LUNs scan status unavailable",'#alert-modal-storage-container');
    });
  });

  gingers390x.getLunsScanStatus(function(result){
    var lunsStatusButtonText = "";
      if(result.current){
        lunsStatusButtonText = 'Disable LUN Scan';
        $('luns-add-all-button').text("Add all / Luns Scan");
        $('luns-add-selected-button').hide();
        $('luns-add-all-button').on("click",function(){
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
      }else{
        lunsStatusButtonText = 'Enable LUN Scan';
        $('luns-add-all-button').text("Add all");
        $('luns-add-selected-button').show();
      }
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
    "width":"25%"
  },
  {
    "column-id": 'lunId',
    'display-name':'Lun Id',
    "type": 'string',
    "width":"20%"
  },
  {
    "column-id": 'product',
    'display-name':'SAN Controller',
    "type": 'string',
     "width":'15%'
  },
  {
    "column-id": 'controllerSN',
    'display-name':'SAN Controller Id/Serial No',
    "type": 'string',
     "width":'20%'
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
          id:'luns-add-selected-button',
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
          id:'luns-add-all-button',
          class: 'fa fa-plus-circle',
          label: 'Add All'
          /*,onClick: function(event) {
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
          }*/
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
