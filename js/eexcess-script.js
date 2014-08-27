// Avoid jQuery conflicts from different plugins
$j = jQuery.noConflict();

var EEXCESS_METHODS = function () {
   var spinner,
   resultList,
   introText,
   abortRequestButton,
   request = null; // used to store a ajax request in order to be able to abort it.

   init = function(mSpinner, mResultList, mIntroText, mAbortRequestButton) {
      this.spinner = mSpinner;
      this.resultList = mResultList;
      this.introText = mIntroText;
      this.abortRequestButton = mAbortRequestButton;

      this.spinner.hide();
      this.resultList.hide();
      this.abortRequestButton.hide();
   },

   // Will be called on a keyUp event inside the tinyMCE editor
   extractTerm = function(ed) {
      var text  = ed.getContent();
      if(eval("/" + EEXCESS.trigger.marker + ".+" + EEXCESS.trigger.closingTag + "/").test(text)) { // Tests if the text contains #eexcess:keywords#
         var terms = getTerms.call(this, text, true, true);

         if(terms != null) {
            EEXCESS.recommendationData.terms = terms;
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

   // Catches keydown events withing the visual editor (i.e. tinyMCE)
   catchKeystroke = function(ed, e) {
      assessKeystroke.call(this, e);
   },

   // Checks if a keystroke combo was pressed (e.g. ctrl+e)
   assessKeystroke = function(keyPressed){
      if (keyPressed.keyCode == EEXCESS.keyboardBindungs.getRecommendations
       && keyPressed.ctrlKey){
      getSelectedTextAndRecommend.call(this, keyPressed);
      }
   },

   /**
   * Inserts a HTML-link (a-tag) composed of url and title at position
   * cursorPosition into text.
   * @param text the to insert the link
   * @param cursorPosition the position to insert the link
   * @param url the url to link to
   * @param title the title of the link
   * @param linkText the text for the link
   */
   pasteLinkToText = function(text, cursorPosition, url, title, linkText){
      var newText = text.substring(0, cursorPosition);
      newText = newText + ' <a href="' + url + '" title="'+ title + '"> link </a> ';
      newText = newText + text.substring(cursorPosition, text.length);
      return newText
   },

   getSelectedTextAndRecommend = function(event) {
      event.preventDefault();
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

      if(text != "") {
         $j('.error').remove();
         EEXCESS.recommendationData.terms = getTerms.call(this, text, false, false);
         getRecommendations.call(this, EEXCESS.recommendationData);
      } else {
         displayError(EEXCESS.errorMessages.noTextSelected, $j("#getRecommendations"));
      }
   },

   /**
   * Inserts a div that contains an error message after a given element.
   *
   * @param msg The error message to display.
   * @param element The element after which to display the error.
   */
   displayError = function(msg, element) {
      // Removing previously added error messages
      $j(".error").remove();
      var div = $j('<div class="error">' + msg + '</div>');
      $j(element).after(div);
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

   toggleButtons = function(){
      var recommendButton = $j('#getRecommendations');
      var abortButton = $j('#abortRequest')

      if(recommendButton.is(":visible")){
         recommendButton.toggle("slow", function(){
            abortButton.toggle("slow");
         });
      }else{
         abortButton.toggle("slow", function(){
            recommendButton.toggle("slow");
         });
      }
   },

   getRecommendations = function(data) {
      // Hide the resullist. It could be visiable due to prior use
      this.resultList.hide("slow");

      this.toggleButtons.call(this);

      this.introText.hide("slow", function(){
         this.spinner.fadeIn("slow");
      }.call(this));

      if(this.request != null){
         this.request.abort();
      }

      // since 2.8 ajaxurl is always defined in the admin header and points to admin-ajax.php
      var ajaxCallback = function(response, status, jqXHR) {
         if(response) {
            // no longer needed, since the operation has completed and thus
            // the abortion is no longer an option.
            this.request = null;
            this.toggleButtons();

            // parsing the JSON string
            var o = JSON.parse(response);

            // Using Handlebars.js to compile the template. See http://handlebarsjs.com/ for documentation.
            var template = Handlebars.compile($j("#list-template").html());
            var list = $j(template(o));

            // image resizing to fit the design
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
                  $j(this).css('width', width);
               });
            });
            this.spinner.fadeOut("slow")

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
            this.resultList.html(EEXCESS.errorMessages.noRecommandations).show("slow");
         }
      };
      this.request = $j.ajax({
         type: "POST",
         url: ajaxurl,
         data: data,
         success: ajaxCallback,
         context: this
      });

   },

   // @param: editor is the tinyMCE.activeEditor-Object
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
   };

   return {
      init: init,
      extractTerm: extractTerm,
      catchKeystroke: catchKeystroke,
      assessKeystroke: assessKeystroke,
      pasteLinkToText: pasteLinkToText,
      getSelectedTextAndRecommend: getSelectedTextAndRecommend,
      displayError: displayError,
      getTerms: getTerms,
      toggleButtons: toggleButtons,
      getRecommendations: getRecommendations,
      getCurserPosition: getCurserPosition,
      setCursorPosition: setCursorPosition,
      spinner: spinner,
      resultList: resultList,
      introText: introText,
      abortRequestButton: abortRequestButton,
      request: request
   };
};


// Use jQuery via $j(...)t
$j(document).ready(function() {
   eexcessMethods = new EEXCESS_METHODS();
   eexcessMethods.init($j("#eexcess_container .inside #content .eexcess-spinner"),
             $j("#eexcess_container .inside #content #list"),
             $j("#eexcess_container .inside #content p"),
             $j('#abortRequest'));
});
