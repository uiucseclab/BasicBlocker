var url = window.location.href;

var port = chrome.runtime.connect({name: "cosmetic-filter"});
port.postMessage({url: url, request: "get-cosmetic-filters"});

port.onMessage.addListener(function(msg) {
	//Doesn't do anything
	//TODO: add in cosmetic filtering
});