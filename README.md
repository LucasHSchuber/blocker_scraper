# Blocket Scraper

Blocket Scraper is a real-time ad scraper and notifier for [Blocket.se](https://www.blocket.se). It monitors user-defined searches, filters new listings by time and price, and sends instant desktop notifications when matching ads appear.

Feel free to use whenever you're hunting stuff on blocket!

---

## Features

- **Real-Time Scraping**: Automatically scrapes Blocket every 2 minutes using Puppeteer and Cheerio.
- **Filters**: Only shows ads uploaded “today” and within a user-specified price range.
- **Notifications**: Sends desktop notifications for new ads, with toggleable user control.
- **WebSocket Updates**: Emits new ads to connected clients in real-time via Socket.IO.
- **Image Handling**: Collects images for each ad.
- **API Endpoints**: Start/stop scraping, toggle notifications on/off, and fetch latest ads.

Feel free to use whenever you're hunting stuff on blocket!

---

## Getting Started

### Prerequisites

- Node.js >= 18
- npm or yarn

### Installation

```bash
git clone https://github.com/LucasHSchuber/blocker_scraper.git
cd blocker_scraper
cd frontend
npm install
cd ..
cd backend
npm install  

start server in one terminal:
node server.js

start client in antoher terminal
-> head into frontend directory
npm run dev
--> the browser/app will open. 


