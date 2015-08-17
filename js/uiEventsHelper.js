define(['jquery', 'settings'], function($, settings){

   var spinner = $("#eexcess_container .inside #content .eexcess-spinner"),
   recommendButton = $('#getRecommendations');
   resultList = $('#resultList');
   introText = $("#eexcess_container .inside #content p"),
   abortRequestButton = $('#abortRequest'),
   CitationStyleDropDown = $('#citationStyleDropDown'),
   searchQueryReflection = $('#searchQueryReflection'),
   privacyButton = $('#privacySettings');

   function initializeUI(){
      spinner.hide();
      resultList.hide();
      abortRequestButton.hide();
      CitationStyleDropDown.hide();
      searchQueryReflection.hide();
   }
   initializeUI();


   // Triggers the abort Request button
   $(document).on("mousedown", "#abortRequest", function(event){
      this.toggleButtons();
      resultList.hide("slow");
      searchQueryReflection.hide("slow");
      spinner.hide("slow", function(){
         introText.show("slow");
      });
   });

   return{
      /**
       * Fades the "Get Recommendations"-Button out an the "abort Request"-Button in and vice versa.
       */
      toggleButtons : function(){
         if(recommendButton.is(":visible")){
            privacyButton.toggle("fast");
            recommendButton.toggle("fast", function(){
               abortButton.toggle("fast");
            });
         }else{
            privacyButton.toggle("fast");
            abortButton.toggle("fast", function(){
               recommendButton.toggle("fast");
            });
         }
      },
 
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
         // in order to display the search query to the user
         //setSearchQueryReflection(query);

         if(query != "") {
            $('.error').remove();
            resultList.show("fast");
         } else {
            this.showError(settings.errorMessages.noTextSelected, $("#citationStyleDropDown"));
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
