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
				updateList();
				var width = $j(window).width(),
				H = $j(window).height(),
				W = ( 750 < width ) ? 750 : width;
				tb_show( 'Alter EEXCESS Citations', '#TB_inline?width=' + W + '&height=' + H + '&inlineId=alterCitationsForm' );
			}
		});
	});

	/**
	*
	*
	* @param ifToRemove:
	*/
	var removeCitationById = function(idToRemove){
		//remove citation
		$j("#content_ifr").contents().find(".csl-entry[data-eexcessrefid='" + idToRemove + "']").remove();

		// remove reference
		$j("#content_ifr").contents().find(".eexcessRef[data-eexcessrefid='" + idToRemove + "']").remove();

		// update citations
		$j("#content_ifr")
		.contents()
		.find(".csl-entry[data-eexcessrefid]")
		.filter(function(index){
			// only those citations that are "behind" the one removed
			return $j(this).attr("data-eexcessrefid") > removeCitationById.arguments[0];
		})
		.each(function(){
			var citation = $j(this);
			// update the attribute
			citation.attr("data-eexcessrefid", citation.attr("data-eexcessrefid") - 1);
			// update the text enclosed by the span-tag
			$j("span", citation).text($j("span", citation).text() - 1);
		});

		// update references
		$j("#content_ifr")
		.contents()
		.find(".eexcessRef")
		.filter(function(index){
			// only those citations that are "behind" the one removed
			return $j(this).attr("data-eexcessrefid") > removeCitationById.arguments[0];
		})
		.each(function(){
			var citation = $j(this);
			// update the attribute
			citation.attr("data-eexcessrefid", citation.attr("data-eexcessrefid") - 1);
			// update the text enclosed by the span-tag
			var text = $j(this).text();
			$j(this).text("[" + (text.slice(1, text.length-1) - 1) + "]");
		});
	}

	var updateList = function(){
		// empty the page
		var links = $j(tinyMCE.activeEditor.getBody()).find('.eexcessRef'),
		references = $j(tinyMCE.activeEditor.getBody()).find('.csl-entry');
		// creates a form to be displayed everytime the button is clicked
		// you should achieve this using AJAX instead of direct html code like this
		if(references != null){
			var form = '<div id="alterCitationsForm"><table id="citation-table" class="form-table">';
			for(var i = 0; i<references.length; i++){
				form = form + '<tr> \
						<td><input type="checkbox" class="deletionIndicator"></td> \
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

		//removes a possibly existing expired version of the table
		$j("#alterCitationsForm").remove()

		form = $j(form);
		var table = form.find('table');
		form.appendTo('body').hide();

		// handles the click event of the submit button
		form.find('.remove').click(function(){
			var idToRemove = $j($j(this).parents()[1]).find("p").attr("data-eexcessrefid");
			removeCitationById(idToRemove);
			// closes Thickbox
			tb_remove();
		});

		form.find('#deletion-submit').click(function(){
			var alreadyRemoved = 0;
			// remove the selected citations and there respective references
			$j(".deletionIndicator").each(function(){
				if($j(this).is(":checked")){
					var idToRemove = $j($j(this).parents()[1]).find("p").attr("data-eexcessrefid") - alreadyRemoved;
					removeCitationById(idToRemove);
					$j($j(this).parents()[1]).remove();
					alreadyRemoved += 1;
				}
			});
			tb_remove();
		});
	};
})();
