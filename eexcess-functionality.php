<?php
/**
 * Plugin Name: EEXCESS
 * Plugin URI: https://github.com/EEXCESS/eexcess
 * Description: TBD
 * Version: 1.0
 * Author: Andreas Eisenkolb
 * Author URI: https://github.com/AEisenkolb
 * License: Apache 2.0
 */
/*  Copyright 2014 University of Passau

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/
?>
<?php
   add_action( 'admin_init', 'init_eexcess_plugin' );

   // Prepare stuff
   function init_eexcess_plugin() {
      global $pagenow;

      // Register the script first.
      wp_register_script( 'some_handle', plugins_url( '/js/eexcess-jquery-eventhandlers.js', __FILE__ ) );
      // Now we can localize the script with our data.
      $translation_array = array( 'pluginsPath' => plugins_url() );
      wp_localize_script( 'some_handle', 'pluginURL', $translation_array );
      // The script can be enqueued now or later.
      wp_enqueue_script( 'some_handle' );

      // Load the scripts for the post creation / editing page
      if($pagenow == 'post-new.php' || $pagenow == 'post.php') {
         // init jQuery
         wp_enqueue_script('jquery');
         // init JavaScript
         wp_enqueue_script( 'eexcess-settings', plugins_url( '/js/eexcess-settings.js', __FILE__ ), array('jquery') );
         wp_enqueue_script( 'eexcess-pagination-script', plugins_url( '/js/lib/jquery.paginate.js', __FILE__), array('jquery') );
         wp_enqueue_script( 'eexcess-templating-script', plugins_url( '/js/lib/handlebars-v1.3.0.js', __FILE__), array('jquery') );
         wp_enqueue_script( 'eexcess-script', plugins_url( '/js/eexcess-script.js', __FILE__ ), array('jquery') );
         wp_enqueue_script( 'eexcess-jquery-plugins', plugins_url( '/js/eexcess-jquery-plugins.js', __FILE__ ), array('jquery') );
         //wp_enqueue_script( 'eexcess-jquery-eventhandlers', plugins_url( '/js/eexcess-jquery-eventhandlers.js', __FILE__ ), array('jquery') );
         //for citeproc
         wp_enqueue_script( 'CLSWrapper', plugins_url( '/js/CLSWrapper.js', __FILE__ ), array('jquery', 'eexcess-xmldom', 'eexcess-citeproc') );
         wp_enqueue_script( 'eexcess-citeproc', plugins_url( '/js/lib/citeproc.js', __FILE__ ));
         wp_enqueue_script( 'eexcess-xmldom', plugins_url( '/js/lib/xmldom.js', __FILE__ ));
         // init styles
         wp_enqueue_style( 'eexcess-styles', plugins_url( '/styles/eexcess-styles.css', __FILE__ ) );
      }
   }

   add_action( 'add_meta_boxes', 'myplugin_add_meta_box' );
   /**
    * Adds a box to the main column on the Post edit screen.
    */
   function myplugin_add_meta_box() {
      // @see http://codex.wordpress.org/Function_Reference/add_meta_box
      add_meta_box(
         'eexcess_container', // id
         'EEXCESS', // title
         'eexcess_meta_box_callback', // callback
         'post' // post_type
      );
    }

   /**
    * Prints the box content.
    *
    * @param WP_Post $post The object for the current post/page.
    */
   function eexcess_meta_box_callback( $post ) { ?>
      <?php // List template ?>
      <script id="list-template" type="text/x-handlebars-template">
         <div id="recommendationList">
            <ul id="eexcess-recommendationList">
               {{#each result}}
                  <li data-id="{{id}}">
                     <div>
                        {{#if previewImage}}
                           <div class="eexcess-previewPlaceholder">
                              <a href="{{previewImage}}" target="_blank">
                                 <img src="{{previewImage}}" alt="thumbnail"></img>
                              </a>
                           </div>
                        {{else}}
                           <div class="eexcess-previewPlaceholder"></div>
                        {{/if}}
                        <div class="recommendationTextArea">
                           <a target="_blank" href="{{uri}}">{{title}}</a>
                           </br>
                           Provider: {{facets.provider}}
                           <br/>
                           {{#if facets.language}}
                              Language: {{facets.language}}
                           {{/if}}
                           <br/>
                           {{#if collectionName}}
                              <input type="hidden" name="collectionName" value="{{collectionName}}">
                           {{/if}}
                           {{#if creator}}
                              <input type="hidden" name="creator" value="{{creator}}">
                           {{/if}}
                           {{#if description}}
                              <input type="hidden" name="description" value="{{description}}">
                           {{/if}}
                           {{#if eexcessURI}}
                              <input type="hidden" name="eexcessURI" value="{{eexcessURI}}">
                           {{/if}}
                           {{#if facets.year}}
                              <input type="hidden" name="facets.year" value="{{facets.year}}">
                           {{/if}}
                           {{#if facets.language}}
                              <input type="hidden" name="facets.language" value="{{facets.language}}">
                           {{/if}}
                           {{#if id}}
                              <input type="hidden" name="id" value="{{id}}">
                           {{/if}}
                           <input name="addMatch" class="button button-small" id="addMatch" value="add" style="width: 40px" onfocus="this.blur();">
                        </div>
                     </div>
                  </li>
               {{/each}}
            </ul>
            <div class='pagination-container'>
               <div id='recommandationList-pagination'></div>
            </div>
         </div>
      </script>

      <input name="getRecommendations" class="button button-primary" id="getRecommendations" value="Get Recommendations">
      <input name="abortRequest" class="button button-primary" id="abortRequest" value="Abort Request">
      <select name="citationStyleDropDown" id="citationStyleDropDown" style="float: right">
         <option value="default" selected="selected">Citation Style (default Hyperlink)</option>
         <?php
            // corresponds to EEXCESS.citeproc.stylesDir from eexcess-settings.js.
            // unfortunatley there is no way to share that variable. At least AFAIK.
            $citeprocStylesPath = plugin_dir_path(__FILE__) . 'js/lib/citeproc-js/citionStyles';
            if ($handle = opendir($citeprocStylesPath)) {
               while (false !== ($entry = readdir($handle))) {
                  if ($entry != "." && $entry != "..") {
                     $entry = str_replace(".csl", "", $entry);
                     echo '<option value="' . $entry . '">' . $entry . '</option>';
                  }
               }
               closedir($handle);
            }
         ?>
      </select>
      <div id="searchQueryReflection" class="searchQueryReflection">
         Results on:<br>
         <span id="searchQuery" style="color: #000000"></span>
      </div>
      <div id="content">
         <p>
            Get recommendations for keywords by using "#eexcess:Keyword#" inside the textarea.
            Furthermore, you can select parts of the text and then either click the "Get Recommendations"
            button or you can use the keyboard shortcut ctrl + e.
         </p>
         <div class='eexcess-spinner'></div>
         <div id='list'></div>
      </div>
   <?php }

   // Ajax action handler
   add_action( 'wp_ajax_get_recommendations', 'get_recommendations' );

   // Callback function for the Ajax call
   function get_recommendations() {
      // Read the term form the POST variable
      $items = $_POST['terms'];
      $context = $_POST['trigger'];

      /**
       * URL: http://eexcess-dev.joanneum.at/eexcess-privacy-proxy/api/v1/recommend
       * Alternative URL: http://132.231.111.197:8080/eexcess-privacy-proxy/api/v1/recommend
       * METHOD: POST
       * DEV: http://eexcess-dev.joanneum.at/eexcess-federated-recommender-web-service-1.0-SNAPSHOT/recommender/recommend
       * Privacy Proxy
       */
      //dev
      //$proxyURL = "http://eexcess-dev.joanneum.at/eexcess-privacy-proxy/api/v1/recommend";

      //stable
      $proxyURL = "http://eexcess.joanneum.at/eexcess-privacy-proxy/api/v1/recommend";

      // Data for the api call
      $postData = array(
         "numResults" => 100,
         "contextKeywords" => array(),
         "origin" => "WP",
         "context" => array("reason" => $context, "value" => "")
      );

      // Creating the context list for the api call
      foreach($items as $term) {
         array_push($postData["contextKeywords"], array( "weight" => strval (1.0 / sizeof($items)), "text" => $term ));
      }

      //array_push($postData["context"], );

      // Create context for the API call
      $context = stream_context_create(array(
         'http' => array(
            'method' => 'POST',
            'header' => "Content-Type: application/json\r\n",
            'content' => json_encode($postData)
         )
      ));

      // Send the request and return the result
      echo @file_get_contents($proxyURL, FALSE, $context);

	   die(); // this is required to return a proper result
   }

   // Hook for the WYSIWYG editor
   add_filter( 'tiny_mce_before_init', 'tiny_mce_before_init' );

   // Setting up the onKeyUp event for the WYSIWYG editor
   function tiny_mce_before_init( $initArray ) {
      $initArray['setup'] = "function(ed) {
         ed.onKeyUp.add(function(ed, e) {
            eexcessMethods.extractTerm(ed);
         });
         ed.onKeyDown.add(function(ed, e) {
            eexcessMethods.assessKeystroke(e);
         });
      }";
      return $initArray;
   }

   //ADDING A BUTTON TO tinyMCE
   add_action( 'admin_head', 'EEXCESS_add_tinymce' );
   function EEXCESS_add_tinymce() {
       global $typenow;

       // only on Post Type: post and page
       if( ! in_array( $typenow, array( 'post', 'page' ) ) )
           return ;

       add_filter( 'mce_external_plugins', 'EEXCESS_add_tinymce_plugin' );
       // Add to line 1 form WP TinyMCE
       add_filter( 'mce_buttons', 'EEXCESS_add_tinymce_button' );
   }

   // inlcude the js for tinymce
   function EEXCESS_add_tinymce_plugin( $plugin_array ) {

       $plugin_array['fb_test'] = plugins_url( 'js/tinyMCE_Custom_Button.js', __FILE__ );
       return $plugin_array;
   }

   // Add the button key for address via JS
   function EEXCESS_add_tinymce_button( $buttons ) {

       array_push( $buttons, 'Get_Recommendations_Button');
       return $buttons;
   }
?>
