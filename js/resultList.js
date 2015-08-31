// load dependencies
require(['jquery', 'APIconnector', 'iframes', 'citationBuilder', 'eexcessMethods'], function($, api, iframes, citationBuilder, eexcessMethods) {
    // set the URL of the federated recommender to the stable server
    // api.init({url: 'http://eexcess.joanneum.at/eexcess-privacy-proxy/api/v1/recommend'});


   eexcessMethods = eexcessMethods($("#eexcess_container .inside #content .eexcess-spinner"),
            $("#eexcess_container .inside #content #list"),
            $("#eexcess_container .inside #content p"),
            $('#abortRequest'),
            $('#citationStyleDropDown'),
            $('#searchQueryReflection'));

    // helper method to avoid duplicated code
    var query_PP = function(profile) {
        /*
         * Send a request to the EEXCESS privacy proxy, using the function provided by the "APIconnector"-module from the c4 repository.
         * A callback function is specified, that takes the request's response data as input. The response consists of an attribute "status", that 
         * indicates the status of the request (either "success" or "error") and the corresponding data in the "data" attribute.
         */
        api.query(profile, function(res) {
            if (res.status === 'success') {
                /*
                 * If the request was successful, inform all embedded iframes about the success and provide the corresponding data.
                 * For the full list of events, which may be supported by the widgets see the readme in the root folder.
                 */
                iframes.sendMsgAll({event: 'eexcess.newResults', data: {profile: profile, results: {results: res.data.result}}});
            } else {
                /*
                 * If the request was not succesful, inform all embedded iframes about the error and provide the corresponding data.
                 */
                iframes.sendMsgAll({event: 'eexcess.error', data: res.data});
            }
        });
    };

    // retrieve details
    var detailsCall = function(items) {
        var xhr = $.ajax({
            url: 'http://eexcess-dev.joanneum.at/eexcess-privacy-proxy-1.0-SNAPSHOT/api/v1/getDetails',
            data: JSON.stringify(items),
            type: 'POST',
            contentType: 'application/json; charset=UTF-8',
            dataType: 'json'
        });
        xhr.done(function(response) {
            console.log(response);
            iframes.sendMsgAll({event: 'eexcess.detailsResponse', data: response});
        });
        xhr.fail(function(jqXHR, textStatus, errorThrown) {
            console.log(jqXHR);
            console.log(textStatus);
            console.log(errorThrown);
        });
    };

    // handle form submit
    $('#submit').on("click", function(evt) {
        evt.preventDefault();

        /*
         * Construct an EEXCESS profile in the format described at https://github.com/EEXCESS/eexcess/wiki/json-exchange-format#request-format.
         * At this point, we only fill the absolute minimal set of required attributes, namely "contextKeywords", which basically represent a query.
         * NOTE: splitting of query terms has been omitted here for simplicity reasons.
         */
        var profile = {contextKeywords: [{
                    text: $('#query').val(),
                    weight: 1.0
                }]};

        /*
         * Send a message to all iframes embedded in this window, using the function provided by the "iframes"-module from the c4 repository.
         * The message informs all embedded iframes, that a query has been triggered by some component and also includes the associated profile.
         * For the full list of events, which may be supported by the widgets see the readme in the root folder.
         */
        iframes.sendMsgAll({event: 'eexcess.queryTriggered', data: profile});

        query_PP(profile); // send the request
    });

    /*
     * Listen for message from the embedded iframes.
     */
    window.onmessage = function(msg) {
        /*
         * Broadcast messages to all embedded iframes
         */
        iframes.sendMsgAll(msg.data);

        /*
         * Listen for query events triggered by one of the embedded iframes and pass the query to the server
         */
        if (msg.data.event && msg.data.event === 'eexcess.queryTriggered') {
            query_PP(msg.data.data);
        }
        
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
        if (msg.data.event && msg.data.event === 'eexcess.citationRequsted') {
            api.getDetails([msg.data.documentBadge], function(response){
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
            html: '<div style="float: right; padding-top: 6px;"><img data-method="eexcess.citationRequest" alt="Cite as citation" src="' + plugin_url + 'images/Sketch-Book-icon.png' + '"></div>',
            responseEvent: 'eexcess.citationRequest'
        }, 
        ['resultList']);
         
        // cite as image button
        iframes.sendMsg({
            event: 'eexcess.registerButton.perResult',
            html: '<div style="float: right; padding-top: 6px;"><img data-method="eexcess.imageCitationRequest" alt="Cite as image" src="' + plugin_url + 'images/Sketch-Book-icon.png' + '"></div>',
            responseEvent: 'eexcess.imageCitationRequest'
        }, 
        ['resultList']);
    }
});
