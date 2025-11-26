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
  let conversationHistory = []; // Store chat history locally

  // Function to update UI with current tab info
  async function updateCurrentTabInfo() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab) {
      pageTitleSpan.textContent = tab.title;
      pageUrl = tab.url;
      chatBtn.disabled = false;
    } else {
      pageTitleSpan.textContent = "No active tab found";
      chatBtn.disabled = true;
    }
    return tab;
  }

  // Initial load
  await updateCurrentTabInfo();

  // Listen for tab changes to keep UI in sync
  chrome.tabs.onActivated.addListener(updateCurrentTabInfo);
  chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (tab.active && changeInfo.status === 'complete') {
      updateCurrentTabInfo();
    }
  });

  // Chat with site button handler
  chatBtn.addEventListener('click', async () => {
    statusDiv.textContent = "Scraping...";
    chatBtn.disabled = true;
    chatBtn.textContent = "Processing...";

    try {
      // Get the FRESH active tab
      const tab = await updateCurrentTabInfo();
      if (!tab) throw new Error("No active tab");

      // Inject script to get text content
      const [{ result }] = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          // Special handling for Google Search Results
          if (window.location.hostname.includes('google.com') && window.location.pathname.includes('/search')) {
            const results = [];
            // Select main search result containers
            const elements = document.querySelectorAll('.g');
            
            elements.forEach((el, index) => {
              const titleEl = el.querySelector('h3');
              const linkEl = el.querySelector('a');
              const snippetEl = el.querySelector('.VwiC3b, .IsZvec, .ITZIwc'); // Common snippet classes
              
              if (titleEl && linkEl) {
                results.push({
                  rank: index + 1,
                  title: titleEl.innerText,
                  link: linkEl.href,
                  snippet: snippetEl ? snippetEl.innerText : ''
                });
              }
            });

            if (results.length > 0) {
              return "GOOGLE SEARCH RESULTS SUMMARY:\n\n" + results.map(r => 
                `Result #${r.rank}: ${r.title}\nURL: ${r.link}\nSummary: ${r.snippet}\n`
              ).join('\n-------------------\n');
            }
          }

          // Default: get visible text
          return document.body.innerText;
        }
      });

      pageContent = result;
      
      // Switch to chat view
      initialView.classList.add('hidden');
      chatView.classList.remove('hidden');
      statusDiv.textContent = "Connected";
      
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
    userInput.style.height = 'auto'; // Reset textarea height
    
    // Add to history
    conversationHistory.push({ role: 'user', content: text });

    // Show loading state
    const loadingId = appendMessage('ai', 'Thinking...');
    const loadingMsg = document.getElementById(loadingId);

    try {
      // Get navigation trail
      const storageData = await chrome.storage.local.get('navigationTrail');
      const trail = storageData.navigationTrail || [];

      // Call PHP Backend
      const response = await fetch(CONFIG.API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'chat',
          url: pageUrl,
          content: pageContent,
          query: text,
          history: conversationHistory, // Send full history
          trail: trail // Send navigation trail
        })
      });

      if (!response.ok) throw new Error('Network response was not ok');
      
      const data = await response.json();
      const reply = data.reply || "No response from AI.";
      
      // Update AI message
      if (loadingMsg) {
        loadingMsg.textContent = reply;
      }

      // Add AI response to history
      conversationHistory.push({ role: 'assistant', content: reply });

    } catch (error) {
      console.error('Error:', error);
      if (loadingMsg) {
        loadingMsg.textContent = "Error: Could not connect to backend. Is the PHP server running?";
        loadingMsg.style.color = "red";
      }
    }
  }

  sendBtn.addEventListener('click', sendMessage);
  
  // Handle Enter to send, Shift+Enter for new line
  userInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  // Auto-resize textarea as user types
  userInput.addEventListener('input', () => {
    userInput.style.height = 'auto';
    userInput.style.height = Math.min(userInput.scrollHeight, 120) + 'px';
  });

  // Counter for unique message IDs
  let messageCounter = 0;

  function appendMessage(role, text) {
    const div = document.createElement('div');
    div.className = `message ${role}`;
    // Preserve line breaks in messages
    div.style.whiteSpace = 'pre-wrap';
    div.textContent = text;
    const id = 'msg-' + Date.now() + '-' + (++messageCounter);
    div.id = id;
    chatHistory.appendChild(div);
    chatHistory.scrollTop = chatHistory.scrollHeight;
    return id;
  }

  // Reset textarea height after sending
  function resetTextarea() {
    userInput.style.height = 'auto';
  }
});
