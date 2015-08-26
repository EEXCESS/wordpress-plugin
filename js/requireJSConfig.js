requirejs.config({
   baseUrl: plugin_url + 'js',
   paths: {
      jquery: 'lib/jquery',
      APIconnector: 'lib/c4/APIconnector',
      iframes: 'lib/c4/iframes',
      recommendationEventsHelper: 'recommendationEventsHelper',
      uiEventsHelper: 'uiEventsHelper',
      settings: 'settings',
      citationBuilder: 'citationBuilder',
      CLSWrapper: 'lib/c4/CitationBuilder/CitationBuilder/citationBuilder',
      eexcessMethods: 'eexcessMethods'
   }
});

require(['resultList', 'recommendationEvents', 'uiEventsHelper']);
