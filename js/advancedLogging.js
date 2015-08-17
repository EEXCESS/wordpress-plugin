require(['jquery'], function($){
   /*
    * Implements the advanced logging
    */
   $(document).on("mousedown", ".recommendationTextArea a", function(){
      if(eexcessMethods.extendedLoggingEnabled()){
         try{
            sendUsersActivitiesSignal("detail_view", this);
         }catch(e){
            console.log("Logging failed. Message was: " + e.message);
         }
      }
   });
});
