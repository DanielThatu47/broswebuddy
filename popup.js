const API_KEY = 'AIzaSyCrfHFbl833tr8_luQ05ilsQt5sh2IyZZQ'; // Replace with your actual Gemini API key

document.addEventListener('DOMContentLoaded', function() {
  const summarizeBtn = document.getElementById('summarizeBtn');
  const translateBtn = document.getElementById('translateBtn');
  const resultDiv = document.getElementById('result');
  const loadingDiv = document.getElementById('loading');
  const translateLangSelect = document.getElementById('translateLang');
  const summaryLengthSelect = document.getElementById('summaryLength');

  // Save preferences when changed
  translateLangSelect.addEventListener('change', savePreferences);
  summaryLengthSelect.addEventListener('change', savePreferences);

  // Load saved preferences
  loadPreferences();

  async function processText(action) {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      const selection = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: () => window.getSelection().toString()
      });
      
      const selectedText = selection[0].result;
      
      if (!selectedText) {
        showError("Please select some text on the page first.");
        return;
      }

      showLoading();

      let prompt;
      if (action === 'translate') {
        const targetLanguage = translateLangSelect.value;
        prompt = `Please translate the following text to ${targetLanguage}:\n\n${selectedText}`;
      } else {
        const summaryLength = summaryLengthSelect.value;
        let lengthInstruction;
        switch(summaryLength) {
          case 'brief':
            lengthInstruction = 'in 1-2 sentences';
            break;
          case 'moderate':
            lengthInstruction = 'in a short paragraph';
            break;
          case 'detailed':
            lengthInstruction = 'in several paragraphs, including key details';
            break;
        }
        prompt = `Please summarize the following text ${lengthInstruction}:\n\n${selectedText}`;
      }

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }]
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Unknown error occurred');
      }

      const result = data.candidates[0].content.parts[0].text;
      showResult(result);
    } catch (error) {
      handleError(error);
    }
  }

  function showLoading() {
    loadingDiv.style.display = 'block';
    resultDiv.textContent = '';
  }

  function showResult(text) {
    loadingDiv.style.display = 'none';
    resultDiv.textContent = text;
  }

  function showError(message) {
    loadingDiv.style.display = 'none';
    resultDiv.innerHTML = `<div style="color: red;">Error: ${message}</div>`;

    if (message.includes('quota') || message.includes('billing')) {
      resultDiv.innerHTML += `
        <div style="margin-top: 10px;">
          <b>Need help with API setup?</b><br>
          1. Ensure you've enabled the Gemini API in Google Cloud Console<br>
          2. Check your quota limits<br>
          3. Verify your API key is correct<br>
          <a href="https://console.cloud.google.com/apis/api/generativelanguage.googleapis.com" target="_blank">Go to Google Cloud Console</a>
        </div>
      `;
    }
  }

  function handleError(error) {
    console.error('Error:', error);
    let message = error.message;
    
    if (message.includes('quota')) {
      message = "API quota exceeded. Please check your Google Cloud Console quota limits.";
    } else if (message.includes('invalid')) {
      message = "Invalid API key. Please check your API key.";
    }
    
    showError(message);
  }

  function savePreferences() {
    const preferences = {
      translateLang: translateLangSelect.value,
      summaryLength: summaryLengthSelect.value
    };
    chrome.storage.sync.set({ preferences });
  }

  function loadPreferences() {
    chrome.storage.sync.get(['preferences'], function(result) {
      if (result.preferences) {
        translateLangSelect.value = result.preferences.translateLang;
        summaryLengthSelect.value = result.preferences.summaryLength;
      }
    });
  }

  summarizeBtn.addEventListener('click', () => processText('summarize'));
  translateBtn.addEventListener('click', () => processText('translate'));
});