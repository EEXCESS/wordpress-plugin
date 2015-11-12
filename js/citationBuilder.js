define(['jquery', 'eexcessMethods', 'CLSWrapper', 'settings'], function($, eexcessMethods, CLSWrapper, settings){
   
   /*
    * Handles the "Add as Citation" buttons in the recommendation area. It adds citations
    * to the text, depending on the value of the citation style drop down element
    */
   function addAsCitation(record, hyperlink){
      var citationStyle = this.getStyle(),
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

      var url = record.uri || "",
      title = record.detail.eexcessProxy.dctitle || "";

      if(hyperlink){
         var searchQuery = sessionStorage["eexcess.lastSearchQuery"];
         var insertionPosition = eexcessMethods.determineDecentInsertPosition(content, position);
         var newText = eexcessMethods.pasteLinkToText(content, insertionPosition, url, title, searchQuery);
      } else {
         // if this entry has already been cited. warn the user, ask if he/she wants to continue
         // and act accordingly
         var curRef = $("#content_ifr").contents().find('p[data-eexcessid="' + record.id + '"]')
         if(curRef.length > 0){
            if (confirm(settings.errorMessages.resourceAlreadyInserted) == true) {
               // carry on, as the user ordered
               alreadyCited = curRef.attr("data-eexcessrefid");
               position = eexcessMethods.determineDecentInsertPosition.call(eexcessMethods,
                                                                            content,
                                                                            position);
               referenceNumberText = generateReference(alreadyCited);

               // -1 is the value of posFirstCitation, if no citation has been inserted.
               if(position > posFirstCitation && posFirstCitation != -1){
                  alert(settings.citeproc.errorMsg);
               } else {
                  newText = eexcessMethods.insertIntoText(content, position, referenceNumberText);
               }
            } else {
               // insertion rejected
               return;
            }
         }else{
            citationText = CLSWrapper(mapEEXCESSFormat(record));
            if(citationText.hasOwnProperty("length")){
               if(citationText.length > 0){
                  citationText = citationText[0];
               }
            }
            // When no year is denoted, CLSWrapper inserts (n.d.). This is removed here
            citationText = citationText.replace(" (n.d.).", "");

            citationText = '<p class="csl-entry" data-eexcessId="' + record.id  + '">' + citationText + "</p>";
            citationText = $(citationText).attr("contenteditable", "false")[0].outerHTML;

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
            citationText = $(citationText).attr("data-eexcessrefid", citations + 1)[0].outerHTML;
            referenceNumberDestination = "[<span id=\"eexcess" + (citations + 1).toString() + "\" class=\"refid\">" + (citations + 1).toString() + "</span>]";

            position = eexcessMethods.determineDecentInsertPosition.call(eexcessMethods, content, position);

            citationText = $(citationText).html(referenceNumberDestination + $(citationText).html())[0].outerHTML;
            url = citationText.match(/((https?:\/\/)?[\w-]+(\.[\w-]+)+(:\d+)?(\/\S*)?)/g);
            if(url != null){
               for(var i=0; i<url.length; i++){
                  citationText = citationText.replace(url[i], '<a href="' + url[i] + '" target=\"_blank\">' + url[i] + '</a>');
               }
            }

            // -1 is the value of posFirstCitation, if no citation has been inserted.
            if(position > posFirstCitation && posFirstCitation != -1){
               alert(settings.citeproc.errorMsg);
            } else {
               // insert reference # into text (at cursor position)
               newText = eexcessMethods.insertIntoText(content, position, referenceNumberSource);
               // append the reference itself
               newText = eexcessMethods.insertIntoText(newText,
                                        eexcessMethods.determineArticlesEnd(newText, eexcessMethods.findHtmlTagPositions(newText)),
                                        citationText);
            }
         }
      }
      eexcessMethods.setContent(newText);
   };

   /**
    * Maps the EEXCESS response format to the format required by citeprocJS
    *
    * @param record: An object containing data in the EEXCESS format
    * @return: The citeprocJS compatible object
    */
   function mapEEXCESSFormat(record){
      var creator = record.detail.eexcessProxy.dccreator || "",
      collectionName = record.detail.eexcessProxy.edmCollectionName || "",
      year = record.detail.eexcessProxy.dctermsdate || "",
      id = record.id || "",
      title = record.detail.eexcessProxy.dctitle || "",
      uri = record.uri || "";

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
      return JSON.parse(json);
   }


   function generateReference(number){
      number = number.toString();
      return "<a href=\"#eexcess" + number + "\"><span class=\"eexcessRef\" contenteditable=\"false\" data-eexcessrefid=\"" +
         number + "\">[" + number + "]</span></a>"
   }

   /**
    * Stores the the last chosen citation style of a blog post into 
    * the blog post inself.
    *
    * @param newStyle: String that represents the style
    */
   function setStyle(newStyle){
      var content = $(eexcessMethods.getContent()),
      style = content.first().find("#citationStyle");
      if(style.length == 0){
         content.first().append("<span id='citationStyle' data-style='" + newStyle + "' style='display: none;'></span>");
      } else {
         style.attr("data-style", newStyle);
      }
      eexcessMethods.setContent($("<p>").append(content).html());
   }

   /**
    * Returns the last chosen citation style
    *
    * @return: The style if valid, null otherwise
    */
   function getStyle(){
      var content = $(eexcessMethods.getContent()),
      style = content.first().find("#citationStyle").attr("data-style");
      if(typeof(style) === "string" && style.length > 0){
         return style;    
      } else {
         return null;
      }
      
   }

   return {
      addAsCitation: addAsCitation,
      setStyle: setStyle,
      getStyle: getStyle 
   }
});
