(function(require, define){
   tinymce.PluginManager.add( 'EEXCESS_citation_styles', function( editor, url ) {

      styles = [];
      for(i=0; i<citationStyles.length; i++){
         styles.push({text: citationStyles[i], value: citationStyles[i]});
      }

      // Add a button that opens a window
      editor.addButton( 'Citation_Styles', {
         type: 'listbox',
         text: 'Citation Styles',
         title: 'Citation Styles',
         icon: false,
         onselect: function(e) {
            var style = this.value();
            require(["citationBuilder"], function(citationBuilder){
               citationBuilder.setStyle(style);
            });
         }, 
         values: styles,
         onPostRender: function() {
            var style = "";
            thisButton = this;
            require(["citationBuilder"], function(citationBuilder){
               var style = citationBuilder.getStyle();
               thisButton.value(style);
            });
         }
      });
   });
}(EEXCESS.require, EEXCESS.define));

