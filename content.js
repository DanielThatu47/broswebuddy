// content.js

// This script can be used to insert a safety badge on websites
// or to collect user interactions with the page.

(function() {
    // Inject a badge on the webpage
    function injectSafetyBadge(score) {
      const badge = document.createElement('div');
      badge.style.position = 'fixed';
      badge.style.bottom = '10px';
      badge.style.right = '10px';
      badge.style.backgroundColor = score >= 50 ? 'green' : 'red';
      badge.style.color = 'white';
      badge.style.padding = '5px 10px';
      badge.style.borderRadius = '5px';
      badge.style.zIndex = '10000';
      badge.innerText = `Safety Score: ${score}`;
      document.body.appendChild(badge);
    }
  
    // Function to retrieve safety score from storage and inject badge
    function checkAndInject() {
      chrome.runtime.sendMessage({ action: 'getSafetyScore', url: location.hostname }, (response) => {
        if (response && response.score) {
          injectSafetyBadge(response.score);
        }
      });
    }
  
    // Initial execution
    checkAndInject();
  
    // Listen for updates to the score
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.action === 'updateSafetyScore') {
        injectSafetyBadge(request.score);
      }
    });
  })();
  