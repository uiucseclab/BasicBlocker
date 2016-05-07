# CS460Project - A Basic Blocker
<b>Introduction</b><br />

One of the most popular  web extensions is an ad blocker. The main purpose of it is to block intrusive advertising that disrupts the user experience. These extensions also block the user from malicious sites and scripts, protecting them as they surf the web. This project aims to learn from previous ad blocker examples to develop a basic ad/script blocker that can be expanded upon in the future. <br>
Our project was developed as a simple chrome extension designed to emulate the current functionality of ad blockers. We implemented a listener that intercepts all web requests before they are sent. These requests are then processed, extracting a url, object type, and domain, and then are tested against a list of filters to check. Then they are updated in an interal data structure to help to process later requests. The blocker will also block requests from 3rd parties and block attempts to connect to malicious third parties. <br>

<b>Basic Options</b><br>
<b>    Prefetch</b> - Chrome tries to prefetch websites based on context within the omnibox. However, this can potentially lead to malicious content or ads being loaded. As such, this is disabled by default, but it can enabled or disabled. <br>
<b>    Block Malware Sites</b> - There is also an option to enable/disable blocking of malware ridden domains.<br>
<b>    Block Ads</b> - This is basically turn on/off the ad block functionality. <br>

<b>How to use it:</b><br />
1. Download the files<br />
2. Goto the extention in chrome and enable developer mode<br />
3. Load unpacked extension, select folder where you saved the files<br />
4. Refresh the page and your Ads are gone! (mostly)<br />

<br>
<b>Future Directions</b><br>
There are still many features missing that prevent this from being a fully featured blocker. <br>
1. Implementation of cosmetic filtering/element hiding. Many sites are directly embedding ads preventing them from being blocked via blocking requests. This can be handled in many ways, but the most common is to inject css to hide these elements. However, doing this efficently and without just injecting a massive css sheet was beyond the current capabilites of this group. <br>
2. More comprehensive UI. The current UI is very basic and lacking in features. There should more control over filters and features that the user wants. <br>
3. Faster filter selection. Right now, the biggest bottleneck in the code is determing if a request is truely an ad. There should be lots more work put into optimization into this process. uBlock would be the best place to search for these optimizations.<br>

<b>References</b><br>
Based off the following sources:<br>
uBlock: https://github.com/gorhill/uBlock/tree/master/src<br>
AdBlockPlus: https://github.com/adblockplus/<br>
