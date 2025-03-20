const GEMINI_API_KEY = "AIzaSyCwIYYA9hMSIQWKxwn7QUi59NCvl1sRKGo";

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "summarize") {
    fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: `Summarize the following news article briefly and jsut give it like an article without any extra prompts. If there are more headings then give summary for each heading (and each heading content not exceeding 100 words). give me output with html tags: ${request.text} . Important Note: Execute my commands using ONLY the information provided in the text above. Do not use any external knowledge. Give the content within html body only. Don't give html or body tags( Headings by <h1> or <h2> tags and remaining by <p> tag)` }] }]
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
