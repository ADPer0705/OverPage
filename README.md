# OverPage

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![PHP](https://img.shields.io/badge/PHP-8.0%2B-777BB4?logo=php&logoColor=white)](https://www.php.net/)
[![Status](https://img.shields.io/badge/Status-Development-orange)]()

A browser extension + PHP backend that analyzes the content of any webpage using an AI model.
The extension scrapes the page you're viewing, sends the cleaned text to a PHP backend, and receives an AI-generated explanation, summary, or answer to user questions.

This project is built for the Web-Dev-Tech course finals and intentionally uses **HTML, CSS, JavaScript, and PHP** as required.
Later versions will expand the backend with Python for more advanced ML and RAG workflows.

---

## 📑 Table of Contents

- [Features](#-features)
- [Project Structure](#-project-structure)
- [How It Works](#-how-it-works-architecture)
- [Installation](#-installation)
- [Usage](#-usage)
- [Tech Stack](#-tech-stack)
- [Roadmap](#-roadmap-post-finals--real-project-plan)
- [Contributions](#-contributions)
- [License](#-license)

---

## 🚀 Features

### **Browser Extension**

* **On-Demand Processing**: To save system resources, the extension only processes the page when you click **"Chat with site"**.
* **Active Page Tracking**: Automatically identifies the current active tab.
* **Chat Interface**: Simple, clean chat UI to ask questions about the content.
* **Cross-Browser Design**: Built with WebExtensions standards. Priority support for **Chrome**, with Firefox support planned.

### **PHP Backend**

* Receives scraped page content + user query
* Cleans and preprocesses the text
* Sends the request to an AI API (OpenAI/Groq/etc.)
* Returns the AI response to the extension
* (Optional) Logs queries and responses
* (Optional) Provides a small dashboard to view logs

### **LLM Integration**

* Uses external API model via PHP `curl`
* No local ML setup required
* Future upgrade path: plug in a Python FastAPI microservice for embeddings and advanced processing

---

## 🧱 Project Structure

```
root/
│
├── extension/
│   ├── manifest.json
│   ├── content.js
│   ├── background.js
│   ├── popup.html
│   ├── popup.js
│   └── styles.css
│
├── backend/
│   ├── api.php
│   ├── dashboard.php (optional)
│   ├── db.sqlite (optional)
│   └── README_BACKEND.md
│
└── README.md
```

---

## 🔧 How It Works (Architecture)

```
Browser Webpage
      │
      ▼
Extension (content.js)
Extracts text + metadata
      │
      ▼
Extension (background.js)
Sends JSON → PHP backend
      │
      ▼
PHP Backend (api.php)
Cleans text, calls LLM API
      │
      ▼
AI Model (OpenAI/Groq/...)
Processes query + context
      │
      ▼
PHP Backend
Returns response
      │
      ▼
Extension
Displays answer to user
```

---

## ⚙️ Installation

### 1. Clone the repository

```bash
git clone https://github.com/<your-name>/ai-webpage-analyzer.git
```

### 2. Set up the backend (PHP)

* Place the `backend/` folder in a PHP-enabled server
  (Apache, Nginx, XAMPP, WAMP, or even the built-in PHP server)

Start the server:

```bash
php -S localhost:8000 -t backend
```

### 3. Update API key

Inside `backend/api.php`, set your OpenAI or Groq API key.

### 4. Load the browser extension

* Open Chrome/Brave → `chrome://extensions`
* Enable **Developer Mode**
* Click **Load unpacked**
* Select the `extension/` folder

Done.

---

## 🧪 Usage

1. Visit any webpage
2. Open the extension popup
3. Ask a question like:

   * *"Summarize this page"*
   * *"What is this documentation trying to explain?"*
   * *"Explain this in simple terms."*
4. The extension sends the page text to PHP
5. PHP calls the LLM API
6. Response appears in the extension

---

## 🛠️ Tech Stack

**Frontend / Extension**

* HTML
* CSS
* JavaScript
* Chrome Extension (Manifest V3)

**Backend**

* PHP (API forwarding, preprocessing, logging)

**AI**

* External LLM API (OpenAI, Groq, or LM Studio HTTP server)

---

## 📌 Roadmap (Post-Finals / Real Project Plan)

### Phase 1 — Current (PHP MVP)

* Basic scraping
* Query → AI → response
* PHP backend
* Minimal UI

### Phase 2 — Shift ML Work to Python

* Add FastAPI backend
* Add embeddings (`nomic-embed-text`)
* Add RAG
* Implement multi-page crawling (2-layer)
* Add local storage / caching

### Phase 3 — Full Productization

* Replace PHP with pure microservice
* Add user settings
* Add history
* Add tab-aware context
* Add workflow-aware assistant

---

## 🤝 Contributions

Feel free to fork and explore deeper ML integrations, better UI, or multi-page RAG extensions.

---

## 📜 License

MIT License (modify as needed).

