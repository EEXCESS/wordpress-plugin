define(['jquery', 'settings'], function($, settings){

   var resultList = $('#resultList'),
   privacyButton = $('#privacySettings');

   $('div[aria-label="Visualization Dashboard"]').hide();
   resultList.hide();

   // event handler keeping track of the profile form, storing
   // changed values into local 
   
   function profileFormHandler(o){
      var formElement  = $(o.originalEvent.path[0]),
      elementName = formElement.attr("data-eexcess-profile-field"),
      elementValue = formElement.val();
      if(elementName == undefined){
         return null;
      } else {
         if(elementName === "logging"){
            elementValue = formElement.is(":checked");
         }
         localStorage.setItem("eexcess." + elementName, elementValue);
      }
   }
   $("#privacyPanel").change(profileFormHandler);

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
            resultList.show("slow");
         }
      }
   };
});
