requirejs.config({
   baseUrl: plugin_url + 'js',
   paths: {
      jquery: 'lib/jquery',
      APIconnector: 'lib/c4/APIconnector',
      iframes: 'lib/c4/iframes',
      recommendationEvents: 'recommendationEvents',
      recommendationEventsHelper: 'recommendationEventsHelper',
      uiEventsHelper: 'uiEventsHelper',
      settings: 'settings'
   }
});

require(['resultList', 'recommendationEvents', 'uiEventsHelper']);
