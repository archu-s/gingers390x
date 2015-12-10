gingers390x.initFCPLunsDetails = function(){
  gingers390x.loadFCPLunsList();

    $('#discoverLuns').on("click",function(){
    gingers390x.lunsDiscovery(function(result){
      alert("Luns discovery completed"+JSON.stringify(result));
    });
  });

  $("#enableLunsScan").on("click",function(){
      gingers390x.getLunsScanStatus(function(result){
       alert("Luns status"+JSON.stringify(result));
       /*if(){
             gingers390x.lunsScanStatusChange(status,function(result){
             alert("successfully completed");
           })
       }*/
    });
  });
  gingers390x.getLunsScanStatus(function(result){
    /*show buton status here */
  });
}
gingers390x.loadFCPLunsList = function(){

gingers390x.listFCPluns(function(result){
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
  for(var i=0;i<result.length;i++){
    var lunsDetails = result[i];
    lunsDetails["Srno"]=i;
    formattedResult.push(lunsDetails);
  }

  opts['headers']=JSON.stringify(headers);

	gingers390x.initHeader(opts);
	gingers390x.initBootgrid(opts);
  gingers390x.initBootgridData(opts,result);

  /*var fcpLunsGrid = $('#fcp-luns-table-grid').bootgrid().on("loaded.rs.jquery.bootgrid", function (e) {
        fcpLunsGrid.find(".expand").on("click", function(e)
          {
            $('div',$(this).closest('tbody')).closest('tr').remove();
            $('.expanded',$(this).closest('tbody')).addClass("hidden");
            $('.expand',$(this).closest('tbody')).removeClass("hidden");
            $(this).closest('tr').after('<tr class="row"><td colspan="4"><div class="pull-right">'+$(this).data("row-id")+'</div></td></tr>');
            $(this).addClass("hidden");
            $('.expanded',$(this).parent()).removeClass("hidden");
          }).end().find(".expanded").on("click", function(e)
          {
            $('div',$(this).closest('tbody')).closest('tr').remove();
            $(this).addClass("hidden");
            $('.expand',$(this).parent()).removeClass("hidden");
          });
  });*/
  gingers390x.addFCPActions();
});
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
             $.each(selectedRowDetails,function(i,row){
              var lunAddDetails = {
                'hbaId':row['hbaId'],
                'remoteWwpn':row['remoteWwpn'],
                'lunId':row['lunId']
              }
              gingers390x.addLuns(lunAddDetails);
           });
          }

      },
      {
          id:'add-all-button',
          class: 'fa fa-plus-circle',
          label: 'Add All',
          onClick: function(event) {
            var selectedRowDetails = gingers390x.getCurrentRows(opts);

            $.each(selectedRowDetails,function(i,row){
             var lunAddDetails = {
               'hbaId':row['hbaId'],
               'remoteWwpn':row['remoteWwpn'],
               'lunId':row['lunId']
             }
             gingers390x.addLuns(lunAddDetails);
          });
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

}
