(function(require, define){
   require(["hashCode"], function(){
      if(localStorage.getItem("eexcess.uuid") === null){
         var date = new Date();
         var seed = (window.location.href + date.getTime().toString()).hashCode();
         localStorage.setItem("eexcess.uuid", seed);
      }
   });
}(EEXCESS.require, EEXCESS.define));
