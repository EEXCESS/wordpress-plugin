define(['jquery', 'APIconnector', 'iframes', 'settings', 'uiEventsHelper'], function($, api, iframes, settings, uiEventsHelper){
   return {
      getTextAndRecommend: function() {
         /*
          * Construct an EEXCESS profile in the format described at 
          * https://github.com/EEXCESS/eexcess/wiki/json-exchange-format#request-format.
          * At this point, we only fill the absolute minimal set of required attributes, 
          * namely "contextKeywords", which basically represent a query.
          * NOTE: splitting of query terms has been omitted here for simplicity reasons.
          */
         var query = this.getSelectedText();
         var profile = {contextKeywords: [{
            text: query,
            weight: 1.0
         }]};
         
         uiEventsHelper.queryTriggered(query);
         /*
          * Send a message to all iframes embedded in this window, using the function 
          * provided by the "iframes"-module from the c4 repository.
          * The message informs all embedded iframes, that a query has been triggered 
          * by some component and also includes the associated profile.
          * For the full list of events, which may be supported by the widgets see the 
          * readme in the root folder.
          */
          iframes.sendMsgAll({event: 'eexcess.queryTriggered', data: profile});
          this.query_PP(profile); // send the request
      },

      // helper method to avoid duplicated code
      query_PP : function(profile) {
        /*
         * Send a request to the EEXCESS privacy proxy, using the function provided by 
         * the "APIconnector"-module from the c4 repository.
         * A callback function is specified, that takes the request's response data as 
         * input. The response consists of an attribute "status", that 
         * indicates the status of the request (either "success" or "error") and the 
         * corresponding data in the "data" attribute.
         */
        api.query(profile, function(res) {
            if (res.status === 'success') {
                /*
                 * If the request was successful, inform all embedded iframes about 
                 * the success and provide the corresponding data.
                 * For the full list of events, which may be supported by the widgets 
                 * see the readme in the root folder.
                 */
                iframes.sendMsgAll({event: 'eexcess.newResults', data: {profile: profile, results: {results: res.data.result}}});
            } else {
                /*
                 * If the request was not succesful, inform all embedded iframes about 
                 * the error and provide the corresponding data.
                 */
                iframes.sendMsgAll({event: 'eexcess.error', data: res.data});
            }
        });
      },

      /**
       * This functions is called when a keyup-event occurs either in the visal-editor
       * or in the text-editor. It checks whether a certain keystroke combo was used (e.g.
       * ctrl+e). If so, it returns true, otherwise false.
       * EEXCESS.keyboardBindungs.getRecommendations are used.
       *
       * @param keyPressed: the object that ist passed to an keylistener-eventhandler.
       */
      assessKeystroke : function(keyPressed){
         if (keyPressed.keyCode == settings.keyboardBindungs.getRecommendations
          && keyPressed.ctrlKey){
             return true;
         }
         return false;

      },
      
      /**
       * Returns text from the Wordpress texteditor selcted by the user 
       */
      getSelectedText : function(){
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
         return text;
      }
   };

});
