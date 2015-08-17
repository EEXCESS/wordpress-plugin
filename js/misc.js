define([], function(){
   return {
      getFile:  function(path){
         var request = $j.ajax({
            type: "GET",
            url: path,
            async: false,
         });
         if(request.status == 200){
            return request.responseText;
         }else{
            return null;
         }
      },
   }

});
