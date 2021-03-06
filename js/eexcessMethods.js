define(["jquery", "APIconnector"], function($, api){
   
   api.init(originHeader);
   var uuid = localStorage.getItem("eexcess.uuid") || "",
   originHeader = {
      origin:{
         clientType: "EEXCESS - Wordpress Plug-in",
         clientVersion: "0.4", 
         module: "SearchResultList",
         userID: uuid
     },
     loggingLevel: 0
   },

   getModuleOpenedLogObj = function(name){
      // copy the object
      var logObj = JSON.parse(JSON.stringify({ origin: this.originHeader.origin}));
      logObj["content"] = { name: name };
      return logObj;
   },

   compileUserProfile = function(){
      return {
         "address" : {
            "country": localStorage["eexcess.address.country"],
            "city": localStorage["eexcess.address.city"]
         },
         "ageRange": localStorage["eexcess.age"],
         "gender" : localStorage["eexcess.gender"],
         "origin": originHeader.origin,
         "loggingLevel": 0
      };
      /* expired
      localStorage["eexcess.address.line1"]
      localStorage["eexcess.address.line2"]
      localStorage["eexcess.address.zipcode"]
      localStorage["eexcess.firstname"]
      localStorage["eexcess.lastname"]
      localStorage["eexcess.logging"]
      localStorage["eexcess.title"]
      */
   },


   fetchDetails = function(badges, callback){
      if(Array.isArray(badges) == true){
         var date = new Date();
         var queryID = this.getQueryID();
         var queryHeader = {};
         queryHeader.origin = $.extend(true, {}, originHeader.origin);
         queryHeader.queryID = queryID;
         var profile = $.extend(queryHeader, {"documentBadge": badges});
         api.getDetails(profile, callback);
      } else {
         throw new Error("Badges is not an Array");
      }
   },

   /**
    * WARNING: THIS METHOD IS CURRENTLY DISABLED DUE TO API ISSUES
    * This method deals with certain actions that the user can perform, namely:
    *    1. Cite a resource.
    *    2. Embed an image.
    *    3. Look at the detail page of a resource.
    * It than sends an AJAX-request to the privacy proxy in order to inform him
    * about the action that has just been taken.
    *
    * @param action: A string reprentating the action. Valid strings are:
    *                "cited", "image_embedded" and "detail_view".
    * @param trigger: The object(button or link) that was used to trigger the
    *                 action.
    *
    */
   sendUsersActivitiesSignal = function(action, documentBadge){
      var resource = documentBadge.uri,
      timestamp = Date.now().toString(),
      query = sessionStorage["eexcess.lastSearchQuery"];
      uuid = documentBadge.id;

      var data = {
         "action": "advanced_logging",//this is required for selecting the a server-side php method
         "resource": resource,
         "timestamp": timestamp,
         "type": "view",
         "query": query,
         "beenRecommended": "true",
         "action-taken": action,
         "uuid": uuid
      };
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


   loggingEnabled = function(){
      // did the user opt in to logging his/her activities?
      return $("input[data-eexcess-profile-field='logging']:checked").length == 1;
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


   getCursor = function(){
      if(tinyMCE.activeEditor && tinyMCE.activeEditor.isHidden() == false) {
         return getCursorPosition(tinyMCE.activeEditor);
      } else {
         var textarea = $("textarea#content");
         return textarea.getCursorPosition();
      }
   },

   getContent = function(){
      if(tinyMCE.activeEditor && tinyMCE.activeEditor.isHidden() == false) {
         return tinyMCE.activeEditor.getContent();
      } else {
         var textarea = $("textarea#content");
         return textarea.val();
      }
   },

   setContent = function(newText){
      if(tinyMCE.activeEditor && tinyMCE.activeEditor.isHidden() == false) {
         return tinyMCE.activeEditor.setContent(newText);
      } else {
         var textarea = $("textarea#content");
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
   },

   findResultByUrl = function(url){
      if(typeof(url) === "string"){
         var results = JSON.parse(sessionStorage["curResults"]);
         if(typeof(results) === "object" && results.hasOwnProperty("result") && Array.isArray(results.result)){
            results = results.result;
            for(var i=0; i<results.length; i++){
               if(results[i].documentBadge.uri === url){
                  return results[i];
               }
            }
            // No match
            return null;
         }
      } else {
         throw new Error("String expected");
      }
   },
   
   getQueryID = function(){
      return JSON.parse(sessionStorage["curResults"]).queryID;
   };

   /**
    * The return object exposes elements to the outside world.
    * In terms of OO-languages supporting classes this mechanism emulates the "public"
    * modifier whereas objects that are not mentioned in the return object remain "private".
    */
   return {
      pasteLinkToText: pasteLinkToText,
      getTerms: getTerms,
      getCursorPosition: getCursorPosition,
      setCursorPosition: setCursorPosition,
      determineArticlesEnd: determineArticlesEnd,
      findHtmlTagPositions: findHtmlTagPositions,
      findWhitespaces: findWhitespaces,
      getCursor: getCursor,
      getContent: getContent,
      setContent: setContent,
      determineDecentInsertPosition: determineDecentInsertPosition,
      loggingEnabled: loggingEnabled,
      sendUsersActivitiesSignal: sendUsersActivitiesSignal,
      fetchDetails: fetchDetails,
      compileUserProfile: compileUserProfile,
      insertIntoText: insertIntoText,
      originHeader: originHeader,
      findResultByUrl:findResultByUrl, 
      getQueryID: getQueryID,
      getModuleOpenedLogObj: getModuleOpenedLogObj,
      uuid: uuid
   };
});


