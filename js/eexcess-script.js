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

   getFile = function(path){
      var request = $j.ajax({
         type: "GET",
         url: path,
         async: false,
      });
      if(request.status == 200){
         return request.responseText;
      }else{
         return null;
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
   * @param text:          the text in which the snippet is to be inserted
   * @param cursorPosition:the position at which the snippet is so be inserted
   * @param snippet:       the snippet to be inserted
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
      var abortButton = $j('#abortRequest');
      var privacyButton = $j('#privacySettings');

      if(recommendButton.is(":visible")){
         privacyButton.toggle("fast");
         recommendButton.toggle("fast", function(){
            abortButton.toggle("fast");
         });
      }else{
         privacyButton.toggle("fast");
         abortButton.toggle("fast", function(){
            recommendButton.toggle("fast");
         });
      }
   },

   extendedLoggingEnabled = function(){
      // did the user opt in to logging his/her activities?
      return $j("#extendedLogging:checked").length == 1;
   }

   /**
    * returns the cursor position. This applies only for the tinyMCE (aka visual) editor.
    *
    * @param editor: is the tinyMCE.activeEditor-Object
    * @return: the position of the cursor
    */
   getCursorPosition = function(editor) {
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
    * @param content: The text that is to be inspected.
    * @return: An array containing the positions of html-tags in content.
    */
   findHtmlTagPositions = function(content){
      var htmlTagPattern = /<[^>]*>/g;
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
         return eexcessMethods.getCursorPosition(tinyMCE.activeEditor);
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

      if(whitespaces.length > 0){
         // if there is no convenient insertionpoint (i.e. whitespace) between the
         // cursorposition and the end of the document...
         if(whitespaces[whitespaces.length-1].index <= position){
            position = this.determineArticlesEnd(content, htmlTagPositions);
         }else{
            for(var i = 0; i < whitespaces.length; i++){
               // if there is a whitespace left to the current cursor position or somewhere ahead of
               // the current cursor position, insert the text there.
               if(whitespaces[i].index >= position || whitespaces[i].index == position - 1){
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
      }else{
         // if there is are no whitespaces, insert at the end of the blogpost
         position = this.determineArticlesEnd(content, htmlTagPositions);
      }
      return position;
   };

   /**
    * The return object exposes elements to the outside world.
    * In terms of OO-languages supporting classes this mechanism emulates the "public"
    * modifier whereas objects that are not mentioned in the return object remain "private".
    */
   return {
      getFile: getFile,
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
      getCursorPosition: getCursorPosition,
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
      determineDecentInsertPosition: determineDecentInsertPosition,
      extendedLoggingEnabled: extendedLoggingEnabled,
      sendUsersActivitiesSignal: sendUsersActivitiesSignal
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
