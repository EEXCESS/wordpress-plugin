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
      eexcessMethods: 'eexcessMethods',
      bootstrap: 'lib/bootstrap.min',
      "peas/peas_indist": "lib/peas/peas_indist",
      "peas/util": "lib/peas/util",
      graph: "lib/peas/bower_components/graph/lib/graph",
      hashCode: "hashCode",
      initialize: "initialize"
   }
});

require(['resultList', 'recommendationEvents', 'uiEventsHelper', 'bootstrap', 'hashCode', 'initialize']);
