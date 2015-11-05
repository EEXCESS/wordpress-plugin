#recommendURL="http://eexcess-dev.joanneum.at/eexcess-federated-recommender-web-service-1.0-SNAPSHOT/recommender/recommend"
#getdetailsURL="http://eexcess-dev.joanneum.at/eexcess-federated-recommender-web-service-1.0-SNAPSHOT/recommender/getDetails"

#recommendURL="http://eexcess-dev.joanneum.at/eexcess-privacy-proxy/api/v1/recommend"
#getdetailsURL="http://eexcess-dev.joanneum.at/eexcess-privacy-proxy/api/v1/getDetails"
baseURL="https://eexcess.joanneum.at/eexcess-privacy-proxy-issuer-1.0-SNAPSHOT/issuer/"
recommendURLExtension="recommend"
getdetailsURLExtension="getDetails"

if [ "$2" == "recommend" ]; then
   url=$baseURL$recommendURLExtension
else
   if [ "$2" == "details" ]; then
      url=$baseURL$getdetailsURLExtension
   else
      url=$baseURL$recommendURLExtension
   fi
fi

if [ -f "$1" ]; then
   curl -v -H "Accept: application/json" -H "Content-Type: application/json" -d @"$1" "$url" 2>/dev/null | python -m json.tool 
else
   echo "
Usage: APICall FILENAME [METHOD] 
FILENAME:   A valid JSON file
METHOD:     Optional parameter. Determines the method. 'recommend' and 'details' are valid options.
"
fi
