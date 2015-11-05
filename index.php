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


         // read all citeproc style files and make them available on the client side
         $citeprocStylesPath = plugin_dir_path(__FILE__) . 'js/lib/citationBuilder/citationStyles';
         if ($handle = opendir($citeprocStylesPath)) {
            $citationStyles = array();
            while (false !== ($entry = readdir($handle))) {
               if ($entry != "." && $entry != "..") {
                  $entry = str_replace(".csl", "", $entry);
                  $citationStyles[] = $entry;
               }
            }
            closedir($handle);
            wp_localize_script( 'requirejs', 'citationStyles', $citationStyles );
         }

         // init styles
         wp_enqueue_style( 'eexcess-styles', plugins_url( '/styles/eexcess-styles.css', __FILE__ ) );
         wp_enqueue_style( 'onOffSwitch', plugins_url( '/styles/toggle-switch.css', __FILE__ ) );
         wp_enqueue_style( 'bootstrap', plugins_url( '/styles/bootstrap.css', __FILE__ ) );
         wp_enqueue_style( 'bootstrap-theme', plugins_url( '/styles/bootstrap-theme.css', __FILE__ ) );
         wp_enqueue_style( 'jquery-ui', plugins_url( '/styles/jquery-ui.css', __FILE__ ) );
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
      <!-- Visualization thickbox-->
      <?php add_thickbox(); ?>
      <div id="visualizationThickbox" style="display:none;">
         <!-- thickbox content-->
         <iframe id="dashboard" src=<?php echo plugin_dir_url(__FILE__) . 'js/lib/visualization-widgets/Dashboard/index.html';?> style="position:relative;width:1000px;height:625px;"></iframe>
         <!-- /thickbox content-->
      </div>
      <!-- / Visualization thickbox-->
      <div id="resultListContainer">
         <iframe id="resultList" src=<?php echo plugin_dir_url(__FILE__) . 'js/lib/visualization-widgets/SearchResultList/index.html';?> style="position:relative;width:1000px;height:625px;"></iframe>
      </div>
      <div id="privacySettingsForm">
         <hr>
         <!-- privacy settings thickbox-->
         <?php add_thickbox(); ?>
         <div id="privacyThickbox" style="display:none;">
             <div id="privacyPanel" class="panel panel-primary">
               <div class="panel-heading" style="background-color: white;">
                  <h3 class="panel-title"> User Profile
                  </h3>
               </div>
               <div class="panel-body">
                  <div class="row">
                     <div class="col-lg-12">
                        <div class="panel-body">
                           <div class="content">
                              <form class="form-income">
                                 <div class="form-group">
                                    <label for="" class="control-label">Address</label>
                                    <div class="row">
                                       <div class="col-lg-6">
                                          <input data-eexcess-profile-field="address.city" type="text" class="form-control" placeholder="City">
                                       </div>
                                       <div class="col-lg-6">
                                          <input data-eexcess-profile-field="address.country" type="text" class="form-control" placeholder="Country">
                                       </div>
                                    </div>
                                 </div>

                                 <div class="row">
                                    <div class="form-group">
                                       <div class="col-lg-3">
                                          <label for="" class="control-label">Gender</label>
                                       </div>
                                       <div class="col-lg-6">
                                          <label for="" class="control-label">Age</label>
                                       </div>
                                       <div class="col-lg-3">
                                          <label for="" class="control-label">Allow Logging</label>
                                       </div>
                                    </div>
                                 </div>
                                 <div class="row">
                                    <div class="col-lg-3">
                                       <select data-eexcess-profile-field="gender" class="form-control">
                                          <option value="notSpecified">Not Specified</option>
                                          <option value="other">Other</option>
                                          <option value="male">Male</option>
                                          <option value="female">Female</option>
                                       </select>
                                    </div>
                                    <div class="col-lg-6">
                                       <div class="btn-group" data-eexcess-profile-field="age" data-toggle="buttons">
                                           <label class="btn btn-default">
                                               <input type="radio" value="0" /> Child
                                           </label> 
                                           <label class="btn btn-default">
                                               <input type="radio" value="1" /> Young Adult
                                           </label> 
                                           <label class="btn btn-default">
                                               <input type="radio" value="2" /> Adult
                                           </label> 
                                       </div>
                                    </div>
                                    <div class="col-lg-3">
                                       <input id="loggingEnabled" data-eexcess-profile-field="logging" class="cmn-toggle cmn-toggle-round" type="checkbox" checked>
                                       <label for="loggingEnabled"></label>
                                    </div>
                                 </div>
                              </form>
                           </div>
                        </div>
                     </div>
                  </div>
               </div>
            </div>
             <!-- Atif: User profile panel ends here-->

         </div>
         <a href="#TB_inline?width=600&height=550&inlineId=privacyThickbox" title="Profile Settings" class="thickbox">
            <input id="privacySettingsBtn"  style="width: 100px;" name="privacySettings" class="button button-small" value="Profile Settings">
         </a>
      </div>
      <!-- /privacy settings thickbox-->
      <div id="currentCitationStyle" data-citationStyle="apa" style="display:none;">
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
      $plugin_array['EEXCESS_vis_dashboard'] = plugins_url( 'js/tinyMCE_plugins/tinyMCE_Vis_Dashboard.js', __FILE__ );
      $plugin_array['EEXCESS_citation_styles'] = plugins_url( 'js/tinyMCE_plugins/tinyMCE_Citation_Styles.js', __FILE__ );
      return $plugin_array;
   }

   // Add the button key for address via JS
   function EEXCESS_add_tinymce_button( $buttons ) {

      array_push( $buttons, 'Get_Recommendations_Button');
      array_push( $buttons, 'Alter_Citations_Button');
      array_push( $buttons, 'Vis_Dashboard');
      array_push( $buttons, 'Citation_Styles');
      return $buttons;
   }
?>
