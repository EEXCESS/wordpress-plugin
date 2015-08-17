require(['jquery'], function($){
   
   /*
    * Handles the "Add as Image" buttons in the recommendation area. It adds Images
    * to the blogpost.
    */
   $(document).on("mousedown", 'input[name="addAsImage"]', function(){
      var imageURL = $(this).parent().prev().find("a").attr("href"),
      title = $(this).parent().find("a").text(),
      snippet = "<a title='" + title + "' href='" + imageURL + "' target='_blank'><img src='" + imageURL + "'/></a>",
      position = eexcessMethods.getCursor(),
      content = eexcessMethods.getContent();

      if(eexcessMethods.extendedLoggingEnabled()){
         try{
            sendUsersActivitiesSignal("image_embedded", this);
         }catch(e){
            console.log("Logging failed. Message was: " + e.message);
         }
      }

      var insertionPosition = eexcessMethods.determineDecentInsertPosition.call(eexcessMethods, content, position);
      var newText = insertIntoText(content, insertionPosition, snippet);
      eexcessMethods.setContent(newText);
   });


   /*
    * Handles the "Add as Citation" buttons in the recommendation area. It adds citations
    * to the text, depending on the value of the citation style drop down element
    */
   $(document).on("mousedown", 'input[name="addAsCitation"]', function(){
      var url =  $(this).siblings("a").attr('href'),
      title = $(this).siblings("a").text(),
      citationStyle = $('#citationStyleDropDown').val(),
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
         try{
            sendUsersActivitiesSignal("cited", this);
         }catch(e){
            console.log("Logging failed. Message was: " + e.message);
         }

      }

      if(citationStyle == "default"){
         var searchQuery = $("#searchQuery").text();
         var newText = eexcessMethods.pasteLinkToText(content, position, url, title, searchQuery);
      } else {
         // if this entry has already been cited. warn the user, ask if he/she wants to continue
         // and act accordingly
         if($(this).parent().hasClass("eexcess-alreadyCited")){
            if (confirm(EEXCESS.errorMessages.resourceAlreadyInserted) == true) {
               // carry on, as the user ordered
               alreadyCited = $(this).parent().attr("data-refnumb");
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
            citationText = CitationProcessor(JSON.parse(eexcessMethods.readMetadata(this)),
               eexcessMethods.getFile(pluginURL.pluginsPath + EEXCESS.citeproc.localsDir + 'locales-en-US.xml'),
               eexcessMethods.getFile(pluginURL.pluginsPath + EEXCESS.citeproc.stylesDir + citationStyle + '.csl'));
            if(citationText.hasOwnProperty("length")){
               if(citationText.length > 0){
                  citationText = citationText[0];
               }
            }

            citationText = '<p class="csl-entry">' + citationText + "</p>";
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
               $(this).parent().addClass('eexcess-alreadyCited').attr("data-refnumb", citations + 1);
            }
         }
      }
      eexcessMethods.setContent(newText);
   });
});
