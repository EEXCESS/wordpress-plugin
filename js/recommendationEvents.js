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
   
   // Beware! this is an ugly hack. it resizes the vis thickbox after it's been displayed
   // If you read this and feel brave, pls find a better solution. 
   window.tb_show_old = window.tb_show;
   window.tb_show = function(t, a, g){
      window.tb_show_old(t, a, g);
      resizeVisualization();
      var res = JSON.parse(sessionStorage.getItem("curResults"));
      res = {event: "eexcess.newResults", data: res};
      
      iframes.sendMsg(res , ["dashboard"]);
   }

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

