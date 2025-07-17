// DOM elements
const chatBox = document.getElementById("chatBox");
const userInput = document.getElementById("userInput");
const typingIndicator = document.getElementById("typing");
const clearBtn = document.getElementById("clearChat");

const API_KEY = "AIzaSyBRRKD_iciEsqDFKU8oDojqwBDF3umaulw";

// Load DOMPurify for safe rendering
const purifyScript = document.createElement('script');
purifyScript.src = 'https://cdn.jsdelivr.net/npm/dompurify@3.0.5/dist/purify.min.js';
document.head.appendChild(purifyScript);

// Append sanitized chat messages
function appendMessage(message, sender) {
    const bubble = document.createElement("div");
    bubble.className = `chat-bubble ${sender === 'user'
        ? 'bg-emerald-600 text-white self-end text-right ml-auto'
        : 'bg-slate-500 text-white mr-auto text-left'
    } p-2 rounded-lg mb-2 max-w-[75%] whitespace-pre-wrap`;

    const markdownConverted = message
        .replace(/\n/g, '<br>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>');

    bubble.innerHTML = window.DOMPurify ? DOMPurify.sanitize(markdownConverted) : markdownConverted;
    chatBox.appendChild(bubble);
    chatBox.scrollTop = chatBox.scrollHeight;
}

// Send message to Gemini API
async function sendMessage() {
    const text = userInput.value.trim();
    if (!text) return;

    appendMessage(text, "user");
    userInput.value = "";
    typingIndicator.classList.remove("hidden");
    saveToHistory(text, "user");

    try {
        const res = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    contents: [
                        {
                            parts: [{ text }]
                        }
                    ]
                })
            }
        );

        const data = await res.json();
        const reply =
            data.candidates?.[0]?.content?.parts?.[0]?.text ||
            "Sorry, I couldn't understand that.";

        appendMessage(reply, "bot");
        saveToHistory(reply, "bot");
    } catch (err) {
        console.error(err);
        appendMessage("Error connecting to Gemini API.", "bot");
    } finally {
        typingIndicator.classList.add("hidden");
    }
}

userInput.addEventListener("keypress", function (e) {
    if (e.key === "Enter") sendMessage();
});

window.addEventListener("load", () => {
    appendMessage("👋 Hello! I'm your Smart Energy Assistant. Ask me how to save electricity, reduce bills, or explore renewable energy like solar, wind, or rainwater harvesting!", "bot");
    loadHistory();
});

function saveToHistory(message, sender) {
    try {
        const history = JSON.parse(localStorage.getItem("chatHistory") || "[]");
        history.push({ message, sender });
        localStorage.setItem("chatHistory", JSON.stringify(history));
    } catch (e) {
        console.warn("Local storage not available.");
    }
}

function loadHistory() {
    try {
        const history = JSON.parse(localStorage.getItem("chatHistory") || "[]");
        history.forEach(({ message, sender }) => appendMessage(message, sender));
    } catch (e) {
        console.warn("Local storage not available.");
    }
}

clearBtn?.addEventListener("click", () => {
    try {
        localStorage.removeItem("chatHistory");
        chatBox.innerHTML = "";
        appendMessage("🧹 Chat history cleared. Ready for a new conversation!", "bot");
    } catch (e) {
        console.warn("Unable to clear chat.");
    }
});
