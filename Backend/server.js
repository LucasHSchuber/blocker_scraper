import * as cheerio from "cheerio";
import express from "express";
import cron from "node-cron";
import puppeteer from "puppeteer";
import player from "play-sound";
import path from "path";
import notifier from "node-notifier";
import cors from "cors";
import { Server } from "socket.io";
import http from "http"
import axios from "axios";

const app = express();
app.use(cors()); // allow all origins
app.use(express.json());
const httpServer = http.createServer(app);

// Create Socket.IO server
const io = new Server(httpServer, {
  cors: { origin: "*" },
});

// Socket.IO connection
io.on("connection", (socket) => {
  console.log("✅ A client connected");

  socket.on("disconnect", () => {
    console.log("❌ A client disconnected");
  });
});

// ------ USER INPUT ---- 
// const searches = [
//   { word: "garderob", location: "stockholm", minPrice: null, maxPrice: null },
//   { word: "pax", location: "stockholm", minPrice: null, maxPrice: null },
//   { word: "segelbåt", location: "stockholm", minPrice: 10000, maxPrice: 35000 },
//   { word: "ps5", location: "stockholm", minPrice: 2000, maxPrice: 5000 },
// ];

const PORT = 4000;
const sound = player();

let searches = [];
let userSupressNotify = false;
let suppressNotify = true;
let notifyTimer = null
// When the scraping starts or searches are updated
if (suppressNotify) {
  setTimeout(() => {
    suppressNotify = false;
    console.log("🔔 Notifications are now enabled.");
  }, 60 * 1000); // 60 seconds
}
let seenAdsMap = {}; // { "volvo": Set, "pax": Set }
searches.forEach(s => seenAdsMap[s.word] = new Set());
let latestAds = [];


function enableNotificationsAfterDelay() {
  // always reset
  suppressNotify = true;
  if (notifyTimer) clearTimeout(notifyTimer);

  notifyTimer = setTimeout(() => {
    suppressNotify = false;
    console.log("🔔 Notifications are now enabled.");
  }, 60 * 1000);
}


async function runScrape({ word, location, minPrice, maxPrice }) {
  const url = `https://www.blocket.se/annonser/${location}?q=${word}&r=${location === "stockholm" ? 11 : 0}`;  // stockholm -> code = 11, hela_sverige -> code = 0
  try {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.setCacheEnabled(false);

    await page.goto(url, { waitUntil: "networkidle2" });
    await page.waitForSelector("article");

    const newAds = await page.evaluate((searchWord) => {
      const ads = [];
      document.querySelectorAll("article").forEach(article => {
        const titleEl = article.querySelector("h2");
        const linkEl = article.querySelector("a");
        const priceEl = article.querySelector("[class*='Price']");
        const adlocationEl = article.querySelector("[class*='TopInfoLink']");
        const timeEl = article.querySelector("[class*='Time-sc']");
        
        if (titleEl && linkEl) {
          ads.push({
            searchWord: searchWord,
            title: titleEl.innerText.trim(),
            link: linkEl.href,
            price: priceEl ? priceEl.innerText.trim() : "N/A",
            adlocation: adlocationEl ? adlocationEl.innerText.trim() : "N/A",
            time: timeEl ? timeEl.innerText.trim() : "N/A",
          });
        }
      });
      return ads;
    }, word);

    await browser.close();

    // Filter new ads
    const seenAds = seenAdsMap[word];
    const freshAds = newAds.filter(ad => !seenAds.has(ad.title + ad.link));
    freshAds.forEach(ad => seenAds.add(ad.title + ad.link));
    
    const todaysAds = freshAds.filter(ad => {
      const isToday = ad.time.includes("Idag"); 
      if (!isToday){return} // keep object if uploaded includes "Idag"
      const isWithingFifteenMin = validateUploadTime(ad); // Make sure uploaded time is not older than 15 min
      const isWithinPriceRange = validatePrice(ad, minPrice, maxPrice); // Make sure price is iwthin user input price range 
      return isWithingFifteenMin && isWithinPriceRange;
    })
    
    if (todaysAds.length > 0) {
      for (const ad of todaysAds) {
        const realAdTitle = await getRealAdUrl(ad.link); 
        if (!realAdTitle) continue;
        ad.link2 = realAdTitle;
        // console.log("realAdTitle", realAdTitle)
        const imgUrl = await getImageFromAd(realAdTitle);
        // console.log("imgUrl", imgUrl)
        ad.image = imgUrl;
      }

      console.log(`🚨 todaysAds New ${word} ad found:`, todaysAds);
      console.log(`userSupressNotify::::`, userSupressNotify);
      // loopFreshAds(freshAds, minPrice, maxPrice);
      if (!suppressNotify) {  
        if (!userSupressNotify) {
          todaysAds.forEach(el => notify(word, location, el.adlocation));
          console.log("🚀 Emitting ads count:", todaysAds.length);
        }
        io.emit("newAds", todaysAds);
      }
      latestAds = [...todaysAds, ...latestAds]; 
    } else {
      console.log(`ℹ️ No new ${word} ads this time.`);
    }
  } catch (err) {
    console.error(`❌ Scraping error (${word}):`, err.message);
  }
}


function validateUploadTime(ad) {
    const now = new Date();
    const currentTime = new Intl.DateTimeFormat('en-US', {hour: 'numeric', minute: 'numeric',  hour12: false}).format(now);
    console.log("currentTime (now time hh::mm", currentTime);
    const splittedTime = ad.time.split(" ");
    console.log("splittedTime", splittedTime);
    const time = splittedTime[1];
    console.log("Uploaded ad time", time);
    let [hour, min] = time.split(":").map(Number);
    const adDate = new Date();
    adDate.setHours(hour, min, 0, 0);
    const diffMs = now.getTime() - adDate.getTime();
    const diffMinutes = diffMs / (1000 * 60);
    console.log("⏳ Difference (minutes):", diffMinutes);
    return diffMinutes <= 15 && diffMinutes >= 0; // Return true if ad is not older than 15 minutes
}

function validatePrice(ad, minPrice, maxPrice) {
  if (ad.price && ad.price !== "N/A" && (minPrice != null || maxPrice != null)) {
      const priceStr = ad.price.slice(0, -3).replace(/\s/g, "");  
      const priceNum = Number(priceStr);
      console.log("priceNum ad", priceNum);
      console.log("min price user", minPrice);
      console.log("max price user", maxPrice);
      const min = minPrice != null ? minPrice : 0;
      const max = maxPrice != null ? maxPrice : Infinity;
      if (priceNum >= min && priceNum <= max) { // If price matches user input maxprice and minprice
        return true;
      } else {
        console.log("Ad doesnt match user price range!")
        return false;
      }
  } else {
      // console.log("Price is N/A or user hasnt requested price range!")
      return true;
  }
}

// Get the actual url of the ad
async function getRealAdUrl(searchUrl) {
  const { data } = await axios.get(searchUrl);
  const $ = cheerio.load(data);
  let realUrl = null;
  $("a[href^='/annons/']").each((i, el) => {
    const href = $(el).attr("href");
    const title = $(el).text().trim(); // or $(el).find("h2").text().trim()
    if (href) {
      realUrl = "https://www.blocket.se" + href;
      return false; // stop looping once we found the first one
    }
  });
  return realUrl || false;
}

// Find ad image
async function getImageFromAd(link) {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto(link, { waitUntil: "networkidle0" });

  // Query all divs with background-image
  const imageUrls = await page.evaluate(() => {
    const divs = Array.from(document.querySelectorAll("div[style*='background-image']"));
    return divs
      .map(div => {
        const style = div.style.backgroundImage; // e.g., url("...")
        const match = style.match(/url\(["']?(.*?)["']?\)/);
        if (!match) return null;
        const url = match[1].trim();
        return url.length > 0 ? url : null; // ignore empty strings
      })
      .filter(url => url !== null); // remove nulls and the weird incoming \" images
  });

  await browser.close();
  return imageUrls; // returns an array of image URLs
}

// async function getImageFromAd(link) {
//   const browser = await puppeteer.launch({ headless: true });
//   const page = await browser.newPage();
//   await page.goto(link, { waitUntil: "networkidle0" });

//   // Query the div with background-image
//   const imageUrl = await page.evaluate(() => {
//     const div = document.querySelector("div[style*='background-image']");
//     if (!div) return null;
//     const style = div.style.backgroundImage; // "url(...)"
//     const match = style.match(/url\("?(.+?)"?\)/);
//     return match ? match[1] : null;
//   });

//   await browser.close();
//   return imageUrl;
// }




function notify(word, location, adlocation) {
  notifier.notify(
    {
      title: `New "${word}" Blocket Ad!`,
      message: `A new ${word} ad was found in ${
        location === "stockholm" ? location : adlocation + ", " + location
      }.`,
      sound: true,
      wait: false,
      appID: "BlocketScraperApp", 
      // icon: __dirname + "/assets/blocket.png", // Change image -> path to image 
    },
    (err, response) => {
      if (err) console.error("Notifier error:", err);
      else console.log("Notification sent:", response);
    }
  );
}


// // Loop through new ads to check for "free" or price range
// function loopFreshAds(freshAds, minPrice, maxPrice) {
//   freshAds.forEach(ad => {
//     // const words = ad.title.toLowerCase().split(" ");
//     // if (words.includes("gratis") || words.includes("bortskänkes") || words.includes("free")) {
//     //   console.log("🔔 Free ad found:", ad.title, ad.price, ad.link);
//     //   playSound();
//     // }

//     // CHECK TIME IS TODAY
//     const splittedTime = ad.time.split(" ");
//     console.log("splittedTime[0]", splittedTime[0]);
//     if (splittedTime[0] === "Idag") {
//       console.log("Ad passed checked time!")
//     } else {
//       return false;
//     }

//     // CHECK PRICE
//     if (ad.price !== "N/A" && minPrice && maxPrice) {
//       const priceStr = ad.price.slice(0, -3).replace(/\s/g, "");
//       const priceNum = Number(priceStr);
//       const min = minPrice != null ? minPrice : 0;
//       const max = maxPrice != null ? maxPrice : Infinity;
//       if (priceNum >= min && priceNum <= max) { // If price matches user input maxprice and minprice
//         // Do something
//         // playSound();
//         return true;
//       } else {
//         console.log("Ad doesnt match user price range!")
//         return false;
//       }
//     } else {
//       console.log("Price is N/A or user hasnt requested price range!")
//     }
//   });
// }

// Play sound
// function playSound() {
//   const soundPath = path.join(process.cwd(), "sounds", "sound1.mp3");
//   sound.play(soundPath, err => {
//     if (err) console.error("Error playing sound:", err);
//   });
// }

// Scrape every second minute
// cron.schedule("*/2 * * * *", () => {
//   searches.forEach(s => runScrape(s));
// });
// let scrapeJob = cron.schedule("*/2 * * * *", () => {
//   searches.forEach(s => runScrape(s));
// });



let scrapeJob = cron.schedule("*/2 * * * *", async () => {
  try {
    for (const s of searches) {
      await runScrape(s);
    }
  } catch (err) {
    console.error("❌ Scrape stopped due to error:", err);
    io.emit("scrapeStatus", { running: false, message: "Scraping stopped unexpectedly" });
  }
});


// Run immediately
searches.forEach(s => runScrape(s));


// -------- API endpoints ---------

app.get("/api/ads", (req, res) => res.json(latestAds));

app.post("/api/start", (req, res) => {
  const newSearches = req.body; // expecting array of {word, location, minPrice, maxPrice}
  if (!Array.isArray(newSearches)) {
    return res.status(400).json({ error: "Expected an array of searches" });
  }
  searches = newSearches;
  // Reset seenAdsMap for new searches
  seenAdsMap = {};
  searches.forEach(s => seenAdsMap[s.word] = new Set());
  console.log("✅ Updated searches:", searches);
  if (!scrapeJob.running) {
    scrapeJob.start();
  }
  enableNotificationsAfterDelay();
  searches.forEach(s => runScrape(s));
  res.json({ success: true, searches });
});


app.post("/api/scrape/stop", (req, res) => {
  // if (scrapeJob.running) {
    scrapeJob.stop();
    // latestAds = [];
    // seenAdsMap = {}
    suppressNotify = true;
    if (notifyTimer) {
      clearTimeout(notifyTimer);
      notifyTimer = null;
    }
    console.log("⏹ Scraping stopped. 🔕 Notifications will be suppressed on next start.");
    res.json({ success: true, message: "Scraping stopped" });
  // } else {
  //   scrapeJob.stop();
  //   res.json({ success: false, message: "Scraping is already stopped" });
  // }
});


app.post("/api/notifications/toggle", (req, res) => {
  const { enable } = req.body; // expecting { enable: true } or { enable: false }
  if (typeof enable !== "boolean") {
    return res.status(400).json({ success: false, message: "enable must be boolean" });
  }
  const oldState = userSupressNotify;
  userSupressNotify = !enable; // if enable=true => userSupressNotify=false
  console.log("🔕 Notifications toggle! ", enable);
  console.log(`🔄 userSupressNotify changed: ${oldState} → ${userSupressNotify}`);
  res.json({ success: true, userSupressNotify });
});


// app.listen(PORT, () => {
//   console.log(`✅ Backend running at http://localhost:${PORT}`);
// });
httpServer.listen(PORT, () => {
  console.log(`✅ Backend running at http://localhost:${PORT}`);
});

