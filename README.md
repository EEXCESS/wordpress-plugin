![EEXCESS](http://eexcess.eu/wp-content/uploads/2013/04/eexcess_Logo_neu1.jpg "EEXCESS") 

## Quickstart

1. Download the EEXCESS-wordpress-plugin from TBD and install it to your wordpress distribution. For an installation guide please visit http://codex.wordpress.org/Managing_Plugins .
2. Activate the plugin on your wordpress plugin page.
3. To use the EEXCESS-wordpress-plugin create / edit a post. Inside the texteditor you can get recommendations by simple select the text and click the "Get Recommendation"-button inside the EEXCESS area beneath the editor. An alternativ to this method is, to write #eexcess:keyword# or multiple keywords with #eexcess:keyword1 keyword2# (e.g. #eexcess:Munic Bavaria#). The plugin will automatically strip the keyword from this phrase and try to get recommendations for the given keyword.


## Settings

If you take a look inside the js folder of the plugin, you'll see a javascript file called eexcess-settings.js. This file contains the plugin options object, which allows you to configurate the main settings of the plugin, e.g. pagination or the keycodes for triggering the recommendations request after typen #eexcess:keyword. At the moment the content looks like this: 

```javascript
var EEXCESS = {
    "trigger" : { // the options needed for triggering a recommendation
        "keyCodes" : [ // Defines all keycodes needed for triggering the event
            32 // whitespace
        ],
        "marker" : "#eexcess:", // this marker signals the listener to get recommendations
        "textSpan" : 2 // the amount of words send
    },
    "recommendationData" : { // The object for the ajax call
        "action" : "get_recommendations", // serverside function
        "terms" : [] // the keywords
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
        "noTextSelected" : "Please select some text."
    }
};
```
