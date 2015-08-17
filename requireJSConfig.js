requirejs.config({
   baseUrl: plugin_url + 'js',
   paths: {
      jquery: 'lib/jquery',
      APIconnector: 'lib/c4/APIconnector',
      iframes: 'lib/c4/iframes'
   }
});

require(['resultList']);
