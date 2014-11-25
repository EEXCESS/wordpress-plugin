// Avoid jQuery conflicts from different plugins
$j = jQuery.noConflict();
/**
 * The following object contains all custom functions and properties for the EEXCESS-plugin.
 * It hides the limitations of javascript and behaves to the greates possible extent link
 * a class in other programming laguages. The "instanziation" and "initialization" of the
 * "class" can be found at the bottom of this file.
 */
var EEXCESS_METHODS = function () {
   // They hold references to jquery-objects that represent html-objects in the DOM.
   var that,
   spinner,
   resultList,
   introText,
   abortRequestButton,
   CitationStyleDropDown,

   // used to store a ajax request in order to be able to abort it.
   request = null;

   /**
    * The Constructor of this class.
    * All parameters are jquery-objects.
    * @param mSpinner: reference to a DOM-object representation a spinner that is
    *                  usen when time-consuming actions take place
    */
   init = function(mSpinner, mResultList, mIntroText, mAbortRequestButton, mCitationStyleDropDown, mSearchQueryReflection) {
      this.that = this;
      this.spinner = mSpinner;
      this.resultList = mResultList;
      this.introText = mIntroText;
      this.abortRequestButton = mAbortRequestButton;
      this.CitationStyleDropDown = mCitationStyleDropDown;
      this.searchQueryReflection = mSearchQueryReflection;

      this.spinner.hide();
      this.resultList.hide();
      this.abortRequestButton.hide();
      this.CitationStyleDropDown.hide();
      this.searchQueryReflection.hide();
   },

   /**
    * This function is triggered by the keyup-event in the tinyMCE-editor (visual-editor in
    * wordpress terminology aka WYSIWYG-Editor). It searches the so far written text for a
    * pattern defined by EEXCESS.trigger.maker and EEXCESS.trigger.closingTag. If a match is
    * found, the tokens surrounded by the predefined delimeters are extracted and the delimiters
    * will be removed. The extracted tokens are used for a recommendation that will also by
    * displayed by this function.
    *
    * @param ed: a reference to the tinyMCE textarea.
    */
   extractTerm = function(ed) {
      var text  = ed.getContent();
      if(eval("/" + EEXCESS.trigger.marker + ".+" + EEXCESS.trigger.closingTag + "/").test(text)) { // Tests if the text contains #eexcess:keywords#
         var terms = getTerms.call(this, text, true, true);

         if(terms != null) {
            EEXCESS.recommendationData.terms = terms;
            EEXCESS.recommendationData.trigger = "tag";
            getRecommendations.call(this, EEXCESS.recommendationData);
            var cursorPosition = getCurserPosition.call(this, ed);
            var cleanedContent = text.substring(0, cursorPosition - 1) + text.substring(cursorPosition, text.length);
            cleanedContent = cleanedContent.replace(EEXCESS.trigger.marker, "").replace('<p>', "").replace("</p>", "");
            ed.setContent(cleanedContent);
            // setting the cursor position
            setCursorPosition.call(this, ed, cursorPosition - EEXCESS.trigger.marker.length - EEXCESS.trigger.closingTag.length - 1);
         }
      }
   },

   /**
    * This functions is called when a keyup-event occurs either in the visal-editor
    * or in the text-editor. It checks if a certain keystroke combo was used (e.g.
    * ctrl+e). If so, the recommendation workflow is triggered. this workflow is
    * triggered when ctrl and the key defined in
    * EEXCESS.keyboardBindungs.getRecommendations are used.
    *
    *
    * @param keyPressed: the object that ist passed to an keylistener-eventhandler.
    */
   assessKeystroke = function(keyPressed){
      if (keyPressed.keyCode == EEXCESS.keyboardBindungs.getRecommendations
       && keyPressed.ctrlKey){
      getSelectedTextAndRecommend.call(this, keyPressed);
      }
   },

   /**
   * Inserts a HTML-link (a-tag) composed of url and title at position
   * cursorPosition into text.
   *
   * @param text:          the to insert the link
   * @param cursorPosition:the position to insert the link
   * @param url:           the url to link to
   * @param title:         the title of the link
   * @param linkText:      the text for the link
   */
   pasteLinkToText = function(text, cursorPosition, url, title, linkText){
      return insertIntoText(text, cursorPosition, ' <a href="' + url + '" title="'+ title + '">' + linkText + '</a> ');
   },

   /**
   * Inserts an arbitrary string (snippet) at cursorPosition into text.
   *
   * @param text:          the to insert the link
   * @param cursorPosition:the position to insert the link
   * @param snippet:       the text to insert
   */
   insertIntoText = function(text, cursorPosition, snippet){
      var newText = text.substring(0, cursorPosition);
      newText = newText + snippet;
      newText = newText + text.substring(cursorPosition, text.length);
      return newText
   },

   getSelectedText = function(){
      var text = "";
      // Visual Editor
      if(text == "" && tinyMCE.activeEditor && tinyMCE.activeEditor.isHidden() == false) {
         text = tinyMCE.activeEditor.selection.getContent( {format : "text"} );
      } else { // Casual TextEditor
         try {
            var ta = $j('.wp-editor-area').get(0);
               text = ta.value.substring(ta.selectionStart, ta.selectionEnd);
         } catch (e) {
            console.log('Exception during get selection text');
         }
      }
      return text;
   },

   /**
    * This function is invoked when the "Get Recommendations"-Button or the
    * keybord shortcut is used.
    * It extracts the marked text in either the visual- oder text editor and
    * triggers the recommendation workflow.
    *
    * @param event: the event, that is associated with the "Get
    *               Recommendations"-Button. The standard behavior will be
    *               suppressed.
    */
   getSelectedTextAndRecommend = function(event) {
      event.preventDefault();
      var text = getSelectedText();

      // In order to display the search query to the user
      setSearchQueryReflection(this, text);

      if(text != "") {
         $j('.error').remove();
         EEXCESS.recommendationData.terms = getTerms.call(this, text, false, false);
         // determine the trigger that let to the invocation of this event
         if(event.type == "keydown"){
            EEXCESS.recommendationData.trigger = "keydown";
         } else {
            if(event.type == "mousedown" || event.type == "click"){
               EEXCESS.recommendationData.trigger = "mousedown";
            } else {
               EEXCESS.recommendationData.trigger = "unknown";
            }
         }

         getRecommendations.call(this, EEXCESS.recommendationData);
      } else {
         displayError(EEXCESS.errorMessages.noTextSelected, $j("#citationStyleDropDown"));
      }
   },

   /**
   * Inserts a div that contains an error message after a given element.
   *
   * @param msg:     The error message to display.
   * @param element: The element after which to display the error.
   */
   displayError = function(msg, element) {
      // Removing previously added error messages
      $j(".error").remove();
      var div = $j('<div class="error">' + msg + '</div>');
      $j(element).after(div);
      div.show("slow");
   },

   /**
   * Extracting the terms from the text.
   *
   * @param {String} The text written by the user
   * @param {Boolean} Indicates if the user uses the visual editor
   *
   * @return {Array|null} Returns a list of terms or null, if no marker was found
   */
   getTerms = function(content, visualEditor, marker) {
      var index = content.lastIndexOf(EEXCESS.trigger.marker);

      if(index != -1 || !marker) {
         // Removing multiple whitespaces
         content = content.replace(/\s{2,}/g," ");

         // Removing the html tags from the content of the tinyMCE editor
         if(visualEditor && marker) {
            var tmp = document.createElement("DIV");
            tmp.innerHTML = content;
            content = tmp.textContent || tmp.innerText || "";
         }

         // Split string into words
         var results = content.match(/("[^"]+"|[^"\s]+)/g);

         for(var i = 0; i < results.length; i++){
            // Marker found
            if(results[i].indexOf(EEXCESS.trigger.marker) > -1) {
               for(var j = i + 1; j < results.length; j++){
                  // Closingtag found
                  if(results[j].indexOf(EEXCESS.trigger.closingTag) > -1) {
                     results[i] = results[i].replace(EEXCESS.trigger.marker, "");
                     results[j] = results[j].replace(EEXCESS.trigger.closingTag, "");

                     var tmp = [];
                     for(; i<j; i++){
                        if(results[i] != ""){
                           tmp[tmp.length] = results[i];
                        }
                     }
                     results = tmp;
                     break;
                  }
               }
               break;
            }
         }

         if(marker) {
            // Slicing the results array according to the textSpan option defined in the EEXCESS.trigger object
            if(results.length > EEXCESS.trigger.textSpan){
               results = results.slice(results.length - EEXCESS.trigger.textSpan);
            }
            for(var i = 0; i < results.length; i++) {
                // removing the marker from the result
               if(results[i].indexOf(EEXCESS.trigger.marker) > -1) {
                  results[i] = results[i].substring(EEXCESS.trigger.marker.length);
                  if(result[i].indexOf(EEXCESS.trigger.closingTag) > -1){
                     results[i] = results[i].replace(EEXCESS.trigger.closingTag, "");
                  }
               }
            }
         }

         // Removing punctuation marks from the result and discards empty strings (i.e. "")
         tmp = [];
         for(var i = 0; i < results.length; i++) {
            var val = results[i].replace(/[\.,#-\/!$%\^&\*;:{}=\-_`~()\[\]]/g,"");
            if(val != ""){
               tmp[tmp.length] = val
            }
         }
         results = tmp;
         return results;
      }
      return null;
   },

   /**
    * Fades the "Get Recommendations"-Button out an the "abort Request"-Button in and vice versa.
    */
   toggleButtons = function(){
      var recommendButton = $j('#getRecommendations');
      var abortButton = $j('#abortRequest')

      if(recommendButton.is(":visible")){
         recommendButton.toggle("fast", function(){
            abortButton.toggle("fast");
         });
      }else{
         abortButton.toggle("fast", function(){
            recommendButton.toggle("fast");
         });
      }
   },

   /**
    * This functions handles the recommendation workflow. It changes the UI and triggers the
    * ajax-call to the federated recommender.
    *
    * @param data: The query that will be sent to the recommender.
    */
   getRecommendations = function(data) {
      // Hide the resullist. It could be visiable due to prior use
      this.resultList.hide("slow");
      this.searchQueryReflection.hide("slow");
      this.CitationStyleDropDown.hide("slow");
      this.toggleButtons.call(this);
      this.introText.hide("slow", function(){
         this.spinner.fadeIn("slow");
      }.call(this));

      // this kills a previous request
      if(this.request != null){
         this.request.abort();
      }

      this.request = $j.ajax({
         type: "POST",
         url: ajaxurl,
         data: data,
         success: ajaxCallbackSuccess,
         context: this
      });
   },

   /**
    * The callback-function that is invoked when the recommenders answer arrives. It
    * updates the UI and displays the results accordingly. when there are no matches
    * an errormessage will be displayed.
    * this functions is private (i.e. it can only by used inside of EEXCESS_METHODS
    * objects).
    *
    * @params: refer to http://api.jquery.com/jquery.ajax/ and look for the success-
    *          callback method.
    */
   ajaxCallbackSuccess = function(response, status, jqXHR) {
      if(response != "") {
         // no longer needed, since the operation has completed and thus
         // the abortion is no longer an option and the button can be faded away.
         this.request = null;
         this.toggleButtons();
         this.CitationStyleDropDown.show("slow");
         this.searchQueryReflection.show("slow");

         // parsing the JSON string
         var o = JSON.parse(response);
         $j("#numResults").text(o["totalResults"]);

         // Using Handlebars.js to compile the template. See http://handlebarsjs.com/ for documentation.
         var template = Handlebars.compile($j("#list-template").html());
         var list = $j(template(o));

         // image resizing to fit the layout
         width = EEXCESS.recommendationListSettings.imageWidth;
         height = EEXCESS.recommendationListSettings.imageHeight;
         $j(list).find("img").each(function(index){
            if(this.naturalWidth != width){
               var tmp = width/this.width;
               $j(this).attr('width', width + 'px');
               var foo = Math.ceil(this.height*tmp);
               $j(this).attr('height', foo + 'px');
            }
            if(this.height > height){
               var tmp = height/this.height;
               $j(this).attr('height', height + 'px');
               var foo = Math.ceil(this.width*tmp);
               $j(this).attr('width', foo + 'px');
            }

         });

         var content = getContent();
         var resourceURLs = [];
         $j(content).filter('[class=csl-entry]').find('a').each(function() {
            resourceURLs.push($j(this).attr('href'));
         });

         var usePagination = list.find("#eexcess-recommendationList li").length > 10;

         if(usePagination) {
            // show only the first x items
            list.find("#eexcess-recommendationList li").hide().slice(0, EEXCESS.pagination.items).show();
         }

         // display the list
         this.resultList.html(list).show("slow", function(){
            $j(".recommendationTextArea").each(function(index){
               var margin = $j($j('[class="recommendationTextArea"]')[0]).css("margin-right").replace("px", "");
               margin = margin + $j($j('[class="recommendationTextArea"]')[0]).css("margin-left").replace("px", "");
               var width = $j('#eexcess-recommendationList').width() - $j($j('.eexcess-previewPlaceholder')[0]).width() - margin;
               var obj = $j(this);
               obj.css('width', width);
               // mark the already cited entries
               if((referenceNumber = resourceURLs.indexOf(obj.find('input[name="eexcessURI"]').attr('value'))) != -1){
                  obj.addClass("eexcess-alreadyCited").attr("data-refnumb", referenceNumber + 1);
               }
            });
         });
         this.spinner.fadeOut("slow");

         if(usePagination) {
            var pages = Math.ceil(o.result.length / EEXCESS.pagination.items); // the number of pages
            $j("#recommandationList-pagination").paginate({
               background_color        : 'none',
               background_hover_color  : 'none',
               border                  : false,
               count       : pages,
               display     : EEXCESS.pagination.display,
               images      : false,
               mouse       : 'press',
               start       : EEXCESS.pagination.start,
               text_color              : EEXCESS.pagination.textColor,
               text_hover_color        : EEXCESS.pagination.textHoverColor,
               onChange : function(page) {
                  var page = page - 1;
                  var min = page * EEXCESS.pagination.items;
                  var max = page * EEXCESS.pagination.items + EEXCESS.pagination.items;
                  $j("#eexcess-recommendationList li").hide().slice(min, max).show();
               }
            });
         }
      } else {
         displayError(EEXCESS.errorMessages.noRecommandations, $j("#citationStyleDropDown"));
         this.spinner.fadeOut("slow");
         this.toggleButtons();

      }
   };


   /**
    * returns the cursor position. This applies only for the tinyMCE (aka visual) editor.
    *
    * @param editor: is the tinyMCE.activeEditor-Object
    * @return: the position of the cursor
    */
   getCurserPosition = function(editor) {
      //set a bookmark so we can return to the current position after we reset the content later
      var bm = editor.selection.getBookmark(0);

      //select the bookmark element
      var selector = "[data-mce-type=bookmark]";
      var bmElements = editor.dom.select(selector);

      //put the cursor in front of that element
      editor.selection.select(bmElements[0]);
      editor.selection.collapse();

      //add in my special span to get the index...
      //we won't be able to use the bookmark element for this because each browser will put id and class attributes in different orders.
      var elementID = "######cursor######";
      var positionString = '<span id="'+elementID+'"></span>';
      editor.selection.setContent(positionString);

      //get the content with the special span but without the bookmark meta tag
      var content = editor.getContent({format: "html"});
      //find the index of the span we placed earlier
      var index = content.indexOf(positionString);

      //remove my special span from the content
      editor.dom.remove(elementID, false);

      //move back to the bookmark
      editor.selection.moveToBookmark(bm);

      return index;
   },

   /**
    * sets the cursor position. This applies only for the tinyMCE (aka visual) editor.
    *
    * @param editor: Is the tinyMCE.activeEditor-Object
    * @param index:  The new position of the cursor
    * @return:
    */
   setCursorPosition = function(editor, index) {
      //get the content in the editor before we add the bookmark...
      //use the format: html to strip out any existing meta tags
      var content = editor.getContent({format: "html"});

      //split the content at the given index
      var part1 = content.substr(0, index);
      var part2 = content.substr(index);

      //create a bookmark... bookmark is an object with the id of the bookmark
      var bookmark = editor.selection.getBookmark(0);

      //this is a meta span tag that looks like the one the bookmark added... just make sure the ID is the same
      var positionString = '<span id="'+bookmark.id+'_start" data-mce-type="bookmark" data-mce-style="overflow:hidden;line-height:0px"></span>';
      //cram the position string inbetween the two parts of the content we got earlier
      var contentWithString = part1 + positionString + part2;

      //replace the content of the editor with the content with the special span
      //use format: raw so that the bookmark meta tag will remain in the content
      editor.setContent(contentWithString, ({format: "raw"}));

      //move the cursor back to the bookmark
      //this will also strip out the bookmark metatag from the html
      editor.selection.moveToBookmark(bookmark);

      //return the bookmark just because
      return bookmark;
   },

   /**
    * Collects the information of a resultlist entry and puts them in a json-object.
    * The format of the json-object is as required by citeproc-js in order to process
    * accordingly.
    *
    * @param context: is the DOM element holding the required information.
    */
   readMetadata = function(context){
      var creator = $j(context).siblings("input[name='creator']").val(),
      collectionName = $j(context).siblings("input[name='collectionName']").val(),
      year = $j(context).siblings("input[name='facets.year']").val(),
      id = $j(context).siblings("input[name='id']").val(),
      title = $j(context).siblings("a").text(),
      uri = $j(context).siblings("input[name='eexcessURI']").val();

      if(creator == undefined){ creator = "";}
      if(collectionName == undefined){ collectionName = "";}
      if(year == undefined){ year = "";}
      if(id == undefined){ id = "";}
      if(title == undefined){ title = "";}
      if(uri == undefined){ uri = "";}

      var json = '{ \
         "' + id + '": { \
            "id": "' + id + '", \
            "container-title": "' + collectionName + '", \
            "URL": "' + uri + ' ", \
            "title": "' + title + '", \
            "author": [ \
              { \
                "family": "' + creator + '" \
              } \
            ], \
            "issued": { \
              "date-parts": [ \
                [ \
                  "' + year + '" \
                ] \
              ] \
            } \
         } \
      }';
      return json;
   },

   /**
    * Return the last position of an article that can be used to insert text. Usually
    * it's not the end of the textbox since there is HTML included (i.e. mostly the <p>-tag)
    * and the text shouldn't be inserted outside of the last HTML-tag.
    *
    * @param content: A string containing text and HTML.
    * @param htmlTagPOsitions: An array containing information where HTML-tags are found in
                               content. For example, if content start with a <p>-tag this array
                               should look like this: [0, 1, 2, ...]. The interpretation is, that
                               the first three characters belong to a HTML-tag.
    */
   determineArticlesEnd = function(content, htmlTagPositions){
      position = content.length;
      while(htmlTagPositions.lastIndexOf(position - 1) != - 1){
         position--;
      }
      return position;
   },

   /**
    * Determines the positions of html tag in content.
    *
    * @param content: The text that shall be inspected.
    * @return: An array containing the positions of html-tags in content.
    */
   findHtmlTagPositions = function(content){
      var htmlTagPattern = /<{1}\/{0,1}[A-Za-z0-9_\-"=\s]*[/]{0,1}>{1}/g;
      var htmlTagPositions = [];
      while ((match = htmlTagPattern.exec(content)) != null) {
         for(var i = 0; i < match[0].length; i++){
            htmlTagPositions.push(match.index + i);
         }
      }
      return htmlTagPositions;
   },

   /**
   * Determines the positions of whitespaces in content.
   *
   * @param content: The text that shall be inspected.
   * @return: An array containing the positions the whitespaces in content.
   */
   findWhitespaces = function(content){
      var whitespacePattern = /\s/g;
      var whitespaces = [];
      while ((match = whitespacePattern.exec(content)) != null) {
         whitespaces.push(match);
      }
      return whitespaces;
   },

   /**
    * Sets the text for the "Results on:" display.
    *
    * @param context: An instance of this object (i.e. EEXCESS_METHODS)
    * @param text: The new text.
    */
   setSearchQueryReflection = function(context, text){
      var foo = context.searchQueryReflection.find('#searchQuery')
      if(foo != null){
         foo.text(text);
      }
   },

   getCursor = function(){
      if(tinyMCE.activeEditor && tinyMCE.activeEditor.isHidden() == false) {
         return eexcessMethods.getCurserPosition(tinyMCE.activeEditor);
      } else {
         var textarea = $j("textarea#content");
         return textarea.getCursorPosition();
      }
   },

   getContent = function(){
      if(tinyMCE.activeEditor && tinyMCE.activeEditor.isHidden() == false) {
         return tinyMCE.activeEditor.getContent();
      } else {
         var textarea = $j("textarea#content");
         return textarea.val();
      }
   },

   setContent = function(newText){
      if(tinyMCE.activeEditor && tinyMCE.activeEditor.isHidden() == false) {
         return tinyMCE.activeEditor.setContent(newText);
      } else {
         var textarea = $j("textarea#content");
         return textarea.val(newText);
      }
   },

   determineDecentInsertPosition = function(content, mPosition){
      var position = mPosition;
      // find html tags
      var htmlTagPositions = this.findHtmlTagPositions(content);

      // find whitespaces
      var whitespaces = this.findWhitespaces(content);

      // if there is no convenient insertionpoint (i.e. whitespace) between the
      // cursorposition and the end of the document...
      if(whitespaces[whitespaces.length-1].index <= position){
         position = this.determineArticlesEnd(content, htmlTagPositions);
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
      return position;
   };

   /**
    * The return object exposes elements to the outside world.
    * In terms of OO-languages supporting classes this mechanism emulates the "public"
    * modifier whereas objects that are not mentioned in the return object remain "private".
    */
   return {
      init: init,
      extractTerm: extractTerm,
      assessKeystroke: assessKeystroke,
      pasteLinkToText: pasteLinkToText,
      getSelectedTextAndRecommend: getSelectedTextAndRecommend,
      getSelectedText: getSelectedText,
      displayError: displayError,
      getTerms: getTerms,
      toggleButtons: toggleButtons,
      getRecommendations: getRecommendations,
      getCurserPosition: getCurserPosition,
      setCursorPosition: setCursorPosition,
      readMetadata: readMetadata,
      spinner: spinner,
      resultList: resultList,
      introText: introText,
      abortRequestButton: abortRequestButton,
      request: request,
      determineArticlesEnd: determineArticlesEnd,
      findHtmlTagPositions: findHtmlTagPositions,
      findWhitespaces: findWhitespaces,
      searchQueryReflection: searchQueryReflection,
      getCursor: getCursor,
      getContent: getContent,
      setContent: setContent,
      determineDecentInsertPosition: determineDecentInsertPosition
   };
};


/**
 * This code-snippet instanziates and initializes a EEXCESS_METHODS-Object and makes it
 * globaly available.
 */
$j(document).ready(function() {
   eexcessMethods = new EEXCESS_METHODS();
   eexcessMethods.init($j("#eexcess_container .inside #content .eexcess-spinner"),
            $j("#eexcess_container .inside #content #list"),
            $j("#eexcess_container .inside #content p"),
            $j('#abortRequest'),
            $j('#citationStyleDropDown'),
            $j('#searchQueryReflection'));
});
