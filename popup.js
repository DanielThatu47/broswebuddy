document.addEventListener("DOMContentLoaded", () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const currentTab = tabs[0];
    const url = new URL(currentTab.url).hostname;

    fetchSafetyScore(url).then(score => {
      document.getElementById("safety-status").innerText = `Safety Score: ${score}`;
      setIcon(score);
    });

    document.getElementById("submitScore").addEventListener("click", () => {
      const score = document.getElementById("score").value;
      chrome.runtime.sendMessage({
        action: "submitSafetyScore",
        url: url,
        score: score,
        user: "currentUser"
      }, (response) => {
        alert(response.message);
      });
    });

    document.getElementById("viewReport").addEventListener("click", () => {
      fetch(`http://localhost:3000/api/report?url=${url}`)
        .then(response => response.json())
        .then(data => {
          document.getElementById("report").innerText = JSON.stringify(data, null, 2);
        });
    });
  });
});

function fetchSafetyScore(url) {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get("safetyScores", (data) => {
      resolve(data.safetyScores[url] || "Not reviewed");
    });
  });
}

function setIcon(score) {
  let iconPath = "icons/icon_green.png";
  if (score === "Not reviewed") {
    iconPath = "icons/icon_yellow.png";
  } else if (score < 50) {
    iconPath = "icons/icon_red.png";
  }
  chrome.action.setIcon({ path: iconPath });
}
