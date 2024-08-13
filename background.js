require('dotenv').config();
const GOOGLE_SAFE_BROWSING_API_KEY = process.env.GOOGLE_SAFE_BROWSING_API_KEY;
const VIRUSTOTAL_API_KEY = process.env.VIRUSTOTAL_API_KEY;

let safetyScores = {};

chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.local.set({ safetyScores: {} });
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "submitSafetyScore") {
        submitSafetyScore(request.url, request.score, request.user).then(response => {
            sendResponse({ status: "success", message: response.message });
        }).catch(error => {
            sendResponse({ status: "error", message: error.message });
        });
        return true; // Keep the message channel open for sendResponse
    }
});

async function checkSafety(url) {
    let safetyScore = await fetchSafetyScore(url);
    return safetyScore;
}

async function fetchSafetyScore(url) {
    return new Promise((resolve, reject) => {
        chrome.storage.local.get("safetyScores", (data) => {
            if (data.safetyScores[url]) {
                resolve(data.safetyScores[url]);
            } else {
                fetch(`https://broswebuddy.onrender.com/api/check?url=${url}`)
                    .then(response => response.json())
                    .then(data => {
                        safetyScores[url] = data.score;
                        chrome.storage.local.set({ safetyScores: safetyScores });
                        resolve(data.score);
                    })
                    .catch(reject);
            }
        });
    });
}

function submitSafetyScore(url, score, user) {
    return new Promise((resolve, reject) => {
        fetch("https://localhost:3000/api/submit", {
            method: "POST",
            body: JSON.stringify({ url, score, user }),
            headers: { "Content-Type": "application/json" }
        })
            .then(response => response.json())
            .then(resolve)
            .catch(reject);
    });
}















function checkWithGoogleSafeBrowsing(url) {
    const requestUrl = `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${GOOGLE_SAFE_BROWSING_API_KEY}`;

    const body = {
        client: {
            clientId: "yourcompanyname",
            clientVersion: "1.5.2"
        },
        threatInfo: {
            threatTypes: ["MALWARE", "SOCIAL_ENGINEERING"],
            platformTypes: ["ANY_PLATFORM"],
            threatEntryTypes: ["URL"],
            threatEntries: [{ url: url }]
        }
    };

    return fetch(requestUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
    })
        .then(response => response.json())
        .then(data => {
            if (data.matches) {
                return { safe: false, data: data.matches };
            }
            return { safe: true };
        })
        .catch(error => {
            console.error('Error checking Google Safe Browsing:', error);
            return { safe: true }; // Default to safe if error
        });
}

// Usage within the checkSafety function
async function checkSafety(url) {
    // Existing logic...

    // Check with Google Safe Browsing
    const safeBrowsingResult = await checkWithGoogleSafeBrowsing(url);
    if (!safeBrowsingResult.safe) {
        notifyUser('This site is flagged by Google Safe Browsing!', 'unsafe');
    }

    // Additional logic...
}














function checkWithVirusTotal(url) {
    const requestUrl = `https://www.virustotal.com/api/v3/urls`;

    // Encode the URL in base64
    const urlEncoded = btoa(url);

    return fetch(`${requestUrl}/${urlEncoded}`, {
        method: 'GET',
        headers: {
            'x-apikey': VIRUSTOTAL_API_KEY
        }
    })
        .then(response => response.json())
        .then(data => {
            if (data.data.attributes.last_analysis_stats.malicious > 0) {
                return { safe: false, data: data.data.attributes.last_analysis_stats };
            }
            return { safe: true };
        })
        .catch(error => {
            console.error('Error checking VirusTotal:', error);
            return { safe: true }; // Default to safe if error
        });
}

// Usage within the checkSafety function
async function checkSafety(url) {
    // Existing logic...

    // Check with VirusTotal
    const virusTotalResult = await checkWithVirusTotal(url);
    if (!virusTotalResult.safe) {
        notifyUser('This site is flagged by VirusTotal!', 'unsafe');
    }

    // Additional logic...
}
