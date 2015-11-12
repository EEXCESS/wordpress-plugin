define(['jquery', 'settings'], function($, settings){

   var resultList = $('#resultList'),
   privacyButton = $('#privacySettings');

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

   function loadProfileHandler(e){
      $("[data-eexcess-profile-field='address.city']").val(localStorage.getItem("eexcess.address.city") || "");
      $("[data-eexcess-profile-field='address.country']").val(localStorage.getItem("eexcess.address.country") || "");	
      $("[data-eexcess-profile-field='gender']").val(localStorage.getItem("eexcess.gender") || "");	
      $("[data-eexcess-profile-field='logging']").prop("checked", $.parseJSON(localStorage.getItem("eexcess.logging") || "true"));
     
      var age = localStorage.getItem("eexcess.age") || "2";
      $("[data-eexcess-profile-field='age']").find(".active").removeClass("active");
      $("[data-eexcess-profile-field='age']").find("[value='" + age + "']").parent().addClass("active"); 
   }

   function ageButtonHandler(e){
      var val = $(e.originalEvent.path[0]).find("input").val();
      localStorage.setItem("eexcess.age", val);
   }

   $("#privacyPanel").change(profileFormHandler);
   $("#privacySettingsBtn").click(loadProfileHandler);

   // unfortunatly the age buttons need a seperate treatment
   $("[data-eexcess-profile-field='age']").click(ageButtonHandler);

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
