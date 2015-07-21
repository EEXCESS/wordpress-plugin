// Plugin options object
var EEXCESS = {
   "trigger" : { // the options needed for triggering a recommendation
      "marker" : "#eexcess:", // this marker signals the listener to get recommendations
      "closingTag" : "#", // #eexcess:keywords#
      "textSpan" : 2 // the amount of words send
   },
   "recommendationData" : { // The object for the ajax call
      "recommendation_action" : "get_recommendations", // serverside function for recommendation
      "get_details_action" : "get_details", // serverside function for geteDetails
      "terms" : [], // the keywords
      "trigger" : "default" //the trigger that started the recommendation workflow
   },
   "pagination" : { // Settings for the paginaton
      "items" : 10, // The amount of items per page,
      "textColor" : "#79B5E3", // Color of the text/numbers
      "textHoverColor" : "#2573AF", // Border color when hovering
      "display" : 10, // How many page numbers should be visible
      "start" : 1, // With which number the visible pages should start
      "backgroundColor" : "none", // Background color
      "backgroundHoverColor" : "none", // Background color when hovering
      "border" : false, // If there should be a border (true/false)
      "images" : false, // If the arrows should be images or not (true/false)
      "mouse" : "press" //  With value “press” the user can keep the mouse button pressed and the page numbers will keep on sliding. With value “slide” the page numbers will slide once with each click.
   },
   "errorMessages" : {
      "noRecommandations" : "An error has occured.",
      "noTextSelected" : "Please select some text.",
      "resourceAlreadyInserted" : "This Resource has already been cited. Do you want to cite it again?"
   },
   "keyboardBindungs" : {
      "getRecommendations" : 69 // Javascript keyCode for 'e' see http://www.mediaevent.de/javascript/Extras-Javascript-Keycodes.html
   },
   "recommendationListSettings" : {
      "imageWidth" : 75,  //Width of images in the recommendation list
      "imageHeight" : 78 //Heigth of images in the recommendation list
   },
   "citeproc" : {
      "stylesDir" : "js/lib/citationStyles/",
      "localsDir" : "js/lib/locales/",
      "errorMsg"  : "Insertion into the citationarea is prohibited"
   }
};
