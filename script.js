const robot = document.getElementById('robot');
const chatbox = document.getElementById('chatbox');
const micBtn = document.getElementById('micBtn');
const toggleBtn = document.getElementById('darkToggle');

function addChat(message, sender = 'user') {
  const msg = document.createElement('div');
  msg.className = `chat ${sender}`;
  msg.textContent = message;
  chatbox.appendChild(msg);
  chatbox.scrollTop = chatbox.scrollHeight;
}

function changeDirection(direction) {
  const srcs = {
    left: 'https://blob.sololearn.com/courses/robot-l.jpg',
    right: 'https://blob.sololearn.com/courses/robot-r.jpg',
    center: 'https://blob.sololearn.com/courses/robot-c.jpg'
  };
  robot.src = srcs[direction] || srcs.center;
  addChat(`Turning ${direction}.`, 'ai');
  speak(`Turning ${direction}`);
}

function speak(text) {
  if (!window.speechSynthesis) return;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'en-US';
  speechSynthesis.speak(utterance);
}

// Voice Recognition setup
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition;
let listening = false;

if (SpeechRecognition) {
  recognition = new SpeechRecognition();
  recognition.lang = 'en-US';
  recognition.continuous = false;
  recognition.interimResults = false;

  recognition.onresult = async (e) => {
    const transcript = e.results[0][0].transcript.trim();
    addChat(transcript, 'user');
    await handleCommand(transcript);
  };

  recognition.onend = () => {
    if (listening) recognition.start();
  };
}

function toggleListening() {
  if (!SpeechRecognition) return;
  listening = !listening;
  if (listening) {
    recognition.start();
    micBtn.textContent = "🛑 Stop Listening";
    micBtn.classList.add('listening');
  } else {
    recognition.stop();
    micBtn.textContent = "🎤 Start Listening";
    micBtn.classList.remove('listening');
  }
}

micBtn.addEventListener('click', toggleListening);

// Dark mode toggle
function toggleDarkMode(forceMode = null) {
  const isDark = forceMode === "dark" || (!forceMode && !document.body.classList.contains("dark"));
  document.body.classList.toggle("dark", isDark);
  localStorage.setItem("theme", isDark ? "dark" : "light");
  toggleBtn.textContent = isDark ? "☀️" : "🌙";
}

window.onload = () => {
  const saved = localStorage.getItem("theme");
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const useDark = saved === "dark" || (!saved && prefersDark);
  toggleDarkMode(useDark ? "dark" : "light");
};

toggleBtn.addEventListener("click", () => toggleDarkMode());

// Your helper APIs:

async function getWeather(city) {
  try {
    const response = await fetch(`https://wttr.in/${encodeURIComponent(city)}?format=3`);
    if (!response.ok) return `Could not find weather for "${city}".`;
    return await response.text();
  } catch {
    return "Sorry, unable to fetch the weather right now.";
  }
}

async function getWikipediaSummary(query) {
  try {
    const res = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`);
    const data = await res.json();
    return data.extract || "No information found.";
  } catch {
    return "Unable to get Wikipedia summary.";
  }
}

async function getAIResponse(prompt) {
  const OPENAI_API_KEY = 'YOUR_OPENAI_API_KEY_HERE';  // <-- Replace with your actual key or import from config.js
  const endpoint = "https://api.openai.com/v1/chat/completions";

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }]
      })
    });
    const data = await res.json();
    return data.choices?.[0]?.message?.content || "I'm not sure how to help with that.";
  } catch {
    return "Error reaching AI service.";
  }
}

// Unified handleCommand with all features:
async function handleCommand(text) {
  const lower = text.toLowerCase();

  if (lower.includes("left")) return changeDirection("left");
  if (lower.includes("right")) return changeDirection("right");
  if (lower.includes("center") || lower.includes("reset")) return changeDirection("center");

  if (lower.includes("enable dark")) {
    toggleDarkMode("dark");
    speak("Dark mode enabled.");
    addChat("Dark mode enabled.", "ai");
    return;
  }

  if (lower.includes("disable dark")) {
    toggleDarkMode("light");
    speak("Dark mode disabled.");
    addChat("Dark mode disabled.", "ai");
    return;
  }

  if (lower.startsWith("search for image")) {
    const topic = lower.replace("search for image", "").trim();
    const url = `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(topic)}`;
    speak(`Searching images for ${topic}`);
    window.open(url, "_blank");
    return;
  }

  if (lower.startsWith("weather in")) {
    const city = lower.replace("weather in", "").trim();
    const weather = await getWeather(city);
    addChat(weather, 'ai');
    speak(weather);
    return;
  }

  if (lower.startsWith("wikipedia") || lower.startsWith("tell me about")) {
    const query = lower.replace("wikipedia", "").replace("tell me about", "").trim();
    const summary = await getWikipediaSummary(query);
    addChat(summary, 'ai');
    speak(summary);
    return;
  }

  const reply = await getAIResponse(text);
  addChat(reply, 'ai');
  speak(reply);
}


