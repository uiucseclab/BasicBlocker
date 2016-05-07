/***
* File containing helpful functions
***/


// Parse a URL. Based upon http://blog.stevenlevithan.com/archives/parseuri
// parseUri 1.2.2, (c) Steven Levithan <stevenlevithan.com>, MIT License
// Inputs: url: the URL you want to parse
// Outputs: object containing all parts of |url| as attributes
parseUri = function(url) {
  var matches = /^(([^:]+(?::|$))(?:(?:\w+:)?\/\/)?(?:[^:@\/]*(?::[^:@\/]*)?@)?(([^:\/?#]*)(?::(\d*))?))((?:[^?#\/]*\/)*[^?#]*)(\?[^#]*)?(\#.*)?/.exec(url);
  // The key values are identical to the JS location object values for that key
  var keys = ["href", "origin", "protocol", "host", "hostname", "port",
              "pathname", "search", "hash"];
  var uri = {};
  for (var i=0; (matches && i<keys.length); i++)
    uri[keys[i]] = matches[i] || "";
  return uri;
};

//Converts a given url into a unicode encoded url
getUnicodeUrl = function(url) {
    // URLs encoded in Punycode contain xn-- prefix
    if (url && url.indexOf("xn--") > 0) {
        var parsed = parseUri(url);
        // IDN domains have just hostnames encoded in punycode
        parsed.href = parsed.href.replace(parsed.hostname, punycode.toUnicode(parsed.hostname));
      return parsed.href;
    }
    return url;
};


/**
* Trys to get the request type
**/
getRequestType = function(details){
	//Check that the type isn't already given
	var givenType = details.type;
	if(givenType !== "other"){
		return givenType;
	}

	var url = parseUri(details.url);
    if (url && url.pathname) {
		//Look at extension of
      var pos = url.pathname.lastIndexOf('.');
      if (pos > -1) {
        var ext = url.pathname.slice(pos) + '.';
        //Checking for image
        if ('.ico.png.gif.jpg.jpeg.webp.'.indexOf(ext) !== -1) {
          return 'image';
        }
      }
    }
    return 'object';
};


//Get the element type based on request type
getElementType = function(type){
	switch(type){
		case 'main_frame' : return "document";
		case 'sub_frame' : return "subdocument";
		default : return type; 
	}
};

getUnicodeDomain = function(domain) {
    if (domain) {
        return punycode.toUnicode(domain);
    } else {
        return domain;
    }
}

// Strip third+ level domain names from the domain and return the result.
// Inputs: domain: the domain that should be parsed
//         keepDot: true if trailing dots should be preserved in the domain
// Returns: the parsed domain
parseUri.secondLevelDomainOnly = function(domain, keepDot) {
  if (domain) {
    var match = domain.match(/([^\.]+\.(?:co\.)?[^\.]+)\.?$/) || [domain, domain];
    return match[keepDot ? 0 : 1].toLowerCase();
  } else {
    return domain;
  }
};