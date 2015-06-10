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
      eexcessMethods.searchQueryReflection.hide("slow");
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

   var generateReference = function(number){
      number = number.toString();
      return "<a href=\"#eexcess" + number + "\"><span class=\"eexcessRef\" contenteditable=\"false\" data-eexcessrefid=\"" +
         number + "\">[" + number + "]</span></a>"
   }

   /*
    * Handles the "Add as Citation" buttons in the recommendation area. It adds citations
    * to the text, depending on the value of the citation style drop down element
    */
   $j(document).on("mousedown", 'input[name="addAsCitation"]', function(){
      var url =  $j(this).siblings("a").attr('href'),
      title = $j(this).siblings("a").text(),
      citationStyle = $j('#citationStyleDropDown').val(),
      cursorPosition = "",
      text = "",
      alreadyCited = -1,
      referenceNumberText = "",
      referenceNumberDestination = "",
      position = eexcessMethods.getCursor(),
      content = eexcessMethods.getContent(),
      citationsPattern = /<p(\s?\S*\s?){0,5}class=\"csl-entry\"(\s?\S*\s?){0,5}>/g,
      posFirstCitation = content.search(citationsPattern),
      newText = content,
      citationsArray = [],
      citations = "",
      citationText = "";

      if(eexcessMethods.extendedLoggingEnabled()){
         sendUsersActivitiesSignal("cited", this);
      }

      if(citationStyle == "default"){
         var searchQuery = $j("#searchQuery").text();
         var newText = eexcessMethods.pasteLinkToText(content, position, url, title, searchQuery);
      } else {
         // if this entry has already been cited. warn the user, ask if he/she wants to continue
         // and act accordingly
         if($j(this).parent().hasClass("eexcess-alreadyCited")){
            if (confirm(EEXCESS.errorMessages.resourceAlreadyInserted) == true) {
               // carry on, as the user ordered
               alreadyCited = $j(this).parent().attr("data-refnumb");
               position = eexcessMethods.determineDecentInsertPosition.call(eexcessMethods,
                                                                            content,
                                                                            position);
               referenceNumberText = generateReference(alreadyCited);

               // -1 is the value of posFirstCitation, if no citation has been inserted.
               if(position > posFirstCitation && posFirstCitation != -1){
                  alert(EEXCESS.citeproc.errorMsg);
               } else {
                  newText = insertIntoText(content, position, referenceNumberText);
               }
            } else {
               // insertion rejected
               return;
            }
         }else{
            /*var citationProcessor = new CITATION_PROCESSOR();
            citationProcessor.init(pluginURL.pluginsPath + EEXCESS.citeproc.localsDir + 'locales-en-US.xml',
               pluginURL.pluginsPath + EEXCESS.citeproc.stylesDir + citationStyle + '.csl',
               JSON.parse(eexcessMethods.readMetadata(this)));*/
            citationText = CitationProcessor(JSON.parse(eexcessMethods.readMetadata(this)),
                                             eexcessMethods.getFile(pluginURL.pluginsPath + EEXCESS.citeproc.localsDir + 'locales-en-US.xml'),
                                             eexcessMethods.getFile(pluginURL.pluginsPath + EEXCESS.citeproc.stylesDir + citationStyle + '.csl'));
            if(citationText.hasOwnProperty("length")){
               if(citationText.length > 0){
                  citationText = citationText[0];
               }
            }

            // citeproc delivers its output within a <div>-tag. due to some weired transformation that
            // tinyMCE applies on these tags, they are replaced by <p>-tags.
            //citationText = citationText.replace("<div", "<p contenteditable=\"false\"");
            citationText = '<p class="csl-entry">' + citationText + "</p>";
            citationText = $j(citationText).attr("contenteditable", "false")[0].outerHTML;

            // how many citations are already included in the text?
            citationsArray = content.match(citationsPattern);
            citations = "";
            if(citationsArray != null){
               citations = citationsArray.length;
            } else {
               citations = 0;
            }
            // ah, okay, citations citations are in the text at the moment

            // the following is required, in order to be able to call lastIndex
            // on the object in the future.
            citationsPattern.exec(citationText);

            referenceNumberSource = generateReference(citations + 1);
            citationText = $j(citationText).attr("data-eexcessrefid", citations + 1)[0].outerHTML;
            referenceNumberDestination = "[<span id=\"eexcess" + (citations + 1).toString() + "\" class=\"refid\">" + (citations + 1).toString() + "</span>]";

            position = eexcessMethods.determineDecentInsertPosition.call(eexcessMethods, content, position);

            citationText = $j(citationText).html(referenceNumberDestination + $j(citationText).html())[0].outerHTML;
            url = citationText.match(/((https?:\/\/)?[\w-]+(\.[\w-]+)+(:\d+)?(\/\S*)?)/g);
            if(url != null){
               for(var i=0; i<url.length; i++){
                  citationText = citationText.replace(url[i], '<a href="' + url[i] + '" target=\"_blank\">' + url[i] + '</a>');
               }
            }

            // -1 is the value of posFirstCitation, if no citation has been inserted.
            if(position > posFirstCitation && posFirstCitation != -1){
               alert(EEXCESS.citeproc.errorMsg);
            } else {
               // insert reference # into text (at cursor position)
               newText = insertIntoText(content, position, referenceNumberSource);
               // append the reference itself
               newText = insertIntoText(newText,
                                        eexcessMethods.determineArticlesEnd(newText, eexcessMethods.findHtmlTagPositions(newText)),
                                        citationText);
               // Change the appearance of the row to make clear to the user,
               // that this object has already been inserted.
               $j(this).parent().addClass('eexcess-alreadyCited').attr("data-refnumb", citations + 1);
            }
         }
      }
      eexcessMethods.setContent(newText);
   });

   /*
    * Handles the "Add as Image" buttons in the recommendation area. It adds Images
    * to the blogpost.
    */
   $j(document).on("mousedown", 'input[name="addAsImage"]', function(){
      var imageURL = $j(this).parent().prev().find("a").attr("href"),
      title = $j(this).parent().find("a").text(),
      snippet = "<a title='" + title + "' href='" + imageURL + "' target='_blank'><img src='" + imageURL + "'/></a>",
      position = eexcessMethods.getCursor(),
      content = eexcessMethods.getContent();

      if(eexcessMethods.extendedLoggingEnabled()){
         sendUsersActivitiesSignal("image_embedded", this);
      }

      var insertionPosition = eexcessMethods.determineDecentInsertPosition.call(eexcessMethods, content, position);
      var newText = insertIntoText(content, insertionPosition, snippet);
      eexcessMethods.setContent(newText);
   });

   /*
    *
    */
   $j(document).on("mousedown", ".recommendationTextArea a", function(){
      if(eexcessMethods.extendedLoggingEnabled()){
         sendUsersActivitiesSignal("detail_view", this);
      }
   });
});
