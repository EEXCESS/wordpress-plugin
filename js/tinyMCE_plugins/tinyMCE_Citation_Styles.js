(function() {

   tinymce.PluginManager.add( 'EEXCESS_citation_styles', function( editor, url ) {

      styles = [];
      for(i=0; i<citationStyles.length; i++){
         styles.push({text: citationStyles[i], value: citationStyles[i]});
      }

      // Add a button that opens a window
      editor.addButton( 'Citation_Styles', {
         type: 'listbox',
         text: 'Citation Styles',
         onselect: function(e) {
            console.log("some msg");  
         }, 
         values: styles,
         onPostRender: function() {
            // Select the second item by default
            if(Array.isArray(styles) && styles.length > 0){
               if(styles[0].hasOwnProperty("text")){
                  this.value(styles[0]["text"]);
               }
            }
         }
      });
   });
})();

