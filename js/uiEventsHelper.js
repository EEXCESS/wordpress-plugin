define(['jquery', 'settings'], function($, settings){

   var spinner = $("#eexcess_container .inside #content .eexcess-spinner"),
   recommendButton = $('#getRecommendations');
   resultList = $('#resultList');
   introText = $("#eexcess_container .inside #content p"),
   citationStyleDropDown = $('#citationStyleDropDown'),
   searchQueryReflection = $('#searchQueryReflection'),
   privacyButton = $('#privacySettings');

   function initializeUI(){
      spinner.hide();
      resultList.hide();
      citationStyleDropDown.hide();
      searchQueryReflection.hide();
   }
   initializeUI();


   return{
 
      /**
       * this function is invoked when the "get recommendations"-button or the
       * keybord shortcut is used.
       * it extracts the marked text in either the visual- oder text editor and
       * triggers the recommendation workflow.
       *
       * @param event: the event, that is associated with the "get
       *               recommendations"-button. the standard behavior will be
       *               suppressed.
       */
      queryTriggered : function(query) {
         if(query != "") {
            this.setSearchQueryReflection(query);
            searchQueryReflection.show();
            $('.error').remove();
            resultList.show("slow");
            citationStyleDropDown.show("slow");
         } else {
            this.showError(settings.errorMessages.noTextSelected, $("#citationStyleDropDown"));
            resultList.hide("slow");
            searchQueryReflection.hide("slow");
            citationStyleDropDown.hide("slow");
         }
      },
      
      /**
       * Sets the text for the "Results on:" display.
       *
       * @param text: The new text.
       */
      setSearchQueryReflection : function(text){
         var foo = $('#searchQuery');
         if(foo != null){
            foo.text(text);
         }
      },

      /**
      * Inserts a div that contains an error message after a given element.
      *
      * @param msg:     The error message to display.
      * @param element: The element after which to display the error.
      */
      showError : function(msg, element) {
         // Removing previously added error messages
         $(".error").remove();
         var div = $('<div class="error">' + msg + '</div>');
         $(element).after(div);
         div.show("slow");
      }
   };
});
