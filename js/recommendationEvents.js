require(['jquery', 'recommendationEventsHelper', 'iframes'], function($, helper, iframes){

   function resizeVisualization(){
      var margin = 200,
      screenWidth = $(window).width();

      $("#TB_window").width(screenWidth - margin); 
      $("#TB_window").css("margin-left", -(screenWidth/2 - margin/2));
      $("#TB_ajaxContent").width(screenWidth - margin);
      $("#TB_ajaxContent").css({"padding": 0, "overflow": "hidden"});
      $("#dashboard").width(screenWidth - margin);
      $("#dashboard").contents().find("#eexcess_controls").css("overflow-y", "hidden");
   }

   function resizeResultList(){
      $("#resultList").width($("#eexcess_container").width());
   }

   /*$(document).on("DOMNodeInserted", "#TB_ajaxContent", function(){
      resizeVisualization();
   });*/

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
   $(window).resize(function(e){
      var dashboardTB  = $("#TB_window").find("#dashboard");
      
      // if dashboard is visable
      if(dashboardTB.hasOwnProperty("length") && dashboardTB.length > 0){
         resizeVisualization();
      }
      resizeResultList();
   });
   resizeResultList();
});

