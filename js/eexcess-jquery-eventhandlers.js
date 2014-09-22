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
         }l
      }
   });

   /*
    * Handles the "add" buttons in the recommendation area. It adds citations
    * to the text, depending on the value of the citation style drop down element
    */

   $j(document).on("mousedown", 'input[name="addMatch"]', function(){
      var url =  $j(this).siblings("a").attr('href'),
      title = $j(this).siblings("a").text(),
      citationStyle = $j('#citationStyleDropDown').val(),
      cursorPosition = "",
      text = "";

      // define the operations according to the currently used editor
      if(tinyMCE.activeEditor && tinyMCE.activeEditor.isHidden() == false) {
         var getCursor = function(){
            return eexcessMethods.getCurserPosition(tinyMCE.activeEditor);
         }
         var getContent = function(){
            return tinyMCE.activeEditor.getContent();
         }
         var setContent = function(newText){
            tinyMCE.activeEditor.setContent(newText);
         }
      } else {
         var textarea = $j("textarea#content");
         var getCursor = function(){
            return textarea.getCursorPosition();
         }
         var getContent = function(){
            return textarea.val();
         }
         var setContent = function(newText){
            textarea.val(newText);;
         }
      }
      if(citationStyle == "default"){
         var newText = eexcessMethods.pasteLinkToText(getContent(), getCursor(), url, title, "link");
      }else{
         citationProcessor = new CITATION_PROCESSOR();
         citationProcessor.init(EEXCESS.citeproc.localsDir + 'locales-en-US.xml',
            EEXCESS.citeproc.stylesDir + citationStyle + '.csl',
            JSON.parse(eexcessMethods.readMetadata(this)));
         var citationText = citationProcessor.renderCitations();
         var citationsPattern = /<div class=\"csl-entry\">/g

         // how many citations are already included in the text?
         var array = getContent().match(citationsPattern);
         var citations = "";
         if(array != null){
            citations = array.length;
         }else{
            citations = 0;
         }
         // ah, okay, citations citaions are in the text at the moment

         // the following is required, in order to be able to call lastIndex
         // on the object in the future.
         citationsPattern.exec(citationText);

         var referenceNumber = "[" + (citations+1).toString() + "] ";
         var position = getCursor();
         var content = getContent();

         // find html tags
         var htmlTagPositions = eexcessMethods.findHtmlTagPositions(content);

         // find whitespaces
         var whitespaces = eexcessMethods.findWhitespaces(content);

         // if there is no convenient insertionpoint (i.e. whitespace) between the
         // cursorposition and the end of the document...
         if(whitespaces[whitespaces.length-1].index <= position){
            position = eexcessMethods.determineArticlesEnd(content, htmlTagPositions);
         }else{
            for(var i = 0; i < whitespaces.length; i++){
               if(whitespaces[i].index >= position){
                  // set cursor to the closest whitespace
                  position = whitespaces[i].index;
                  // is this whitespace within a html-tag?
                  while(htmlTagPositions.lastIndexOf(position) != -1
                        && htmlTagPositions.lastIndexOf(position - 1) != -1){
                     // we've found a html tag. decrease position until we left the tag
                     position--;
                  }
                  break;
               }
            }
         }

         citationText = insertIntoText(citationText, citationsPattern.lastIndex, referenceNumber);
         var url = citationText.match(/((https?:\/\/)?[\w-]+(\.[\w-]+)+(:\d+)?(\/\S*)?)/g);
         for(var i=0; i<url.length; i++){
            citationText = citationText.replace(url[i], '<a href="' + url[i] + '">' + url[i] + '</a>');
         }

         // insert reference # into text (at cursor position)
         var newText = insertIntoText(content, position, referenceNumber);
         // append the reference itself
         newText = insertIntoText(newText,
                                  eexcessMethods.determineArticlesEnd(newText, eexcessMethods.findHtmlTagPositions(newText)),
                                  citationText);
      }
      setContent(newText);
   });
});
