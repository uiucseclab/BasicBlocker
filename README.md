# CS460Project - A Basic Blocker
<b>Introduction</b><br />

One of the most popular  web extensions is an ad blocker. The main purpose of it is to block intrusive advertising that disrupts the user experience. These extensions also block the user from malicious sites and scripts, protecting them as they surf the web. This project aims to learn from previous ad blocker examples to develop a basic ad/script blocker that can be expanded upon in the future. <br>
Our project was developed as a simple chrome extension. We implemented a listener that intercepts all web requests before they are sent. These requests are then processed, extracting a url, object type, and domain, and then are tested against a list of filters to check . Additionally, the blocker  <br />
The filters are loaded from EasyList and have the appropriate settings and a corresponding regular expression to check against.<br />
Also, it can block the malware websites by matching the url with the malware domain list.<br />
Besides, we also implemented an UI let the user to make some basic options.<br />

<b>Basic Options</b><br>
<b>    Prefetch</b> - Chrome tries to prefetch websites based on context within the omnibox. However, this can potentially lead to malicious content or ads being loaded. As such, this is disabled by default, but it can enabled or disabled. <br>
<b>    Block Malware Sites</b> - There is also an option to enable/disable blocking of malware ridden domains.<br>
<b>    Block Ads</b> - This is basically turn on/off the ad block functionality. 

<br /><br /><br />
How to use it:<br />
1. Download the files<br />
2. Goto the extention in chrome and enable developer mode<br />
3. Load unpacked extension, select folder where you saved the files<br />
4. Refresh the page and your Ads are gone! (mostly)<br />

<b>References</b><br>
Based off the following sources:
uBlock: https://github.com/gorhill/uBlock/tree/master/src<br>
AdBlockPlus: https://github.com/adblockplus/<br>