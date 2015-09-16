define(['jquery', 'APIconnector', 'iframes', 'settings', 'uiEventsHelper'], function($, api, iframes, settings, uiEventsHelper){
   return {
      /**
       * Extracts text marked by the user and sends it to the recommender.
       * The UI is updated accordingly.
       */
      getTextAndRecommend: function() {
         var query = this.getSelectedText();
         if(query !== ""){
            var profile = {contextKeywords: [{
               text: query,
               weight: 1.0
            }]};
            iframes.sendMsgAll({event: 'eexcess.queryTriggered', data: profile});
            this.sendQuery(profile); // send the request
         }
         uiEventsHelper.queryTriggered(query);
      },

      /**
       * Sends a profil (including a searchterm) to the recommender. 
       */
      sendQuery : function(profile) {
        api.query(profile, function(res) {
            if (res.status === 'success') {
                var res = {profile: profile, result: res.data.result};
                $('iframe#dashboard').load(function(){
                // initializing vis dashboard
                iframes.sendMsgAll({event: 'eexcess.newDashboardSettings', settings: {
                    //selectedChart: 'geochart',
                    hideCollections: true,
                    showLinkImageButton: true,
                    showLinkItemButton: true
                }});
                   iframes.sendMsgAll({event: 'eexcess.newResults', data: res});
                   sessionStorage.setItem("curResults", JSON.stringify(res));
                });
                iframes.sendMsgAll({event: 'eexcess.newResults', data: res});
            } else {
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
