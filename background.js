//Settings
var prefetchWebpages = false;
var blockMalware = true;
var blockAds = true;

//Debugging purposes
var displayLogs = true;
var showOnlyBlocked = true;

//Set prefetch settings 
var callback = function() {void chrome.runtime.lastError;};

try {
    chrome.privacy.network.networkPredictionEnabled.set({
        value: prefetchWebpages,
        scope: 'regular'
    }, callback);
} catch(ex) {
    console.error(ex);
}

/*To keep track of current active frames. Needs tab id and frame id to associate them.
  Keeps track of various details used to properly block all ads
  Based on datastructure from catblock repo
*/
frameData = {
	// Returns the data object for the frame with ID frameId on the tab with
	// ID tabId
	get: function(tabId, frameId) {
	    if (frameId !== undefined)
	        return (frameData[tabId] || {})[frameId];
	    return frameData[tabId];
	},

	// Record a tab points to a given url
	record: function(tabId, frameId, url) {
	    var fd = frameData;
	    if (!fd[tabId]) fd[tabId] = {};
	    fd[tabId][frameId] = {
	        url: url,
	        // Cache these as they'll be needed once per request
	        domain: parseUri(url).hostname,
	        resources: {}
	    };
	},

	//Track all new requests and the urls
	track: function(details) {
	    var fd = frameData, tabId = details.tabId;

	    // A hosted app's background page
	    if (tabId === -1) {return false;}

	    // New tab
	    if (details.type === 'main_frame') { 
	        delete fd[tabId];
	        fd.record(tabId, 0, details.url);
	        fd[tabId].blockCount = 0;
	        return true;
	    }

	    // Request from a tab opened before AdBlock started, or from a
	    // chrome:// tab containing an http:// iframe
	    if (!fd[tabId]) {return false;}

	    // Requests might come from unknown frames
	    var potentialEmptyFrameId = (details.type === 'sub_frame' ? details.parentFrameId: details.frameId);
	    if (undefined === fd.get(tabId, potentialEmptyFrameId)) {
	        fd.record(tabId, potentialEmptyFrameId, fd.get(tabId, 0).url);
	    }

	    // New frame
	    if (details.type === 'sub_frame') { 
	        fd.record(tabId, details.frameId, details.url);
	    }

	    return true;
	},

	// Save a resource for the resource blocker.
	storeResource: function(tabId, frameId, url, elType, frameDomain) {
	    var data = frameData.get(tabId, frameId);
	    if (data !== undefined) {
	        data.resources[elType + ":|:" + url + ":|:" + frameDomain] = null;
	    }
	},

	removeTabId: function(tabId) {
	    delete frameData[tabId];
	}
};

//Adds a listener for all requests
chrome.webRequest.onBeforeRequest.addListener(insepectURL,{urls:  ['<all_urls>']},["blocking"]);

/*
* Function to inspect all url requests and the potentially block
*/
function insepectURL(details){
	//Check if ad blocking is enabled
	if(blockAds){
		return {cancel : false};
	}

	details.url = getUnicodeUrl(details.url);

	if (!frameData.track(details))
	    return { cancel: false };

	var tabId = details.tabId;
	var requestType = getRequestType({url: details.url, type: details.type});
	var requestingFrameId = (requestType === 'sub_frame' ? details.parentFrameId : details.frameId);
	var elementType = getElementType(requestType);

	var frameDomain = frameData.get(tabId, requestingFrameId).domain;
	frameData.storeResource(tabId, requestingFrameId, details.url, elementType, frameDomain);

	//Check to see if malware site
	if(blockMalware)
		if(checkMalware(details.url)){
			return {cancel: true};
		}

  	var blocked = checkMatch(details.url, elementType, frameDomain);

	//Log data to console for debugging purposes
	if(!showOnlyBlocked || (showOnlyBlocked && blocked !== null)){
		console.log("URL: " + details.url + "\tTab ID: " + tabId + "\tRequest Type: " + requestType + "\tElement Type: " 
		+ elementType + "\n\tDomain: " + frameDomain + "\tRequesting Frame: " + requestingFrameId + "\tBlocked: " + blocked);
		console.log(blocked);
	}

	//Redirect subdocuments to a blank page
  	if(blocked && (elementType === "subdocument")){
  		return { redirectUrl: "about:blank" };
  	}
  	
	//Didn't match against any rules
	return {cancel: (blocked !== null && !blocked.whiteList)};
}


//Once a tab is removed, we don't need to keep its data
chrome.tabs.onRemoved.addListener(frameData.removeTabId);

//Get tab details for already opened tabs
var handleEarlyOpenedTabs = function(tabs) {
  for (var i = 0; i < tabs.length; i++) {
    var currentTab = tabs[i], tabId = currentTab.id;
    if (!frameData.get(tabId)) {
        currentTab.url = getUnicodeUrl(currentTab.url);
        frameData.track({url: currentTab.url, tabId: tabId, type: "main_frame"});
    }
  }
}

//Query all tabs using http and https
chrome.tabs.query({url: "http://*/*"}, handleEarlyOpenedTabs);
chrome.tabs.query({url: "https://*/*"}, handleEarlyOpenedTabs);

//Make sure to update tab ids if the change in any way
chrome.webNavigation.onTabReplaced.addListener(function(details) {
    frameData.removeTabId(details.replacedTabId);
});

//Used for html5 history api changes
chrome.webNavigation.onHistoryStateUpdated.addListener(function(details) {
    if (details && details.hasOwnProperty("frameId") && details.hasOwnProperty("tabId") && details.hasOwnProperty("url") && details.hasOwnProperty("transitionType") && details.transitionType === "link") {
        var tabData = frameData.get(details.tabId, details.frameId);
        if (tabData && tabData.url !== details.url) {
            details.type = 'main_frame';
            details.url = getUnicodeUrl(details.url);
            frameData.track(details);
        }
    }
});

//Listen for commands to change settings
chrome.extension.onConnect.addListener(function(port) {
	port.onMessage.addListener(function(msg) {
	    //Prefetch settings
	    if(msg.command === "prefetch-change"){
	    	prefetchWebpages = !prefetchWebpages;
	    	port.postMessage({prefetch:prefetchWebpages});

	    	try {
			    chrome.privacy.network.networkPredictionEnabled.set({
			        value: prefetchWebpages,
			        scope: 'regular'
			    }, callback);
			} catch(ex) {
			    console.error(ex);
			}
	    }
	    if(msg.command === "prefetch-status"){
	    	port.postMessage({prefetch:prefetchWebpages});
	    }
	    //Malware settings
	    if(msg.command === "malware-change"){
	    	blockMalware = !blockMalware;
	    	port.postMessage({malware:blockMalware});
	    }
	    if(msg.command === "malware-status"){
	    	port.postMessage({malware:blockMalware});
	    }
	    //Blocker settings
	    if(msg.command === "blocker-change"){
	    	blockAds = !blockAds;
	    	port.postMessage({blocker:blockAds});
	    }
	    if(msg.command === "blocker-status"){
	    	port.postMessage({blocker:blockAds});
	    }  
	});
});