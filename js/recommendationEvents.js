require(['jquery', 'recommendationEventsHelper', 'iframes'], function($, helper, iframes){
   
   // Triggers the recommendations call by button
   $(document).on("mousedown", "#getRecommendations", function(event){
      helper.getTextAndRecommend();
   });

   // Triggers the recommendations call by keyboard (through ctrl+e)
   $(document).on("keydown", "#content", function(e){
      if(helper.assessKeystroke(e)){
         helper.getTextAndRecommend();
      }
   });

   var generateReference = function(number){
      number = number.toString();
      return "<a href=\"#eexcess" + number + "\"><span class=\"eexcessRef\" contenteditable=\"false\" data-eexcessrefid=\"" +
         number + "\">[" + number + "]</span></a>"
   }
});

