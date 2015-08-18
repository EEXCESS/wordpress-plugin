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
         wp_enqueue_script( 'requirejs', plugins_url( '/js/lib/require.js', __FILE__ ));

         // make the plugins url available in scripts
         wp_localize_script( 'requirejs', 'plugin_url', plugins_url( '/', __FILE__ ) );

         // init styles
         wp_enqueue_style( 'eexcess-styles', plugins_url( '/styles/eexcess-styles.css', __FILE__ ) );
         wp_enqueue_style( 'onOffSwitch', plugins_url( '/styles/toggle-switch.css', __FILE__ ) );
      }
   }

   // This injects the html-tag that configure reuireJS
   add_filter( 'script_loader_tag', 'my_script_loader_tag', 10, 3 );
   function my_script_loader_tag( $tag, $handle, $src ) {
      if ( 'requirejs' == $handle ) {
         $app = plugins_url( '/js/requireJSConfig.js', __FILE__ );
         $tag = "<script data-main='{$app}' src='{$src}'></script>\n";
      }
      return $tag;
   }

   /**
    * Adds a box to the main column on the Post edit screen.
    */
   add_action( 'add_meta_boxes', 'myplugin_add_meta_box' );
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
      <input name="getRecommendations" class="button button-primary" id="getRecommendations" value="Get Recommendations" readonly>
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
      <div id="searchQueryReflection" class="searchQueryReflection">
         <span id="numResults"></span> Results on:
         <span id="searchQuery" style="color: #000000"></span>
      </div>
      <div id="resultList">
         <iframe id="resultList" src=<?php echo plugin_dir_url(__FILE__) . 'js/lib/visualization-widgets/SearchResultList/index.html';?> style="position:relative;width:1000px;height:625px;"></iframe>
      </div>
      <div id="content">
         <p>
            Get recommendations for keywords by using  selecting parts of the text and then 
            either click the "Get Recommendations" button or use the keyboard shortcut CTRL + E.
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

   // Hook for the WYSIWYG editor
   add_filter( 'tiny_mce_before_init', 'tiny_mce_before_init' );

   // Setting up the onKeyUp event for the WYSIWYG editor
   function tiny_mce_before_init( $initArray ) {
      $initArray['setup'] = "function(ed) {
         ed.onKeyDown.add(function(ed, e) {
            require(['recommendationEventsHelper'], function(helper){
               if(helper.assessKeystroke(e)){
                  helper.getTextAndRecommend();
               }
            });
         })
      }";
      return $initArray;
   }

   //adding a button to tinyMCE
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
      $plugin_array['EEXCESS_get_recommendations'] = plugins_url( 'js/tinyMCE_plugins/tinyMCE_Get_Recommendations_Button.js', __FILE__ );
      $plugin_array['EEXCESS_alter_citations'] = plugins_url( 'js/tinyMCE_plugins/tinyMCE_Alter_Citations_Button.js', __FILE__ );
      return $plugin_array;
   }

   // Add the button key for address via JS
   function EEXCESS_add_tinymce_button( $buttons ) {

      array_push( $buttons, 'Get_Recommendations_Button');
      array_push( $buttons, 'Alter_Citations_Button');
      return $buttons;
   }
?>
