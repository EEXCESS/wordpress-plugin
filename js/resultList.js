// load dependencies
require(['jquery', 'APIconnector', 'iframes', 'citationBuilder', 'eexcessMethods', 'impromptu'], function($, api, iframes, citationBuilder, eexcessMethods, impromptu) {
    // set the URL of the federated recommender to the stable server
    // api.init({url: 'http://eexcess.joanneum.at/eexcess-privacy-proxy/api/v1/recommend'});


   eexcessMethods = eexcessMethods($("#eexcess_container .inside #content .eexcess-spinner"),
            $("#eexcess_container .inside #content #list"),
            $("#eexcess_container .inside #content p"),
            $('#abortRequest'),
            $('#citationStyleDropDown'),
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
         * Here, we are only interested in ratings that might have been given in one of the included widgets.
         * For the full list of possible events, see the readme in the root folder.
         */
        if (msg.data.event && msg.data.event === 'eexcess.rating') {
            console.log('The resource: ' + msg.data.data.uri + ' has been rated with a score of ' + msg.data.data.score);
        }

        /*
         * This signal is sent after the user hit a citation button.
         */
        if (msg.data.event && msg.data.event === 'eexcess.citationRequest') {
            api.getDetails([msg.data.documentsMetadata.documentBadge], function(response){
                if(response.status === 'success'){
                   var record = response.data.documentBadge[0];
                   citationBuilder.addAsCitation(record);
                } else if(response.status === 'error'){
                   alert("Could not retrieve data required to asseble the citation");
                } else {

                }
            });
        }

        /*
         * This signal is sent after the user hit a citation as image button.
         */
        if (msg.data.event && msg.data.event === 'eexcess.imageCitationRequest') {
           var imageURL = msg.data.documentsMetadata.previewImage,
           title = msg.data.documentsMetadata.title,
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
        }


        if (msg.data.event && msg.data.event === 'eexcess.linkImageClicked') {
           console.log("up 'n' runnin. image clicked.");
        }

        if (msg.data.event && msg.data.event === 'eexcess.linkItemClicked') {
            hideThickbox();
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

    /*
     * When the iframe is completly loaded, send a message to add buttons
     */
    function registerButtons(){
        // cite as citation button
        iframes.sendMsg({
            event: 'eexcess.registerButton.perResult',
            html: '<div style="float: right; padding-top: 6px;"><img data-method="eexcess.citationRequest" alt="Cite as citation" src="' + plugin_url + 'images/Wordpress_Cite_Button_Inactive_24.png' + '"></div>',
            responseEvent: 'eexcess.citationRequest'
        }, 
        ['resultList']);
         
        // cite as image button
        iframes.sendMsg({
            event: 'eexcess.registerButton.perResult',
            html: '<div style="float: right; padding-top: 6px;"><img data-method="eexcess.imageCitationRequest" alt="Cite as image" src="' + plugin_url + 'images/Thumbnails_EECXESS_Inactive_24.png' + '"></div>',
            responseEvent: 'eexcess.imageCitationRequest'
        }, 
        ['resultList']);
    }

    function hideThickbox(){
        $("#TB_window").hide("fast");
        //$("#TB_overlay").hide("fast");
        $("body").removeClass('modal-open');
        $("body").animate({
              scrollTop: $("#wp-content-editor-container").offset().top
        }, 500);
        $("#mceu_29").css("z-index", $("#TB_overlay").css("z-index") + 1);
    }
    function showThickbox(){
        $("#TB_window").show("fast");
        $("#TB_overlay").show("fast");
    }
});
