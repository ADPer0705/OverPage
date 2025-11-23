document.addEventListener('DOMContentLoaded', async () => {
  const initialView = document.getElementById('initial-view');
  const chatView = document.getElementById('chat-view');
  const pageTitleSpan = document.getElementById('page-title');
  const chatBtn = document.getElementById('chat-btn');
  const statusDiv = document.getElementById('status');
  const chatHistory = document.getElementById('chat-history');
  const userInput = document.getElementById('user-input');
  const sendBtn = document.getElementById('send-btn');

  let pageContent = '';
  let pageUrl = '';

  // Get current tab info
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  if (tab) {
    pageTitleSpan.textContent = tab.title;
    pageUrl = tab.url;
  } else {
    pageTitleSpan.textContent = "No active tab found";
    chatBtn.disabled = true;
  }

  // Chat with site button handler
  chatBtn.addEventListener('click', async () => {
    statusDiv.textContent = "Scraping...";
    chatBtn.disabled = true;
    chatBtn.textContent = "Processing...";

    try {
      // Inject script to get text content
      const [{ result }] = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          // Simple scraper: get visible text
          // This runs in the context of the webpage
          return document.body.innerText;
        }
      });

      pageContent = result;
      
      // Switch to chat view
      initialView.classList.add('hidden');
      chatView.classList.remove('hidden');
      statusDiv.textContent = "Connected";
      
      // Optional: Send initial "hello" or context to backend here if needed
      // For now, we just store the content locally to send with questions
      
    } catch (err) {
      console.error(err);
      statusDiv.textContent = "Error";
      chatBtn.textContent = "Retry";
      chatBtn.disabled = false;
      alert("Failed to access page content. Make sure you are on a valid webpage.");
    }
  });

  // Send message handler
  async function sendMessage() {
    const text = userInput.value.trim();
    if (!text) return;

    // Add user message to UI
    appendMessage('user', text);
    userInput.value = '';
    
    // Show loading state
    const loadingId = appendMessage('ai', 'Thinking...');
    const loadingMsg = document.getElementById(loadingId);

    try {
      // Call PHP Backend
      const response = await fetch('http://localhost:8000/api.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'chat',
          url: pageUrl,
          content: pageContent, // In a real app, might want to cache this on server instead of sending every time
          query: text
        })
      });

      if (!response.ok) throw new Error('Network response was not ok');
      
      const data = await response.json();
      
      // Update AI message
      if (loadingMsg) {
        loadingMsg.textContent = data.reply || "No response from AI.";
      }

    } catch (error) {
      console.error('Error:', error);
      if (loadingMsg) {
        loadingMsg.textContent = "Error connecting to backend. Is the PHP server running?";
        loadingMsg.style.color = "red";
      }
    }
  }

  sendBtn.addEventListener('click', sendMessage);
  userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
  });

  function appendMessage(role, text) {
    const div = document.createElement('div');
    div.className = `message ${role}`;
    div.textContent = text;
    const id = 'msg-' + Date.now();
    div.id = id;
    chatHistory.appendChild(div);
    chatHistory.scrollTop = chatHistory.scrollHeight;
    return id;
  }
});
