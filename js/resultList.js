(function(require, define){
   // load dependencies
   require(['jquery', 'iframes', 'citationBuilder', 'eexcessMethods', "APIconnector"], function($,  iframes, citationBuilder, eexcessMethods, api) {

       /*
        * Listen for message from the embedded iframes.
        */
       window.onmessage = function(msg) {
           /*
            * Broadcast messages to all embedded iframes
            */
           iframes.sendMsgAll(msg.data);

           /*
            * Listen for details requests
            */
           if (msg.data.event && msg.data.event === 'eexcess.detailsRequest') {
               detailsCall(msg.data.data);
           }

           /*
            * This signal is sent from the resultList after the user hit a citation button.
            */
           if (msg.data.event && msg.data.event === 'eexcess.citationRequest') {
               insertCitation([msg.data.documentsMetadata.documentBadge], false, function(){
                 alert("The citation was successfully added to the blog post");
                 var context = compileContextInformation(msg.data.documentsMetadata.documentBadge.uri);
                 api.sendLog("itemCitedAsText", context);
                 
                 // activate "delete citations" button
                 tinyMCE.activeEditor.buttons["Delete_Citations_Button"].enable();
              });
           }

           /*
            * This signal is sent from the resultlist after the user hit a citation as image button.
            */
           if (msg.data.event && msg.data.event === 'eexcess.imageCitationRequest') {
              embedImage(msg.data.documentsMetadata.title, msg.data.documentsMetadata.previewImage, function(){
                 alert("The image was successfully added to the blog post");
                 var context = compileContextInformation(msg.data.documentsMetadata.documentBadge.uri);
                 api.sendLog("itemCitedAsImage", context);
                 
                 // activate "delete citations" button
                 tinyMCE.activeEditor.buttons["Delete_Citations_Button"].enable();
              });
           }
           
           /*
            * This signal is sent from the dashboaord after the user hit a citation as image button.
            */
           if (msg.data.event && msg.data.event === 'eexcess.linkImageClicked') {
              embedImage(msg.data.data.title, msg.data.data.previewImage, function(){
                 alert("The image was successfully added to the blog post");
                 var context = compileContextInformation(msg.data.documentsMetadata.documentBadge.uri);
                 api.sendLog("itemCitedAsImage", context);
              });
           }

           /*
            * This signal is sent from the dashboaord after the user hit a citation button.
            */
           if (msg.data.event && msg.data.event === 'eexcess.linkItemClicked') {
               hideThickbox(msg.data.data, function(){
                 alert("The citation was successfully added to the blog post");
                 var context = compileContextInformation(msg.data.documentsMetadata.documentBadge.uri);
                 api.sendLog("itemCitedAsText", context);
              });
           }
           
           /*
            * This signal is sent from the resultlist after the user clicked the "insert hyperlink"-button.
            */
           if (msg.data.event && msg.data.event === 'eexcess.hyperlinkInsertRequest') {
               insertCitation([msg.data.documentsMetadata.documentBadge], true, function(){
                 alert("The hyperlink was successfully added to the blog post");
                 var context = compileContextInformation(msg.data.documentsMetadata.documentBadge.uri);
                 api.sendLog("itemCitedAsHyperlink", context);
              });
           }

           /*
            * Registers custom buttons after the iframe has signaled, that the msg listeners are in place
            */
           if (msg.data.event && msg.data.event === 'eexcess.msgListenerLoaded') {
              // registers buttons if iframe loads second
              registerButtons();
           }


           /*
            * Bind logging handler to items in the result list
            */
           if (msg.data.event && msg.data.event === 'eexcess.resultListLoadingComplete') {
              if(eexcessMethods.loggingEnabled()){
                 $("#resultList").contents().find("#recommendationList a").click(function(e){
                    var url = $(this).attr("href");
                    if(typeof(url) === "string"){
                       var context = compileContextInformation(url)
                       api.sendLog("itemOpened", context);
                    } else {
                     throw new Error("Couldn't determine items's URL");
                    }
                 });
              }
           }
       };
       // registers buttons if iframe loads first
       registerButtons();

       /*
        * Gathers `origin`, `queryID` and `content.documentBadge` for 
        * logging events. https://github.com/EEXCESS/eexcess/wiki/EEXCESS---Logging
        * @param {string} url: URL of the item used in the current context
        */
       function compileContextInformation(url){
          var item = eexcessMethods.findResultByUrl(url),
          queryID = eexcessMethods.getQueryID(),
          context = {
             origin: eexcessMethods.originHeader.origin,
             queryID: queryID,
             content: {
                documentBadge: item.documentBadge
             }
          };
          return context;
       }

       function embedImage(title, imageURL, callback){
           var snippet = "<a title='" + title + "' href='" + imageURL + "' target='_blank'><img src='" + imageURL + "'/></a>",
           position = eexcessMethods.getCursor(),
           content = eexcessMethods.getContent();

           if(eexcessMethods.loggingEnabled()){
              try{
                 sendUsersActivitiesSignal("image_embedded", this);
              }catch(e){
                 console.log("Logging failed. Message was: " + e.message);
              }
           }

           var insertionPosition = eexcessMethods.determineDecentInsertPosition.call(eexcessMethods, content, position);
           var newText = eexcessMethods.insertIntoText(content, insertionPosition, snippet);
           eexcessMethods.setContent(newText);
           if(typeof(callback) === "function"){
              callback();
           }
       }

       /*
        * When the iframe is completly loaded, send a message to add buttons
        */
       function registerButtons(){
           // cite as image button
           iframes.sendMsg({
               event: 'eexcess.registerButton.perResult',
               html: '<div style="float: right; padding-top: 6px;"><img height="24" width="24" data-method="eexcess.imageCitationRequest" alt="Cite as image" src="' + plugin_url + 'images/insert_image.png' + '"></div>',
               responseEvent: 'eexcess.imageCitationRequest'
           }, 
           ['resultList']);

           // cite as citation button
           iframes.sendMsg({
               event: 'eexcess.registerButton.perResult',
               html: '<div style="float: right; padding-top: 6px;"><img height="24" width="24" data-method="eexcess.citationRequest" alt="Cite as citation" src="' + plugin_url + 'images/insert_citation.png' + '"></div>',
               responseEvent: 'eexcess.citationRequest'
           }, 
           ['resultList']);
            
           // insert hyperlink button 
           iframes.sendMsg({
               event: 'eexcess.registerButton.perResult',
               html: '<div style="float: right; padding-top: 6px;"><img height="24" width="24" data-method="eexcess.hyperlinkInsertRequest" alt="Insert hyperlink" src="' + plugin_url + 'images/insert_link.png' + '"></div>',
               responseEvent: 'eexcess.hyperlinkInsertionRequest'
           }, 
           ['resultList']);
            
       }

       function hideThickbox(res, callback){
           $("#TB_window").hide("fast");
           $("body").removeClass('modal-open');

           // scroll to editor
           $("body").animate({
                 scrollTop: $("#wp-content-editor-container").offset().top
           }, 500);
           

           // bring editor to foreground and hide the toolbar
           var tinymce = $('.mce-tinymce'),
           toolbar = tinymce.find('.mce-toolbar-grp');
           tinymce.css("z-index", $("#TB_overlay").css("z-index") + 1);
           toolbar.hide("slow");

           // unbind click event handler of the overlay so that the user can't leave the dialog
           $("#TB_overlay").unbind();

           // create "embed into blog post" dialog

           var ifrBody = $("#content_ifr").contents().find("body");
           ifrBody.click(function(e){
              if (confirm("Do you want to embed the citation at the location you just clicked?") == true) {
                  insertCitation([res.v2DataItem.documentBadge], false, callback);
                  restoreDashboard();
              } else {
                  x = "You pressed Cancel!";
                  restoreDashboard();
              } 
           });

       }

       function restoreDashboard(){
          var tinymce = $('.mce-tinymce'),
          toolbar = tinymce.find('.mce-toolbar-grp');

          $("#content_ifr").contents().find("body").unbind("click");
          $("#TB_window").show("fast");
          $("body").addClass('modal-open');
          tinymce.css("z-index", "auto");
          toolbar.show();
       }

       function showThickbox(){
           $("#TB_window").show("fast");
           $("#TB_overlay").show("fast");
       }

       function insertCitation(documentBadges, hyperlink, callback){
          if(Array.isArray(documentBadges) 
                && documentBadges.length > 0 
                && typeof(hyperlink) === 'boolean'){
             var cached = probeCache(documentBadges[0]);
             if(cached == null){
                eexcessMethods.fetchDetails(documentBadges, function(response){
                   if(response.status === 'success' && response.data.documentBadge.length > 0){
                      if(Array.isArray(response.data.documentBadge)){
                         var record = response.data.documentBadge;
                      } else {
                         var record = response.data.documentBadge[0];
                      }
                      citationBuilder.addAsCitation(record[0], hyperlink);
                      if(typeof(callback) === "function"){
                         callback();
                      }
                   } else if(response.status === 'error'){
                      alert("Could not retrieve data required to asseble the citation");
                   } else {
                      throw new Error("Received invalid data format");
                   }
                });
             } else {
                citationBuilder.addAsCitation(cached, hyperlink);
                if(typeof(callback) === "function"){
                   callback();
                }
             } 
          } else {
             throw new Error("The parameters you passed have invalid types.");
          }

       }

       function probeCache(documentBadge){
          var cache = JSON.parse(sessionStorage.getItem("curResults"));
          if(cache != null && cache.hasOwnProperty("result")){
             cache = cache.result;
             for(i=0; i<cache.length; i++){
                if(cache[i].documentBadge.id == documentBadge.id && cache[i].documentBadge.hasOwnProperty("detail")){
                   return cache[i].documentBadge;
                }
             }
             return null;
          } else {
             throw new Error("Invalid cache content");
          }
       }
   })
}(EEXCESS.require, EEXCESS.define));
