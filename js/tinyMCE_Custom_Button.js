(function() {
    tinymce.PluginManager.add( 'fb_test', function( editor, url ) {

        // Add a button that opens a window
        editor.addButton( 'Get_Recommendations_Button', {
            //text: 'EEXCESS',
            title: 'Get Recommendations',
            image: url + '/../images/EEXCESS_Icon.png',
            onclick: function(event) {
               eexcessMethods.getSelectedTextAndRecommend(event);
            }

        } );

    } );

})();
