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

    // Will be called on a keyUp event inside the tinyMCE editor 
    EEXCESS.extractTerm = function(ed, e) {
        if(jQuery.inArray(e.which, EEXCESS.trigger.keyCodes) != -1) {
            var terms = getTerms(ed.getContent(), true, true);

            if(terms != null) {
                EEXCESS.recommendationData.terms = terms;
                getRecommendations(EEXCESS.recommendationData);
                var cleanedContent = ed.getContent().replace(EEXCESS.trigger.marker, "");
                ed.setContent("");
                ed.selection.setContent($j(cleanedContent).html());
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
        if(jQuery.inArray(e.which, EEXCESS.trigger.keyCodes) != -1) {
            var terms = getTerms($j(this).val(), false, true);
            
            if(terms != null) {
                EEXCESS.recommendationData.terms = terms; 
                getRecommendations(EEXCESS.recommendationData);
            }
            
            $j(this).val($j(this).val().replace(EEXCESS.trigger.marker, ""));
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
                // removing the marker from the result
                results[results.length - 1] = results[results.length - 1].substring(EEXCESS.trigger.marker.length);
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
});