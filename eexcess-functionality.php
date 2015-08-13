<?php
/**
 * Plugin Name: EEXCESS
 * Plugin URI: https://github.com/EEXCESS/eexcess
 * Description: Gives you the ability to enrich your blog with well-selected and high quality content
 * Version: 0.3
 * Author: Andreas Eisenkolb and Nils Witt
 * Author URI: https://github.com/AEisenkolb
 * Author URI: https://github.com/n-witt
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

   function init_eexcess_plugin() {
      global $pagenow;
      
      // Load the scripts for the post creation / editing page
      if($pagenow == 'post-new.php' || $pagenow == 'post.php') {

         $eventsScripts = array(
            'jquery-ui-sortable',
            'wp-backbone'
            );
         wp_deregister_script( $eventsScripts );

         wp_enqueue_script( 'jquery' );
         wp_enqueue_script( 'requirejs', plugins_url( '/js/lib/require.js', __FILE__ ));
         wp_enqueue_script( 'eexcess-settings', plugins_url( '/js/eexcess-settings.js', __FILE__ ), array('jquery') );
         wp_enqueue_script( 'eexcess-pagination-script', plugins_url( '/js/lib/jquery.paginate.js', __FILE__), array('jquery') );
         wp_enqueue_script( 'eexcess-templating-script', plugins_url( '/js/lib/handlebars-v1.3.0.js', __FILE__), array('jquery') );
         wp_enqueue_script( 'eexcess-script', plugins_url( '/js/eexcess-script.js', __FILE__ ), array('jquery') );
         wp_enqueue_script( 'eexcess-jquery-plugins', plugins_url( '/js/eexcess-jquery-plugins.js', __FILE__ ), array('jquery') );
         // for citeproc
         wp_enqueue_script( 'eexcess-citeproc', plugins_url( '/js/lib/citationBuilder.js', __FILE__ ));

         // for requireJS testing purposes
         wp_enqueue_script( 'resultslist', plugins_url( '/js/resultList.js', __FILE__ ));
        
         // init styles
         wp_enqueue_style( 'eexcess-styles', plugins_url( '/styles/eexcess-styles.css', __FILE__ ) );
         wp_enqueue_style( 'onOffSwitch', plugins_url( '/styles/toggle-switch.css', __FILE__ ) );
      }
   }

   add_filter( 'script_loader_tag', 'my_script_loader_tag', 10, 3 );
   function my_script_loader_tag( $tag, $handle, $src ) {
      if ( 'requirejs' == $handle ) {
         $app = plugins_url( '/js/resultList.js', __FILE__ );
         $tag = "<script data-main='{$app}' src='{$src}'></script>\n";
      }
      return $tag;
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
                  <li data-id="{{documentBadge.id}}">
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
                           <a target="_blank" href="{{documentBadge.uri}}">{{title}}</a>
                           {{#if creator}}
                              <div class="creator">Creator: {{creator}}</div>
                           {{else}}
                              <div class="provider">Provider: {{documentBadge.provider}}</div>
                           {{/if}}
                           {{#if date}}
                              <div class="published">Published: {{date}}</div>
                           {{else}}
                              <div class="language">Language: {{language}}</div>
                           {{/if}}
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
                              <input type="hidden" name="eexcessURI" value="{{documentBadge.uri}}">
                           {{/if}}
                           {{#if facets.year}}
                              <input type="hidden" name="facets.year" value="{{date}}">
                           {{/if}}
                           {{#if facets.language}}
                              <input type="hidden" name="facets.language" value="{{language}}">
                           {{/if}}
                           {{#if id}}
                              <input type="hidden" name="id" value="{{id}}">
                           {{/if}}
                           <input name="addAsCitation" class="button button-small" value="Add as Citation" style="width: 95px" onfocus="this.blur();">
                           {{#if previewImage}}
                              <input name="addAsImage" class="button button-small" value="Add as Image" style="width: 88px" onfocus="this.blur();">
                           {{/if}}
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
            $citeprocStylesPath = plugin_dir_path(__FILE__) . 'js/lib/citationStyles';
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
      <div id="iframeFoo">
         <iframe src=<?php echo plugin_dir_url(__FILE__) . 'visualization-widgets/SearchResultList/index.html';?> style="position:relative;width:1000px;height:625px;"></iframe>
      </div>
      <div id="searchQueryReflection" class="searchQueryReflection">
         <span id="numResults"></span> Results on:
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
      <div id="privacySettings">
         <hr>
         <!-- privacy settings thickbox-->
         <?php add_thickbox(); ?>
         <div id="privacyThickbox" style="display:none;">
            <br>
            <!-- tooglebutton-->
            <table class="privacySettings">
               <tr>
                  <td>Enable extended logging</td>
                  <td>
                     <input id="extendedLogging" class="cmn-toggle cmn-toggle-round" type="checkbox" checked>
                     <label for="extendedLogging"></label>
                  </td>
               </tr>
            </table>
            <!-- /tooglebutton-->
         </div>
         <a href="#TB_inline?width=600&height=550&inlineId=privacyThickbox" title="Privacy Settings" class="thickbox">
            <input id="privacySettings"  style="width: 100px;" name="privacySettings" class="button button-small" value="Privacy Settings">
         </a>
      </div>
      <!-- /privacy settings thickbox-->
   <?php }

   // Ajax action handler
   add_action( 'wp_ajax_get_recommendations', 'get_recommendations' );

   // Callback function for the Ajax call
   function get_recommendations() {
      $payload = $_POST['payload'];
      /**
       * URL: http://eexcess-dev.joanneum.at/eexcess-privacy-proxy/api/v1/recommend
       * Alternative URL: http://132.231.111.197:8080/eexcess-privacy-proxy/api/v1/recommend
       * METHOD: POST
       * DEV: http://eexcess-dev.joanneum.at/eexcess-federated-recommender-web-service-1.0-SNAPSHOT/recommender/recommend
       * Privacy Proxy
       */
      // new Format
      $proxyURL = "http://eexcess-dev.joanneum.at/eexcess-privacy-proxy-1.0-SNAPSHOT/api/v1/recommend";

      //dev
      //$proxyURL = "http://eexcess-dev.joanneum.at/eexcess-privacy-proxy/api/v1/recommend";

      //stable
      // $proxyURL = "http://eexcess.joanneum.at/eexcess-privacy-proxy/api/v1/recommend";

      // Create context for the API call
      $context = stream_context_create(array(
         'http' => array(
            'method' => 'POST',
            'header' => array("Content-Type: application/json", "Accept: application/json", "Origin: WP"),
            'content' => json_encode($payload)
         )
      ));
      // Send the request and return the result
      echo @file_get_contents($proxyURL, FALSE, $context);

	   die(); // this is required to return a proper result
   }


   // Ajax action handler
   add_action( 'wp_ajax_get_details', 'get_details' );

   // Callback function for the Ajax call
   function get_details() {
      $payload = $_POST['payload'];

      $proxyURL = "http://eexcess-dev.joanneum.at/eexcess-privacy-proxy-1.0-SNAPSHOT/api/v1/getDetails";
      
      // Create context for the API call
      $context = stream_context_create(array(
         'http' => array(
            'method' => 'POST',
            'header' => array("Content-Type: application/json", "Accept: application/json", "Origin: WP"),
            'content' => json_encode($payload)
         )
      ));
      // Send the request and return the result
      echo @file_get_contents($proxyURL, FALSE, $context);

	   die(); // this is required to return a proper result
   }


///////////advanced logging///////////////

add_action( 'wp_ajax_advanced_logging', 'advanced_logging' );

// Callback function for the Ajax call
function advanced_logging() {
   // Read the term form the POST variable
   $resource = $_POST['resource'];
   $query = $_POST['query'];
   $type = $_POST['type'];
   $timestamp = $_POST['timestamp'];
   $beenRecommended = $_POST['beenRecommended'];
   $action_taken = $_POST['action-taken'];
   $uuid = $_POST['uuid'];

   /**
    * URL: http://eexcess-dev.joanneum.at/eexcess-privacy-proxy/api/v1/recommend
    * Alternative URL: http://132.231.111.197:8080/eexcess-privacy-proxy/api/v1/recommend
    * METHOD: POST
    * DEV: http://eexcess-dev.joanneum.at/eexcess-federated-recommender-web-service-1.0-SNAPSHOT/recommender/recommend
    * Privacy Proxy
    */
   // new Format
   $proxyURL = "http://eexcess-dev.joanneum.at/eexcess-federated-recommender-web-service-1.0-SNAPSHOT/recommender/recommend";

   //dev
   //$proxyURL = "http://eexcess-dev.joanneum.at/eexcess-privacy-proxy/api/v1/log/rview";

   //stable
   //$proxyURL = "http://eexcess.joanneum.at/eexcess-privacy-proxy/api/v1/log/rview";

   // Data for the api call
   $postData = array(
      "resource" => $resource,
      "timestamp" => $timestamp,
      "type" => $type,
      "context" => array("query" => $query),
      "beenRecommended" => $beenRecommended,
      "action" => $action_taken,
      "uuid" => $uuid
   );


   // Create context for the API call
   $context = stream_context_create(array(
      'http' => array(
         'method' => 'POST',
         'header' => array("Content-Type: application/json", "Origin: WP"),
         'content' => json_encode($postData)
      )
   ));

   // Send the request and return the result
   echo @file_get_contents($proxyURL, FALSE, $context);
   //return HTTP-status to client
   echo($http_response_header[0]);

   die(); // this is required to return a proper result
}

///////////////////////


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

   //adding a button to  tinyMCE
   add_action( 'admin_head', 'EEXCESS_add_tinymce' );
   function EEXCESS_add_tinymce() {
      global $typenow;

      // only on Post Type: post and page
      if( ! in_array( $typenow, array( 'post', 'page' ) ) )
           return ;

      // registers the method that registers our javascript file that implements our button
      add_filter( 'mce_external_plugins', 'EEXCESS_add_tinymce_plugin' );
      // registers the method that registers our button
      add_filter( 'mce_buttons', 'EEXCESS_add_tinymce_button' );
   }

   // inlcude the js for tinymce
   function EEXCESS_add_tinymce_plugin( $plugin_array ) {
      $plugin_array['EEXCESS_get_recommendations'] = plugins_url( 'js/tinyMCE_Get_Recommendations_Button.js', __FILE__ );
      $plugin_array['EEXCESS_alter_citations'] = plugins_url( 'js/tinyMCE_Alter_Citations_Button.js', __FILE__ );
      return $plugin_array;
   }

   // Add the button key for address via JS
   function EEXCESS_add_tinymce_button( $buttons ) {

      array_push( $buttons, 'Get_Recommendations_Button');
      array_push( $buttons, 'Alter_Citations_Button');
      return $buttons;
   }
?>
