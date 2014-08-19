<?php
/**
 * Plugin Name: EEXCESS
 * Plugin URI: https://github.com/EEXCESS/eexcess
 * Description: TBD
 * Version: 1.0
 * Author: Andreas Eisenkolb
 * Author URI: https://github.com/AEisenkolb
 * License: GPL2
 */
/*
Copyright 2014  Andreas Eisenkolb  (email : andreas.eisenkolb@yahoo.de)

This program is free software; you can redistribute it and/or modify
it under the terms of the GNU General Public License, version 2, as 
published by the Free Software Foundation.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program; if not, write to the Free Software
Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA  02110-1301  USA
*/
?>
<?php 
    add_action( 'admin_init', 'init_eexcess_plugin' );
    
    // Prepare stuff
    function init_eexcess_plugin() {
        global $pagenow;
        
        // Load the scripts for the post creation / editing page
        if($pagenow == 'post-new.php' || $pagenow == 'post.php') { 
            // init jQuery
            wp_enqueue_script('jquery');  
            // init JavaScript
            wp_enqueue_script( 'eexcess-settings', plugins_url( '/js/eexcess-settings.js', __FILE__ ), array('jquery') ); 
            wp_enqueue_script( 'eexcess-pagination-script', plugins_url( '/js/jquery.paginate.js', __FILE__), array('jquery') );
            wp_enqueue_script( 'eexcess-templating-script', plugins_url( '/js/handlebars-v1.3.0.js', __FILE__), array('jquery') );
            wp_enqueue_script( 'eexcess-script', plugins_url( '/js/eexcess-script.js', __FILE__ ), array('jquery') );
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
                                <a href="{{previewImage}}" target="_blank">
                                    <img height="50px" src="{{previewImage}}" alt="thumbnail"></img>
                                </a>     
                                <p>
                                    <a target="_blank" href="{{uri}}">{{title}}</a> 
                                    <br/>
                                    Provider: {{facets.provider}} 
                                    {{#if facets.language}} 
                                        <br/>
                                        Language: {{facets.language}}  
                                    {{/if}}
                                </p>
                            {{else}}
                                <div class="eexcess-previewPlaceholder"></div>
                                <p>
                                    <a href="{{uri}}">{{title}}</a> 
                                    </br>
                                    Provider: {{facets.provider}} 
                                    {{#if facets.language}} 
                                        <br/>
                                        Language: {{facets.language}}  
                                    {{/if}}
                                </p> 
                            {{/if}}
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
        <div id="content">
            <p>
            Get recommendations for keywords by using "#eexcess:Keyword#" inside the textarea. 
            Furthermore, you can select parts of the text and then click the "Get Recommendations" button.
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

        // URL: http://eexcess-dev.joanneum.at/eexcess-privacy-proxy/api/v1/recommend
        // Alternative URL: http://132.231.111.197:8080/eexcess-privacy-proxy/api/v1/recommend
        // METHOD: POST
        // DEV: http://eexcess-dev.joanneum.at/eexcess-federated-recommender-web-service-1.0-SNAPSHOT/recommender/recommend
        // Privacy Proxy 
        $proxyURL = "http://eexcess-dev.joanneum.at/eexcess-privacy-proxy/api/v1/recommend";

        // Data for the api call
        $postData = array(
            "numResults" => 999,
            "contextKeywords" => array()
        );

        // Creating the context list for the api call
        foreach($items as $term) {
            array_push($postData["contextKeywords"], array( "weight" => strval (1.0 / sizeof($items)), "text" => $term ));  
        }
        
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
                EEXCESS.extractTerm(ed, e);
            });
            ed.onKeyDown.add(function(ed, e) {
                EEXCESS.catchKeystroke(ed, e);
            });
        }";
        
        return $initArray;
    }   
?>