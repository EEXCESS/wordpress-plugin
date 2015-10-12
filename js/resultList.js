// load dependencies
require(['jquery', 'APIconnector', 'iframes', 'citationBuilder', 'eexcessMethods'], function($, api, iframes, citationBuilder, eexcessMethods) {
    // set the URL of the federated recommender to the stable server
    // api.init({url: 'http://eexcess.joanneum.at/eexcess-privacy-proxy/api/v1/recommend'});


   eexcessMethods = eexcessMethods($("#eexcess_container .inside #content .eexcess-spinner"),
            $("#eexcess_container .inside #content #list"),
            $("#eexcess_container .inside #content p"),
            $('#abortRequest'),
            $('#searchQueryReflection'));

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
              alert("The image was successfully added to the blog post");
           });
        }

        /*
         * This signal is sent from the resultlist after the user hit a citation as image button.
         */
        if (msg.data.event && msg.data.event === 'eexcess.imageCitationRequest') {
           embedImage(msg.data.documentsMetadata.title, msg.data.documentsMetadata.previewImage, function(){
              alert("The image was successfully added to the blog post");
           });
        }
        
        /*
         * This signal is sent from the dashboaord after the user hit a citation as image button.
         */
        if (msg.data.event && msg.data.event === 'eexcess.linkImageClicked') {
           embedImage(msg.data.data.title, msg.data.data.previewImage, function(){
              alert("The image was successfully added to the blog post");
           });
        }

        /*
         * This signal is sent from the dashboaord after the user hit a citation button.
         */
        if (msg.data.event && msg.data.event === 'eexcess.linkItemClicked') {
            hideThickbox(msg.data.data, function(){
              alert("The citation was successfully added to the blog post");
           });
        }
        
        /*
         * This signal is sent from the resultlist after the user clicked the "insert hyperlink"-button.
         */
        if (msg.data.event && msg.data.event === 'eexcess.hyperlinkInsertRequest') {
            insertCitation([msg.data.documentsMetadata.documentBadge], true, function(){
              alert("The hyperlink was successfully added to the blog post");
           });
        }

        /*
         * Registers custom buttons after the iframe has signaled, that the msg listeners are in place
         */
        if (msg.data.event && msg.data.event === 'eexcess.msgListenerLoaded') {
           // registers buttons if iframe loads second
           registerButtons();
        }
    };
    // registers buttons if iframe loads first
    registerButtons();


    function embedImage(title, imageURL, callback){
        var snippet = "<a title='" + title + "' href='" + imageURL + "' target='_blank'><img src='" + imageURL + "'/></a>",
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
             api.getDetails(documentBadges, function(response){
                if(response.status === 'success' && response.data.documentBadges.length > 0){
                   var record = response.data.documentBadges[0];
                   citationBuilder.addAsCitation(record, hyperlink);
                   if(typeof(callback) === "function"){
                      callback();
                   }
                } else if(response.status === 'error'){
                   alert("Could not retrieve data required to asseble the citation");
                } else {

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
});
