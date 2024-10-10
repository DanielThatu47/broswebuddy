chrome.runtime.onInstalled.addListener(function() {
  chrome.contextMenus.create({
    id: "summarize",
    title: "Summarize text",
    contexts: ["selection"]
  });
  chrome.contextMenus.create({
    id: "translate",
    title: "Translate text",
    contexts: ["selection"]
  });
});

chrome.contextMenus.onClicked.addListener(function(info, tab) {
  chrome.storage.sync.get(['apiKey'], function(result) {
    if (!result.apiKey) {
      console.error('API key not found. Please set your OpenAI API key in the extension popup.');
      return;
    }

    const selectedText = info.selectionText;
    let prompt;
    let action;

    if (info.menuItemId === "summarize") {
      prompt = `Please summarize the following text:\n\n${selectedText}`;
      action = "Summary";
    } else if (info.menuItemId === "translate") {
      prompt = `Please translate the following text to English:\n\n${selectedText}`;
      action = "Translation";
    }

    fetchChatGPTResponse(result.apiKey, prompt, action, tab.id);
  });
});

async function fetchChatGPTResponse(apiKey, prompt, action, tabId) {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [{
          role: "user",
          content: prompt
        }]
      })
    });

    const data = await response.json();
    const result = data.choices[0].message.content;
    
    // Log to extension's background script console
    console.log(`${action} result:`, result);
    
    // Execute a content script to log in the webpage's console
    chrome.scripting.executeScript({
      target: { tabId: tabId },
      func: (actionType, text) => {
        console.log(`ChatGPT ${actionType} Result:`, text);
      },
      args: [action, result]
    });
    
    // Create a notification with the result
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icon48.png',
      title: `ChatGPT ${action}`,
      message: result
    });
  } catch (error) {
    console.error('Error:', error);
    alert('Error processing request. Please check your API key and try again.');
  }
}