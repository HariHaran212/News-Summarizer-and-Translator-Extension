// Summarize the News content
document.getElementById("summarizeBtn").addEventListener("click", () => {
  const summaryField = document.getElementById("summary");
  summaryField.value = "⏳ Loading summary..."; // Show loading message
  
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.scripting.executeScript({
      target: { tabId: tabs[0].id },
      function: extractText
    }, (results) => {
      if (!results || !results[0]) {
        summaryField.value = "⚠️ Error extracting text.";
        return;
      }
      const text = results[0].result;
      chrome.runtime.sendMessage({ action: "summarize", text }, (response) => {
        summaryField.value = response.summary;

        // Enable social media sharing
        enableShareButtons(response.summary);
      });
    });
  });
});

// Extract text from website
function extractText() {
  return document.body.innerText.substring(0, 2000); // Limit to 2000 characters
}
  
// Translate the Summarized Text
document.getElementById("translateBtn").addEventListener("click", async () => {
  const text = document.getElementById("summary").value;
  const targetLang = document.getElementById("language").value;
  const outputDiv = document.getElementById("translatedText");

  if (!text.trim()) {
      outputDiv.innerText = "⚠️ No text found to translate.";
      return;
  }

  outputDiv.innerText = "⏳ Translating..."; // Show loading message
  
  const url = `https://lingva.ml/api/v1/en/${targetLang}/${encodeURIComponent(text)}`;

  try {
      const response = await fetch(url);
      if (!response.ok) throw new Error("API request failed");

      const data = await response.json();
      outputDiv.innerText = data.translation;

      // Enable social media sharing
      enableShareButtons(data.translation);
  } catch (error) {
      outputDiv.innerText = "❌ Translation failed. Try again.";
      console.error("Error:", error);
  }
});


// Function to enable social media sharing
function enableShareButtons(summary) {
  const encodedSummary = encodeURIComponent(summary);

  // Helper function to prevent multiple event listeners
  function setShareListener(buttonId, url) {
    const button = document.getElementById(buttonId);
    if (!button) return;

    // Remove any existing event listener
    button.replaceWith(button.cloneNode(true));
    
    // Get the new button reference and attach event listener
    const newButton = document.getElementById(buttonId);
    newButton.addEventListener("click", () => {
      window.open(`${url}${encodedSummary}`, "_blank");
    });
  }

  // Set event listeners for each share button
  setShareListener("shareWhatsapp", "https://api.whatsapp.com/send?text=");
  setShareListener("shareTwitter", "https://twitter.com/intent/tweet?text=");
  setShareListener("shareFacebook", "https://www.facebook.com/sharer/sharer.php?u=");
  setShareListener("shareLinkedin", "https://www.linkedin.com/shareArticle?mini=true&url=");
  setShareListener("shareTelegram", "https://t.me/share/url?url=");
}


// Event listerners and functions for copying text
document.addEventListener("DOMContentLoaded", () => {
  // Function to copy text
  function copyText(event) {
    // Determine the target textarea based on the clicked button
    const targetId = event.target.id === "copySummary" ? "summary" : "translatedText";
    const textArea = document.getElementById(targetId);

    // Select and copy the text
    textArea.select();
    document.execCommand("copy");

    // Provide user feedback (optional)
    // alert("Copied: " + textArea.value);
  }

  // Add event listeners to both buttons
  document.getElementById("copySummary").addEventListener("click", copyText);
  document.getElementById("copyTranslatedText").addEventListener("click", copyText);
});

