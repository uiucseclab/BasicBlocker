//Get the status of current ad blocker
function setStatus(){
	var port = chrome.extension.connect({name: "popup connection"});
	port.postMessage({command:"prefetch-status"});
	port.postMessage({command:"blocker-status"});
	port.postMessage({command:"malware-status"});
	port.onMessage.addListener(function(msg) {
	        console.log("message recieved: "+ msg);
	        if(msg.prefetch !== undefined)
	        	document.getElementById("prefetch").checked = msg.prefetch;
	        if(msg.malware !== undefined)
	        	document.getElementById("malware").checked = msg.malware;
	       	if(msg.blocker !== undefined)
	        	document.getElementById("blocker").checked = msg.blocker;
	});
}

//Send commands to change settings
function changePrefetch(){
	var port = chrome.extension.connect({name: "popup connection"});
	port.postMessage({command:"prefetch-change"});
	port.onMessage.addListener(function(msg) {
	        console.log("message recieved: "+ msg);
	});
}

function changeMalware(){
	var port = chrome.extension.connect({name: "popup connection"});
	port.postMessage({command:"malware-change"});
	port.onMessage.addListener(function(msg) {
	        console.log("message recieved: "+ msg);
	});
}

function changeAds(){
	var port = chrome.extension.connect({name: "popup connection"});
	port.postMessage({command:"blocker-change"});
	port.onMessage.addListener(function(msg) {
	        console.log("message recieved: "+ msg);
	});
}

//Update when dom is loaded
document.addEventListener('DOMContentLoaded', function () {
	setStatus();
	document.getElementById("prefetch").addEventListener("click", changePrefetch);
	document.getElementById("malware").addEventListener("click", changeMalware);
	document.getElementById("blocker").addEventListener("click", changeAds);
});