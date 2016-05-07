var webRequestRules = new Array();
var elementRules = new Array();
var substringRules = new Array();

var objectRules = {};
var domainRules = {};
var WLdomainRules = {};
var generalRules = new Array();
var cosmeticFiltering = [];
var malwareList = [];

//Malware EasyList
$.get('malwaredomains_full.txt', function(data){
    lines = data.split('\n');
    for(i = 0; i < lines.length; i++){
        if (lines[i].substring(0,2) === "||"){
            url = lines[i].substring(2, lines[i].length - 2);
            malwareList.push(url);
        }
    }
});

//Uses basic EasyList ruleset to try and filter ads
$.get('easylist.txt', function(data){
    lines = data.split('\n');
    for(i = 0; i < lines.length; i++){
        var line = lines[i];
        var filter = processExpression(line);

        if(filter.cosmetic){
            cosmeticFiltering.push(filter);
        }
        else if(filter.whiteList){
            //add whitelist support
            //Update domain rule mappings
            for(j = 0; j < Object.keys(filter.domains).length; j++){
                var key = Object.keys(filter.domains)[j];
                if(WLdomainRules[key] === undefined){
                    WLdomainRules[key] = [];
                }
                WLdomainRules[key].push(filter);
            }
        }
        else{
            //Update object rule mappings
            for(j = 0; j < filter.allowedElementTypes.length; j++){
                if(objectRules[filter.allowedElementTypes[j]] === undefined){
                    objectRules[filter.allowedElementTypes[j]] = [];
                }
                objectRules[filter.allowedElementTypes[j]].push(filter);
            }

            //Update domain rule mappings
            for(j = 0; j < Object.keys(filter.domains).length; j++){
                var key = Object.keys(filter.domains)[j];
                if(domainRules[key] === undefined){
                    domainRules[key] = [];
                }
                domainRules[key].push(filter);
            }

            //Add to general rules if none other apply
            if(filter.domains.length === 1 && filter.allowedElementTypes.length === 8){
                generalRules.push(filter);
            }
        }
    }
});

/**
   Creates appropriate filter structure from given expression
**/
processExpression = function(expression){
    var filter = {
            domainText:"",
            thirdParty: false,
            matchCase: false,
            whiteList: false,
            cosmetic: false
        };

    var optionsRegex = /\$~?[\w\-]+(?:=[^,\s]+)?(?:,~?[\w\-]+(?:=[^,\s]+)?)*$/;
    var optionsText = expression.match(optionsRegex);
    var allowedElementTypes;
    
    //Check if is whitelist
    if(expression.substring(0,2) === "@@"){
        filter.whiteList = true;
        expression = expression.substring(2,expression.length);
    }

    //Check if is cosmetic
    if(expression.substring(0,2) === "##"){
        filter.cosmetic = true;
        expression = expression.substring(2,expression.length);
    }

    //No options given
    if (!optionsText) {
        var rule = expression;
        var options = [];
    }
    else {
        var options = optionsText[0].substring(1).toLowerCase().split(',');
        var rule = expression.replace(optionsText[0], '');
    }

    //Parse all given options
    for (var i = 0; i < options.length; i++) {
        var option = options[i];

        //Domains
        if (/^domain\=/.test(option)) {
          filter.domainText = option.substring(7);
          continue;
        }

        //Check for inversions
        var inverted = (option[0] == '~');
        if (inverted)
          option = option.substring(1);

        option = option.replace(/\-/, '_');

        //Some options should map to other options
        if (option == 'object_subrequest')
            option = 'object';
        if (option == 'background')
            option = 'image';

        //Element type
        if (["script","image","xmlhttprequest","object","document","subdocument","stylesheet","other"].indexOf(option) != -1) { 
            if (inverted) {
                if(allowedElementTypes === undefined)
                    allowedElementTypes = ["script","image","xmlhttprequest","object","document","subdocument","stylesheet","other"];
                allowedElementTypes.splice(allowedElementTypes.indexOf(option), 1);
            } 
            else {
                if(allowedElementTypes === undefined)
                    allowedElementTypes = [];
                allowedElementTypes.push(option);
          }
        }
        //Third party check
        else if (option === 'third_party') {
            if (!inverted) {
                filter.thirdParty = true;
            }
        }
        //Case matters
        else if (option === 'match_case') {
            filter.matchCase = true;
        }
    }

    filter.domains = createDomainSet(filter.domainText);

    //Update allowed types for the return object
    if (allowedElementTypes === undefined)
        filter.allowedElementTypes = ["script","image","xmlhttprequest","object","document","subdocument","stylesheet","other"];
    else
        filter.allowedElementTypes = allowedElementTypes;

    //Check if it is in regex form
    var matchcase = filter.matchcase;
    if (/^\/.+\/$/.test(rule)) {
        filter.rule = rule.substr(1, rule.length - 2); // remove slashes
        filter.rule = new RegExp(filter.rule, matchcase);
        return filter;
    }

    //Determine a key to use
    var key = rule.match(/[\w&=]{5,}/);
    if (key)
        filter.key = new RegExp(key, matchcase);

    //Transform into valid regex from rule
    //...Any cleaner way to do this?
    rule = rule.replace(/\*-\*-\*-\*-\*/g, '*')
                .replace(/\*\*+/g, '*')
                .replace(/([^a-zA-Z0-9_\|\^\*])/g, '\\$1')
                .replace(/\^/g, '[^\\-\\.\\%a-zA-Z0-9_]')
                .replace(/\*/g, '.*')
                .replace(/^\|\|/, '^[^\\/]+\\:\\/\\/([^\\/]+\\.)?')
                .replace(/^\|/, '^')
                .replace(/\|$/, '$')
                .replace(/\|/g, '\\|')
                .replace(/^\.\*/, '')
                .replace(/\.\*$/, '');

    filter.rule = new RegExp(rule, matchcase);

    return filter;
}

//Creates a domain set that determines if the domain is used or not
createDomainSet = function(domainText){
    var domains = domainText.split("|");

    var data = {};
    data[''] = true;

    if (domains == '')
        return data;

    for (var i = 0; i < domains.length; i++) {
        var domain = domains[i];
        if (domain[0] == '~') {
          data[domain.substring(1)] = false;
        } else {
          data[domain] = true;
          data[''] = false;
        }
    }

    return data;
}

checkMalware = function(url){
    url=url.replace("http://", "");
    url=url.replace("https://", "");
    url=url.replace("www.","")

    for(var i = 0; i < malwareList.length; i++){
        if(url.indexOf(malwareList[i]) != -1){
            return true;
        }
    }
    return false;
}

/*Function to help check requests against loaded rules
Returns true if the request should be blocked
and false if no matches were found
*/
checkMatch = function(url, elementType, domain){
    //Check if third party
    var urlDomain = getUnicodeDomain(parseUri(url).hostname);
    var thirdParty = checkThirdParty(urlDomain, domain);

    //Check White List Domain
    if(WLdomainRules[domain] !== undefined)
        for(var i = 0; i < WLdomainRules[domain].length; i++){
            var filter = WLdomainRules[domain][i];
            if(checkFilterMatch(url, elementType, domain, thirdParty, filter)){
                return filter;
            }
        }

    //Check domain filters
    if(domainRules[domain] !== undefined)
        for(var i = 0; i < domainRules[domain].length; i++){
            var filter = domainRules[domain][i];
            if(checkFilterMatch(url, elementType, domain, thirdParty, filter)){
                return filter;
            }
        }

    //Check object filters
    if(objectRules[elementType] !== undefined)
        for(var i = 0; i < objectRules[elementType].length; i++){
            var filter = objectRules[elementType][i];
            if(checkFilterMatch(url, elementType, domain, thirdParty, filter)){
                return filter;
            }
        }

    //Apply general rules
    for(var i = 0; i < generalRules.length; i++){
        var filter = generalRules[i];
        if(checkFilterMatch(url, elementType, domain, thirdParty, filter)){
            return filter;
        }
    }

    //Couldn't find any matches so return false
    return null;
};

//Checks if a filter matches to a given url, element and domain
checkFilterMatch = function(url, elementType, domain, thirdParty, filter){
    //Check if thrid party status matches
    if(thirdParty !== filter.thirdParty)
        return false;

    //Check for valid domains
    var validDomain = false;
    if(filter.domains[""] || (Object.keys(filter.domains).indexOf(domain) > -1 && filter.domains[domain]))
        validDomain = true;

    if(!validDomain)
        return false;

    //Check for element type 
    if(filter.allowedElementTypes.indexOf(elementType) == -1)
        return false;

    //Check if regex accepts
    return filter.rule.test(url);
}

//Determine if two given domains are the same or not
checkThirdParty = function(domain1, domain2) {
    var match1 = parseUri.secondLevelDomainOnly(domain1, false);
    var match2 = parseUri.secondLevelDomainOnly(domain2, false);
    return (match1 !== match2);
}
