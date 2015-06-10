// Avoid jQuery conflicts from different plugins
$j = jQuery.noConflict();

/*
 * The Citation Processor is a wrapper for the citeproc-js library.
 * It simplifies the use of citeproc-js and is implemented in
 * pseudo-class style.
 */
var CITATION_PROCESSOR = function(){
   var locals,
   style,
   citations,
   citeprocSys;

   /*
    * The init-function is responsible for the communication with the
    * outer world.
    * @param locals: the path to a location xml-file. example:
    * https://bitbucket.org/fbennett/citeproc-js/src/01429717257da70cb8cef6dccbde51fdf6fa763d/demo/locales-en-US.xml?at=default
    * @param style: the path to a style csl-file. >7.000 file can be found here: https://zotero.org/styles
    * @param citations: A JSON-like object containing the information to be cited.
    */
   init = function(locals, style, citations){
      this.locals = getFile(locals);
      this.style = getFile(style);
      this.citations = citations;

      // Initialize a system object, which contains two methods needed by the
      // engine.
      citeprocSys = {
         context: this,
         // The lang parameter is not used, but still requiered, since CLS.Eninge
         // will call this functions including this parameter.
         retrieveLocale: function (lang){
            return this.context.locals;
         },
         retrieveItem: function(id){
             return this.context.citations[id];
         }
      };
   }

   /*
    * Fetches and returns the content of a file. Since javascript is not able
    * to handle files natively, this functions relies on a webserver to serve
    * the file. Therefore the root of the path corresponds to the webservers root.
    * @param path: a string containing the path to file to be opened.
    */
   getFile = function(path){
      var request = $j.ajax({
         type: "GET",
         url: path,
         async: false,
      });
      if(request.status == 200){
         return request.responseText;
      }else{
         return null;
      }
   },

   /*
    * Given the identifier of a CSL style, this function instantiates a CSL.Engine
    * object that can render citations in that style.
    * @param context: context must contain a serialized csl-file.
    */
   getProcessor = function(context) {
      var citeproc = null;
      if(context.style != null){
         citeproc = new CSL.Engine(citeprocSys, context.style);
      }
      return citeproc;
   };

   /*
    * This renders the citation-object and returs it. Thus, it is, beside the init-
    * function, the only publicly-accessable function. It returns an HTML-containing
    * string.
    */
   renderCitations = function() {
      var citeproc = getProcessor(this);
      if(citeproc != null){
         var itemIDs = [];
         for (var key in this.citations) {
            itemIDs.push(key);
         }
         citeproc.updateItems(itemIDs);
         var bibResult = citeproc.makeBibliography();
         return bibResult[1].join('\n');
      }
   };

   return{
      init: init,
      renderCitations: renderCitations,
   }
}
