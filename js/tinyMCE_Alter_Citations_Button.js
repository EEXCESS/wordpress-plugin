// closure to avoid namespace collision
(function(){

	// registers the plugin. DON'T MISS THIS STEP!!!
	tinymce.PluginManager.add('EEXCESS_alter_citations', function(editor, url) {
		// creates the button
		editor.addButton( 'Alter_Citations_Button', {
			title : 'Alter Citations', // title of the button
			image : url + '/../images/wheel.png',  // path to the button's image
			onclick : function() {
				// triggers the thickbox
				var width = $j(window).width(),
				H = $j(window).height(),
				W = ( 750 < width ) ? 750 : width;
				tb_show( 'Alter EEXCESS Citations', '#TB_inline?width=' + W + '&height=' + H + '&inlineId=alterCitationsForm' );
			}
		});
	});

	// executes this when the Pageload ist complete
	$j(window).load(function(){
		var links = $j(tinyMCE.activeEditor.getBody()).find('.eexcessRef'),
		references = $j(tinyMCE.activeEditor.getBody()).find('.csl-entry');
		// creates a form to be displayed everytime the button is clicked
		// you should achieve this using AJAX instead of direct html code like this
		if(references != null){
			var form = '<div id="alterCitationsForm"><table id="citation-table" class="form-table">';
			for(var i = 0; i<references.length; i++){
				form = form + '<tr> \
						<td><input type="checkbox" name="deletionIndicator"></td> \
						<td>' + references[i].outerHTML + '</td> \
						<td><button name="delete" class="button-secondary remove"><img src="' + pluginURL.pluginsPath + 'images/cross.png"</button></td> \
					</tr>';
			}
			form = form + '</table>\
			<p class="submit">\
				<input type="button" id="deletion-submit" class="button-primary" value="Delete marked" name="submit" />\
			</p>\
			</div>';
		}


		form = $j(form);
		var table = form.find('table');
		form.appendTo('body').hide();

		// handles the click event of the submit button
		form.find('.remove').click(function(){
			var links = $j(tinyMCE.activeEditor.getBody()).find('.eexcessRef'),
			references = $j(tinyMCE.activeEditor.getBody()).find('.csl-entry'),
			idToRemove = $j($j(this).parents()[1]).find("p").attr("data-id");
			$j("#content_ifr").contents().find("[data-id='" + idToRemove + "']").remove();
			// closes Thickbox
			tb_remove();
		});
	});
})();
