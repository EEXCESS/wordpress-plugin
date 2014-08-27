// Avoid jQuery conflicts from different plugins
$j = jQuery.noConflict();

$j.fn.setCursorPosition = function(pos) {
   this.each(function(index, elem) {
      if (elem.setSelectionRange) {
         elem.setSelectionRange(pos, pos);
      } else if (elem.createTextRange) {
         var range = elem.createTextRange();
         range.collapse(true);
         range.moveEnd('character', pos);
         range.moveStart('character', pos);
         range.select();
      }
   });
   return this;
};

// Getting the cursor position
$j.fn.getCursorPosition = function() {
   var input = this.get(0);
   if (!input){
      return; // No (input) element found
   }
   if ('selectionStart' in input) {
      // Standard-compliant browsers
      return input.selectionStart;
   } else if (document.selection) {
      // IE
      input.focus();
      var sel = document.selection.createRange();
      var selLen = document.selection.createRange().text.length;
      sel.moveStart('character', -input.value.length);
      return sel.text.length - selLen;
   }
}

// Setting the cursor position
$j.fn.selectRange = function(start, end) {
   if(!end) {
      end = start;
   }
   return this.each(function() {
      if (this.setSelectionRange) {
         this.focus();
         this.setSelectionRange(start, end);
      } else if (this.createTextRange) {
         var range = this.createTextRange();
         range.collapse(true);
         range.moveEnd('character', end);
         range.moveStart('character', start);
         range.select();
      }
   });
};
