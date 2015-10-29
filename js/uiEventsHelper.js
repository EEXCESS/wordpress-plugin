define(['jquery', 'settings'], function($, settings){

   var resultList = $('#resultList'),
   privacyButton = $('#privacySettings');

   $('div[aria-label="Visualization Dashboard"]').hide();
   resultList.hide();

   // event handler keeping track of the profile form, storing
   // changed values into local 
   
   function profileFormHandler(o){
      var formElement  = $(o.currentTarget),
      elementName = formElement.attr("data-eexcess-profile-field");
      console.log("aal");
   }

   $("select[data-eexcess-profile-field='title']").change(profileFormHandler);
   $("input[data-eexcess-profile-field='firstname']").change(profileFormHandler);
   $("input[data-eexcess-profile-field='lastname']").change(profileFormHandler);
   $("input[data-eexcess-profile-field='address.line1']").change(profileFormHandler);
   $("input[data-eexcess-profile-field='address.line2']").change(profileFormHandler);
   $("input[data-eexcess-profile-field='address.zipcode']").change(profileFormHandler);
   $("input[data-eexcess-profile-field='address.city']").change(profileFormHandler);
   $("input[data-eexcess-profile-field='address.country']").change(profileFormHandler);
   $("select[data-eexcess-profile-field='gender']").change(profileFormHandler);
   $("input[data-eexcess-profile-field='birthdate']").change(profileFormHandler);
   $("input[data-eexcess-profile-field='logging']").change(profileFormHandler);




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
