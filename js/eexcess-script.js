// Avoid jQuery conflicts from different plugins
$j = jQuery.noConflict();

$j.fn.setCursorPosition = function(pos) {
  this.each(function(index, elem) {
    if (elem.setSelectionRange) {
      elem.setSelectionRange(pos, pos);
    } else if (elem.createTextRange) {
      var range = elem.createTextRange();
      range.collapse(true);
      range.moveEnd('character', pos);
      range.moveStart('character', pos);
      range.select();
    }
  });
  return this;
};

// Use jQuery via $j(...)
$j(document).ready(function() {
    // Getting the cursor position 
    $j.fn.getCursorPosition = function() {
        var input = this.get(0);
        if (!input) return; // No (input) element found
        if ('selectionStart' in input) {
            // Standard-compliant browsers
            return input.selectionStart;
        } else if (document.selection) {
            // IE
            input.focus();
            var sel = document.selection.createRange();
            var selLen = document.selection.createRange().text.length;
            sel.moveStart('character', -input.value.length);
            return sel.text.length - selLen;
        }
    }
    // Setting the cursor position
    $j.fn.selectRange = function(start, end) {
        if(!end) end = start; 
        return this.each(function() {
            if (this.setSelectionRange) {
                this.focus();
                this.setSelectionRange(start, end);
            } else if (this.createTextRange) {
                var range = this.createTextRange();
                range.collapse(true);
                range.moveEnd('character', end);
                range.moveStart('character', start);
                range.select();
            }
        });
    };

    // Will be called on a keyUp event inside the tinyMCE editor 
    EEXCESS.extractTerm = function(ed, e) {
        var text  = ed.getContent();
        
        if(eval("/" + EEXCESS.trigger.marker + ".+" + EEXCESS.trigger.closingTag + "/").test(text)) { // Tests if the text contains #eexcess:keywords#
            var terms = getTerms(text, true, true);
                        
            if(terms != null) {
                EEXCESS.recommendationData.terms = terms;
                getRecommendations(EEXCESS.recommendationData);
                var cursorPosition = getCurserPosition(ed);
                var cleanedContent = text.substring(0, cursorPosition - 1) + text.substring(cursorPosition, text.length);
                cleanedContent = cleanedContent.replace(EEXCESS.trigger.marker, "").replace('<p>', "").replace("</p>", "");
                ed.setContent(cleanedContent);
                // setting the cursor position
                setCursorPosition(ed, cursorPosition - EEXCESS.trigger.marker.length - EEXCESS.trigger.closingTag.length);
            }
        }
    };

    // Observe the post title
    $j(document).on("change", "input[name='post_title']", function() {
        // get recommendations from title
        EEXCESS.recommendationData.terms = [$j(this).val().trim()];
        getRecommendations(EEXCESS.recommendationData);
    });
    
    // Observe the text editor
    $j(document).on("keyup", "textarea#content", function(e) {
        var text  = $j(this).val();
        var regex = eval("/" + EEXCESS.trigger.marker + ".+" + EEXCESS.trigger.closingTag + "/");
        if(regex.test(text)) { // Tests if the text contains #eexcess:keywords#
            var terms = getTerms(text, false, true);
        
            if(terms != null) {
                EEXCESS.recommendationData.terms = terms; 
                getRecommendations(EEXCESS.recommendationData);
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
    })
    
    // Triggers the recommendations call by button
    $j(document).on("mousedown", "#getRecommendations", function(event) {
        event.preventDefault();
        var text = "";
        
        // Casual TextEditor
        if (window.getSelection) { 
            // Check if the textarea was selected
            if(window.getSelection().focusNode != null && window.getSelection().focusNode.className == "wp-editor-container") {
                text = window.getSelection().toString();
            }
        } 
        
        // Visual Editor
        if(text == "" && tinyMCE.activeEditor && tinyMCE.activeEditor.isHidden() == false) { 
            text = tinyMCE.activeEditor.selection.getContent( {format : "text"} );
        }
        
        if(text != "") {
            $j('.error').remove();
            EEXCESS.recommendationData.terms = getTerms(text, false, false);
            getRecommendations(EEXCESS.recommendationData);
        } else {
            displayError(EEXCESS.errorMessages.noTextSelected, $j("#getRecommendations"));
        }
    });
    
    /**
     * Inserts a div that contains an error message after a given element.
     *
     * @param msg The error message to display.
     * @param element The element after which to display the error.
     */
    function displayError(msg, element) {
        // Removing previously added error messages
        $j(".error").remove();
        var div = $j('<div class="error">' + msg + '</div>');
        $j(element).after(div);
    }
    
    /**
     * Extracting the terms from the text.
     *
     * @param {String} The text written by the user
     * @param {Boolean} Indicates if the user uses the visual editor
     *
     * @return {Array|null} Returns a list of terms or null, if no marker was found
     */
    function getTerms(content, visualEditor, marker) {
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
            
            
            var results = content.match(/("[^"]+"|[^"\s]+)/g);
            

            if(marker) {
                // Slicing the results array according to the textSpan option defined in the EEXCESS.trigger object
                results = results.slice(results.length - EEXCESS.trigger.textSpan);
                for(var i = 0; i < results.length; i++) {
                    // removing the marker from the result
                    if(results[i].indexOf(EEXCESS.trigger.marker) > -1) {
                        results[i] = results[i].substring(EEXCESS.trigger.marker.length);      
                    } else if(results[i].indexOf("") > -1) {
                        results[i] = results[i].substring(0, results[i].length - 1);  
                    }
                }
            }
            // Removing punctuation marks from the result
            for(var i = 0; i < results.length; i++) {
                results[i] = results[i].replace(/[\.,#-\/!$%\^&\*;:{}=\-_`~()]/g,"");
            }
            
            return results;
        }
        
        return null;
    };

    function getRecommendations(data) {
        var container = $j("#eexcess_container .inside #content");
        
        container.html("<div class='eexcess-spinner'></div>");
        
        // since 2.8 ajaxurl is always defined in the admin header and points to admin-ajax.php
        $j.post(ajaxurl, data, function(response) {
            if(response) {
                // parsing the JSON string
                var o = JSON.parse(response);

                // Using Handlebars.js to compile the template. See http://handlebarsjs.com/ for documentation.
                var template = Handlebars.compile($j("#list-template").html());
                var list = $j(template(o));

                var usePagination = list.find("#eexcess-recommendationList li").length > 10;

                if(usePagination) {
                    // show only the first x items
                    list.find("#eexcess-recommendationList li").hide().slice(0, EEXCESS.pagination.items).show();        
                }
                
                // display the list
                container.html(list);

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
                container.html(EEXCESS.errorMessages.noRecommandations);
            }
        });
    };

    function getCurserPosition(editor) {
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
    }; 

    function setCursorPosition(editor, index) {
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
});