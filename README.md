![EEXCESS](http://eexcess.eu/wp-content/uploads/2013/04/eexcess_Logo_neu1.jpg "EEXCESS")

## Installation
There are two options to setup this plugin:

1. This option is recommended if you want to use this plugin in a productive environment. Download the EEXCESS-wordpress-plugin from [here](https://github.com/EEXCESS/wordpress-plugin.git) and install it to your wordpress distribution (i.e. copy it into a subdirectory of your plugin Directory (default <WP-Root>/wp-Content/plugins). For a more detailed guide please visit http://codex.wordpress.org/Managing_Plugins.

2. The second option is aimed at developers and is experimental. It is bases on [Vagrant](https://www.vagrantup.com/) and, therefor, assumes that you have a working Vagrant installation on your computer. If this is not the case, refer to [this](https://docs.vagrantup.com/v2/installation/index.html) page.
   * Clone the repository:  `git clone https://github.com/EEXCESS/wordpress-plugin.git`
   * `cd` into the `vagrant` directory that resides in the newly created directory.
   * Than type `vagrant up`. This will take some minutes.
   * Now visit `http://localhost:8888/wordpress/wp-login.php` with your favorite browser.
   * Use `user` and `secret` to log in.
   * done

## Getting started
1. Activate the plugin on your wordpress plugin page.
2. To use the EEXCESS-wordpress-plugin create / edit a post. Inside the text editor you can get recommendations by simple select the text and click the `Get Recommendation`-button inside the EEXCESS area beneath the editor or by pressing the keyboard shortcut `CTRL+E`. An alternative to this method is, to write #eexcess:keyword# or multiple keywords with `#eexcess:keyword1 keyword2#` (e.g. `#eexcess:Munic Bavaria#`). The plugin will automatically strip the keyword from this phrase and try to get recommendations for the given keyword. If you wish to link to one of the recommended resources, position your cursor at the position where you want the reference to appear. Then select your preferred citation style and push the `add` button of the corresponding recommendation.

## Settings
If you take a look inside the js folder of the plugin, you'll see a javascript file called `eexcess-settings.js`. This file contains the plugin options object, which allows you to configure the main settings of the plugin, e.g. pagination or the keycodes for triggering the recommendations request after type `#eexcess:keyword#`. At the moment the content looks like this:

```javascript
var EEXCESS = {
   "trigger" : { // the options needed for triggering a recommendation
      "marker" : "#eexcess:", // this marker signals the listener to get recommendations
      "closingTag" : "#", // #eexcess:keywords#
      "textSpan" : 2 // the amount of words send
   },
   "recommendationData" : { // The object for the ajax call
      "action" : "get_recommendations", // serverside function
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
      "noRecommandations" : "No Recommendations found.",
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
      "stylesDir" : "js/lib/citeproc-js/citionStyles/",
      "localsDir" : "js/lib/citeproc-js/locales/",
      "errorMsg"  : "Insertion into the citationarea is prohibited"
   }
```
