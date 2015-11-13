(function() {
   tinymce.PluginManager.add( 'EEXCESS_get_recommendations', function( editor, url ) {
      var myButton = null;
      // Add a button that opens a window
      editor.addButton( 'Get_Recommendations_Button', {
      //text: 'EEXCESS',
         title: 'Get Recommendations',
         image: url + '/../../images/EEXCESS_Icon.png',
         onclick: function(event) {
            require(['recommendationEventsHelper'], function(recommend){
               recommend.getTextAndRecommend();
            });
         },
         onPostRender: function(){
            myButton = this;
            this.disabled(true);
         }
      });
      editor.onKeyUp.add(findSelectedText);
      editor.onMouseUp.add(findSelectedText);

      // keyup and mouseup handlers for tinymce. asesses, whether ot not text is selected
      function findSelectedText(){
         if(tinyMCE.activeEditor.selection.getContent() === ""){
            myButton.disabled(true);
         } else {
            myButton.disabled(false);
         }
      }
   });
})();

