(function() {
    tinymce.PluginManager.add( 'EEXCESS_vis_dashboard', function( editor, url ) {

        // Add a button that opens a window
        editor.addButton( 'Vis_Dashboard', {
            //text: 'EEXCESS',
            title: 'Visualization Dashboard',
            image: url + '/../../images/visualization.png',
            onclick: function(event) {
               var url = window.location.origin + window.location.pathname + "#TB_inline?width=600&height=550&inlineId=visualizationThickbox";
               tb_show("Visualization", url);
               require(["eexcessMethods", "APIconnector"], function(eexcessMethods, api){
                  // log event
                  if(eexcessMethods.loggingEnabled()){
                     api.sendLog("itemOpened", eexcessMethods.getItemOpenedLogEvent("Visalization Dashboard"));
                  }
               });
            }
        });
    });
})();

