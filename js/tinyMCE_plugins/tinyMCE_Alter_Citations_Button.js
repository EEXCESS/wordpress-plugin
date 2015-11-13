(function(){
	/*
	* The following function registers the plugin.
	*/
   tinymce.PluginManager.add('EEXCESS_alter_citations', function(editor, url) {
      var myButton = null;
      // creates the button
		editor.addButton( 'Alter_Citations_Button', {
			title : 'Alter Citations', // title of the button
			image : url + '/../../images/delete.png',  // path to the button's image
			onclick : function() {
				// triggers the thickbox
				updateList();
				var width = $(window).width(),
				H = $(window).height(),
				W = ( 750 < width ) ? 750 : width;
				tb_show( 'Alter EEXCESS Citations', '#TB_inline?width=' + W + '&height=' + H + '&inlineId=alterCitationsForm' );
			},
         onPostRender: function(){
            myButton = this; 
            require(["jquery"], function($){
               // disable button when no citation area present
               if($(tinyMCE.activeEditor.getBody()).find('.csl-entry').length === 0){
                  myButton.disabled(true);
               }
            });
         },
         enable: function(){
            myButton.disabled(false);
         },
         disable: function(){
            myButton.disabled(true);
         }
		});
	});

	/**
	* This method removes a citations and all asociated objects (like references to citations
	* and markers in the resultlist indication that an object has already been cited).
	* @param idToRemove: The id of the object to be removed
	*/
	var removeCitationById = function(idToRemove){
		//remove citation
		$("#content_ifr").contents().find(".csl-entry[data-eexcessrefid='" + idToRemove + "']").remove();

		// remove reference
		$("#content_ifr").contents().find(".eexcessRef[data-eexcessrefid='" + idToRemove + "']").remove();

		// update citations
		$("#content_ifr")
		.contents()
		.find(".csl-entry[data-eexcessrefid]")
		.filter(function(index){
			// only those citations that are "behind" the one removed
			return $(this).attr("data-eexcessrefid") > removeCitationById.arguments[0];
		})
		.each(function(){
			var citation = $(this);
			// update the attribute
			citation.attr("data-eexcessrefid", citation.attr("data-eexcessrefid") - 1);
			// update the text enclosed by the span-tag
			$("span", citation).text($("span", citation).text() - 1);
		});

		// update references
		$("#content_ifr")
		.contents()
		.find(".eexcessRef")
		.filter(function(index){
			// only those citations that are "behind" the one removed
			return $(this).attr("data-eexcessrefid") > removeCitationById.arguments[0];
		})
		.each(function(){
			var citation = $(this);
			// update the attribute
			citation.attr("data-eexcessrefid", citation.attr("data-eexcessrefid") - 1);
			// update the text enclosed by the span-tag
			var text = $(this).text();
			$(this).text("[" + (text.slice(1, text.length-1) - 1) + "]");
		});

		//removing the "already cited"-flag from resultlist
		$(".eexcess-alreadyCited[data-refnumb=" + idToRemove + "]")
		.each(function(){
			$(this).removeClass("eexcess-alreadyCited");
			$(this).removeAttr("data-refnumb");
		});
      if(isCitationareaPresent() === false){
         tinyMCE.activeEditor.buttons["Alter_Citations_Button"].disable();
      }
	}

	/*
	 * This function creates the content of the thickbox shown when the "alter citations"-dialog
	 * is requested.
	 */
	var updateList = function(){
		// empty the page
		var links = $(tinyMCE.activeEditor.getBody()).find('.eexcessRef'),
		references = $(tinyMCE.activeEditor.getBody()).find('.csl-entry');
		// creates a form to be displayed everytime the button is clicked
		if(references != null){
			var form = '<div id="alterCitationsForm"><table id="citation-table" class="form-table">';
			for(var i = 0; i<references.length; i++){
				form = form + '<tr> \
						<td><input type="checkbox" class="deletionIndicator"></td> \
						<td>' + references[i].outerHTML + '</td> \
						<td><button name="delete" class="button-secondary remove"><img height="20" width="20" src="' + plugin_url + 'images/delete.png"</button></td> \
					</tr>';
			}
			form = form + '</table>\
			<p class="submit">\
				<input type="button" id="deletion-submit" class="button-primary" value="Delete marked" name="submit" style="margin-left: 10px"/>\
			</p>\
			</div>';
		}

		//removes a possibly existing expired version of the table
		$("#alterCitationsForm").remove()

		form = $(form);
		var table = form.find('table');
		form.appendTo('body').hide();

		// handles the click event of the submit button
		form.find('.remove').click(function(){
			var idToRemove = $($(this).parents()[1]).find("p").attr("data-eexcessrefid");
			removeCitationById(idToRemove);
			// closes Thickbox
			tb_remove();
		});

		form.find('#deletion-submit').click(function(){
			var alreadyRemoved = 0;
			// remove the selected citations and there respective references
			$(".deletionIndicator").each(function(){
				if($(this).is(":checked")){
					var idToRemove = $($(this).parents()[1]).find("p").attr("data-eexcessrefid") - alreadyRemoved;
					removeCitationById(idToRemove);
					$($(this).parents()[1]).remove();
					alreadyRemoved += 1;
				}
			});
			tb_remove();
		});
	}

   var isCitationareaPresent = function(){
      return $(tinyMCE.activeEditor.getBody()).find('.csl-entry').length > 0;
   }
})();
