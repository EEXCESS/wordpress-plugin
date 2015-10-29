require(['jquery'], function($){
   /*
    * Implements the advanced logging
    */
   $(document).on("mousedown", ".recommendationTextArea a", function(){
      if(eexcessMethods.loggingEnabled()){
         try{
            sendUsersActivitiesSignal("detail_view", this);
         }catch(e){
            console.log("Logging failed. Message was: " + e.message);
         }
      }
   });
});
