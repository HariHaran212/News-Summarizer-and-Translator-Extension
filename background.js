const GEMINI_API_KEY = "AIzaSyCwIYYA9hMSIQWKxwn7QUi59NCvl1sRKGo";

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "summarize") {
    fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: `Summarize the following news article briefly (not exceeding 100 words) and jsut give it like an article without any extra prompts: ${request.text}` }] }]
      }),
    })
    .then(response => response.json())
    .then(data => {

      // Check if the expected structure exists
      const summaryText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (summaryText) {
        sendResponse({ summary: summaryText });
      } else {
        console.error("API response error: Unexpected response structure", data);
        sendResponse({ summary: "Summary not available. Please try again later." });
      }
    })
    .catch(error => {
      console.error("Fetch error:", error);
      sendResponse({ summary: "API request failed. Check API key or quota." });
    });

    return true; // Keeps async response open
  }
});
