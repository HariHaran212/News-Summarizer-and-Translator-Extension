let newsSummary = "";
let isSpeaking = false; // Track if speech is in progress

// Google Cloud TTS API Key (replace with your own key)
const GOOGLE_TTS_API_KEY = "YOUR_GOOGLE_CLOUD_TTS_API_KEY";

// Summarize the News content
document.getElementById("summarizeBtn").addEventListener("click", () => {
  const summaryField = document.getElementById("summary");
  summaryField.innerText = "⏳ Loading summary..."; // Show loading message
  
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.scripting.executeScript({
      target: { tabId: tabs[0].id },
      function: extractText
    }, (results) => {
      if (!results || !results[0] || results[0].result.length === 0) {
        summaryField.innerHTML = "⚠️ Error extracting text.";
        return;
      }
      const text = results[0].result;
      chrome.runtime.sendMessage({ action: "summarize", text }, (response) => {
        // Example (use with caution!)
        newsSummary = (response.summary).length > 60 ? (response.summary).substring(7, (response.summary).length-3) : response.summary;
        summaryField.innerHTML = newsSummary;
        newsSummary = summaryField.innerText;

        // Enable social media sharing
        enableShareButtons(newsSummary);
      });
    });
  });
});

// Extract text from website
function extractText() {
  return document.body.innerText.substring(0, 10000); // Limit to 4000 characters
}
  
// Translate the Summarized Text
document.getElementById("translateBtn").addEventListener("click", async () => {
  document.getElementById("hidden").innerHTML = (document.getElementById("summary").innerHTML).replaceAll('<h1>', ' ***** ').replaceAll('</h1>', ' _____ ').replaceAll('<h2>', ' **** ').replaceAll('</h2>', ' ____ ').replaceAll('<p>', ' *** ').replaceAll('</p>', ' ___ ');
  const text = document.getElementById("hidden").innerText;
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
      const translatedContent = (data.translation).replaceAll('*****', '<h1>').replaceAll('_____', '</h1>').replaceAll('****', '<h2>').replaceAll('____', '</h2>').replaceAll('***', '<p>').replaceAll('___', '</p>');
      outputDiv.innerHTML = translatedContent;

      // Enable social media sharing
      enableShareButtons(outputDiv.innerText);
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
    // Find the closest button to ensure clicks inside <i> are detected
    const button = event.target.closest("button");

    if (!button) return; // Exit if it's not a button

    // Determine the target div based on which button was clicked
    const targetId = button.id === "copySummary" ? "summary" : "translatedText";
    const textElement = document.getElementById(targetId);

    if (textElement) {
      // Range of text
      let range = document.createRange();
      range.selectNodeContents(textElement);
      let selection = window.getSelection();
      selection.removeAllRanges(); // Remove all previous range
      selection.addRange(range); // Set range for the text selection

      
      // Copy the text
      document.execCommand("copy"); 
    }
  }

  // Add event listeners to both buttons
  document.getElementById("copySummary").addEventListener("click", copyText);
  document.getElementById("copyTranslatedText").addEventListener("click", copyText);

  
  // Add text-to-speech functionality
  function speakText(event) {
    // Find the closest button to ensure clicks inside <i> are detected
    const button = event.target.closest("button");
    if (!button) return; // Exit if it's not a button

    // Determine the target div based on which button was clicked
    const targetId = button.id === "speakSummary" ? "summary" : "translatedText";
    const textElement = document.getElementById(targetId);
    const text = textElement.innerText;

    if (text && text !== "Summary will appear here..." && text !== "Translated Content will appear here...") {
      // Toggle speech
      if (isSpeaking) {
        window.speechSynthesis.cancel();
        isSpeaking = false;
        button.innerHTML = '<i class="fa fa-volume-up"></i>';
        button.title = "Speak";
      } else {
        const targetLang = targetId === "summary" ? 'en' : document.getElementById("language").value;

        // Try browser's native TTS first
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = targetLang;

        utterance.onend = function() {
          isSpeaking = false;
          button.innerHTML = '<i class="fa fa-volume-up"></i>';
          button.title = "Speak";
        };

        utterance.onerror = function(event) {
          console.error("Browser TTS failed, falling back to Google TTS:", event.error);
          // If browser TTS fails, use Google Cloud TTS
          useGoogleTTS(text, targetLang, button);
        };

        // Change button to stop icon
        button.innerHTML = '<i class="fa fa-stop"></i>';
        button.title = "Stop";
        isSpeaking = true;

        window.speechSynthesis.speak(utterance);
      }
    }
  }

  // Function to use Google Cloud TTS
  async function useGoogleTTS(text, languageCode, button) {
    
    document.getElementById("translationError").innerText = '';
    const url = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${GOOGLE_TTS_API_KEY}`;
    const requestBody = {
      input: { text },
      voice: { languageCode },
      audioConfig: { audioEncoding: "MP3" },
    };

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) throw new Error("Google TTS API request failed");

      const data = await response.json();
      const audioContent = data.audioContent;

      // Decode and play the audio
      const audio = new Audio(`data:audio/mp3;base64,${audioContent}`);
      audio.play();

      // Change button to stop icon
      button.innerHTML = '<i class="fa fa-stop"></i>';
      button.title = "Stop";
      isSpeaking = true;

      // When audio ends
      audio.onended = function() {
        isSpeaking = false;
        button.innerHTML = '<i class="fa fa-volume-up"></i>';
        button.title = "Speak";
      };
    } catch (error) {
      console.error("Google TTS error:", error);
      isSpeaking = false;
      button.innerHTML = '<i class="fa fa-volume-up"></i>';
      button.title = "Speak";
    }
  }

  // Add event listeners to speak buttons
  document.getElementById("speakSummary").addEventListener("click", speakText);
  document.getElementById("speakTranslatedText").addEventListener("click", speakText);
});

