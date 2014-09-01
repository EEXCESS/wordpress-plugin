// Avoid jQuery conflicts from different plugins
$j = jQuery.noConflict();

$j(document).ready(function() {
   // Triggers the recommendations call by button
   $j(document).on("mousedown", "#getRecommendations", function(event){
      eexcessMethods.getSelectedTextAndRecommend(event);
   });

   // Triggers the recommendations call by keyboard (through ctrl+e)
   $j(document).on("keydown", "#content", function(e){
      eexcessMethods.assessKeystroke(e);
   });

   // Triggers the abort Request button
   $j(document).on("mousedown", "#abortRequest", function(event){
      eexcessMethods.request.abort();
      eexcessMethods.toggleButtons();
      eexcessMethods.resultList.hide("slow");
      eexcessMethods.spinner.hide("slow", function(){
         eexcessMethods.introText.show("slow");
      });
   });

   // Observe the post title
   $j(document).on("change", "input[name='post_title']", function() {
      // get recommendations from title
      EEXCESS.recommendationData.terms = [$j(this).val().trim()];
      eexcessMethods.getRecommendations(EEXCESS.recommendationData);
   });

   // Observe the text editor
   $j(document).on("keyup", "textarea#content", function(e) {
      var text  = $j(this).val();
      var regex = eval("/" + EEXCESS.trigger.marker + ".+" + EEXCESS.trigger.closingTag + "/");
      if(regex.test(text)) { // Tests if the text contains #eexcess:keywords#
         var terms = eexcessMethods.getTerms(text, false, true);

         if(terms != null) {
            EEXCESS.recommendationData.terms = terms;
            eexcessMethods.getRecommendations(EEXCESS.recommendationData);
            var cursorPosition = $j(this).getCursorPosition();
            var text = $j(this).val();
            var match = text.match(regex);
            text = text.replace(match[0], match[0].slice(0, match[0].length - 1));
            text = text.replace(EEXCESS.trigger.marker, "");
            $j(this).val(text);
            // setting the cursor position
            $j(this).selectRange(cursorPosition - EEXCESS.trigger.marker.length - EEXCESS.trigger.closingTag.length);
         }
      }
   });

   // Handles the "add" buttons in the recommendation area
   $j(document).on("mousedown", 'input[name="addMatch"]', function(){
      var url = $j($j("input[name='addMatch']")[0]).siblings("a").attr('href');
      var title = $j($j("input[name='addMatch']")[0]).siblings("a").text();
      var cursorPosition = "";
      var text = "";
      if(tinyMCE.activeEditor && tinyMCE.activeEditor.isHidden() == false) {
         cursorPosition = eexcessMethods.getCurserPosition(tinyMCE.activeEditor);
         text = tinyMCE.activeEditor.getContent();
         var newText = eexcessMethods.pasteLinkToText(text, cursorPosition, url, title, "link");
         tinyMCE.activeEditor.setContent(newText);
      } else {
         var textarea = $j("textarea#content");
         cursorPosition = textarea.getCursorPosition();
         text = textarea.val();
         var newText = eexcessMethods.pasteLinkToText(text, cursorPosition, url, title, "link");
         textarea.val(newText);
      }
   });
});
