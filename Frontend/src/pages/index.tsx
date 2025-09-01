import React, { useState, useEffect } from "react";
import axios from "axios";
import { io } from "socket.io-client";
import "../assets/css/index.css";
import type { SearchItem } from "../models/model";
// import { getRandomPhrase } from '../utils/phrases_notscraping';
import RandomPhrases from "../components/randomPhrases";
import RandomPhrasesScraping from "../components/randomPhrasesScraping";
import AdsModal from "../components/adsModal";
import { useWakeLock } from "../utils/useWakeLock";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBell, faAngleDown, faAngleUp } from "@fortawesome/free-solid-svg-icons";
import ClearIcon from '@mui/icons-material/Clear';
// const socket = io("http://localhost:4000");


// interface SearchItem {
//   word: string;
//   location: string;
//   minPrice?: number;
//   maxPrice?: number;
// }

const Index: React.FC = () => {
  const [searches, setSearches] = useState<SearchItem[]>([
    { word: "pax", location: "stockholm" },
    // { word: "segelbåt", location: "stockholm" },
    // { word: "garderob", location: "stockholm" },
    // { word: "cykel", location: "stockholm", maxPrice: 4000 },
    { word: "överskåp", location: "stockholm" },
    { word: "garderobsdörrar", location: "stockholm" },
    { word: "garderobsdörr", location: "stockholm" },
    { word: "porsche", location: "hela_sverige" },
    // { word: "volvo", location: "hela_sverige", maxPrice: 100000 }
  ]);
  const [showModal, setShowModal] = useState(false);
  const [scraping, setScraping] = useState(false);
  const [notification, setNotification] = useState(true);
  const [openNewSearch, setOpenNewSearch] = useState(false);
  const [newSearch, setNewSearch] = useState<SearchItem>({
    word: "",
    location: "",
    minPrice: undefined,
    maxPrice: undefined
  });
  const [latestAds, setLatestAds] = useState<any[]>([]);
  const [shownAds, setShownAds] = useState<any[]>([]); // ads that have already been shown in modal
  const [modalAds, setModalAds] = useState<any[]>([]); // ads currently visible in modal
  useWakeLock(scraping); // Wake up os when scraping

  useEffect(() => {
    const socket = io("http://localhost:4000");
    // Connection logs
    socket.on("connect", () => {
      console.log("✅ Connected to backend via Socket.IO", socket.id);
    });

    socket.on("disconnect", () => {
      console.log("❌ Disconnected from backend");
    });

    // Listen for new ads
    socket.on("newAds", (ads: any[]) => {
      setLatestAds(prev => {
        const allAds = [...ads, ...prev];
        // remove duplicates by link
        const uniqueAds = Array.from(new Map(allAds.map(ad => [ad.link + ad.title, ad])).values()); // ad.link + ad.title?
        return uniqueAds;
      });
    });

    // Listen for scrape status
    socket.on("scrapeStatus", (status: { running: boolean; message: string }) => {
      console.log("Scrape status:", status.message);
      setScraping(status.running);
    });

    // Clean up on unmount
    return () => {
      socket.disconnect();
    };
  }, []); // empty dependency => runs once


  useEffect(() => {
    console.log("latestAds", latestAds)
    // filter out ads already shown
    const newAds = latestAds.filter(
      ad => !shownAds.some(shown => shown.link + shown.title === ad.link + ad.title)
    );
  
    if (newAds.length > 0) {
      setModalAds(newAds);       // only show these in the modal
      setShowModal(true);         // trigger modal open
    }
  }, [latestAds]);
  
  // Modal close handler
  const handleCloseModal = () => {
    // add modalAds to shownAds so they won't appear again
    setShownAds(prev => [...prev, ...modalAds]);
    setModalAds([]);     // clear modalAds
    setShowModal(false); // close modal
  };;




  const editSearch = (index: number) => {
    const item = searches[index];
    setNewSearch({ ...item });
    const updated = [...searches];
    updated.splice(index, 1);
    setSearches(updated);
  };

  const addSearch = () => {
    if (!newSearch.word || !newSearch.location) return;
    setSearches([...searches, newSearch]);
    setNewSearch({ word: "", location: "", minPrice: undefined, maxPrice: undefined });
  };

  const removeSearch = (index: number) => {
    const updated = [...searches];
    updated.splice(index, 1);
    setSearches(updated);
  };


  const startScrape = async () => {
    setScraping(true);
    console.log("searches", searches);
    try {
        const response = await axios.post("http://localhost:4000/api/start", searches, {
          headers: {
            "Content-Type": "application/json"
          }
        });
        console.log("✅ Searches updated:", response.data);
      } catch (error) {
        console.error("❌ Error sending searches:", error);
      }
  }

  const stopScrape = async () => {
    setScraping(false);
    try {
        const stopResponse = await axios.post(
            "http://localhost:4000/api/scrape/stop",
            {}, // empty body
            { headers: { "Content-Type": "application/json" } } // config
          );          
        console.log("✅ stopped:", stopResponse.data);
      } catch (error) {
        console.error("❌ Error topping scrape:", error);
      }
  }
  
  const toggleNotification = async () => {
    const newStatus = !notification;
    setNotification(newStatus); // optimistically update UI
    try {
      await axios.post("http://localhost:4000/api/notifications/toggle", {
        enable: newStatus
      }, {
        headers: { "Content-Type": "application/json" }
      });
      console.log("✅ Notification toggle sent:", newStatus);
    } catch (error) {
      console.error("❌ Error toggling notification:", error);
      setNotification(!newStatus); // revert UI if error
    }
  };

  return (
    <div className="app-container">
      {/* Left Panel */}
      <div className="left-panel" style={{ flex: scraping ? 3 : 5 }}>
        <h1>Seekr</h1>
        <div 
            className="notifications" 
            style={{ 
                display: "flex", 
                alignItems: "center", 
                justifyContent: "flex-end",
                gap: "8px",
                marginRight: "1em"
            }}
            >
            <span style={{ marginRight: "0.5em", fontSize: "0.8em" }}>{!notification ? "Turn on notifications  -->" : ""}</span>
            <FontAwesomeIcon icon={faBell} className={notification ? "notification-on-btn" : "notification-off-btn"} onClick={toggleNotification} />
        </div>
        <div className="search-list">
          <h2>Active Scrapes:</h2>
          {searches.map((s, idx) => (
            <div key={idx} className="search-item-wrapper">
                <div className="search-item">
                    <h2>"{s.word}" in <span style={{ fontWeight: "700" }}>{s.location}</span> 
                    {(s.minPrice || s.maxPrice) && (
                    <div>
                        | Price 
                        {s.minPrice && s.maxPrice ? (
                            <span>: {s.minPrice} - {s.maxPrice}</span>
                        ) : s.minPrice && !s.maxPrice ? (
                            <span>: Above {s.minPrice} kr</span>
                        ) : s.maxPrice && !s.minPrice ? (
                            <span>: Below {s.maxPrice} kr </span>
                        ): null} 
                    </div>  
                    )}
                    </h2>
                </div>
                <button onClick={() => editSearch(idx)} className="edit-btn">✏️</button>
                {/* <button onClick={() => removeSearch(idx)} className="delete-btn">🗑️</button> */}
                <ClearIcon onClick={() => removeSearch(idx)} className="delete-btn" />
            </div>
          ))}
        </div>
        <div>
            <button className="new-search-btn" onClick={() => setOpenNewSearch(!openNewSearch)}>New Scrape {openNewSearch ? <FontAwesomeIcon icon={faAngleUp} /> : <FontAwesomeIcon icon={faAngleDown} /> }</button>
        </div>
        {openNewSearch && (
            <div className="new-search">
                <input
                    type="text"
                    placeholder="Search word"
                    value={newSearch.word}
                    onChange={(e) => setNewSearch({ ...newSearch, word: e.target.value })}
                />
                <select
                    value={newSearch.location}
                    onChange={(e) => setNewSearch({ ...newSearch, location: e.target.value })}
                    style={{
                        color: newSearch.location === "" ? "#757575" : "black"
                    }}
                    >
                    <option value=""  disabled>Select location</option>
                    <option value="stockholm">Stockholm</option>
                    <option value="hela_sverige">Hela Sverige</option>
                </select>
                <div style={{ display: "flex", gap: "4px" }}>
                    <input
                        type="number"
                        placeholder="Minimum price"
                        value={newSearch.minPrice || ""}
                        onChange={(e) => setNewSearch({ ...newSearch, minPrice: Number(e.target.value) })}
                    />
                    <input
                        type="number"
                        placeholder="Maximum price"
                        value={newSearch.maxPrice || ""}
                        onChange={(e) => setNewSearch({ ...newSearch, maxPrice: Number(e.target.value) })}
                    />
                </div>
                <button title="Add new search" onClick={addSearch} className="add-btn">+</button>
            </div>
            )}
       </div>

        {/* Right Panel */}
        <div className="right-panel">
            <div className={`scraping-status ${scraping ? "visible" : "hidden"}`}>
                <div className="spinner"></div>
                <h1>Scraping... Hold on!</h1>
                {notification ? (
                    <p><RandomPhrasesScraping /></p>
                ) : (
                    <p>Don’t forget to turn the notifications on to be notified when we find a match!</p>
                )}
                <button onClick={() => stopScrape()} className="stop-btn">
                Stop scraping!
                </button>
            </div>

            <div className={`not-scraping-status ${!scraping ? "visible" : "hidden"}`}>
                <RandomPhrases />
                <button onClick={() => startScrape()} className="start-btn">
                Start scraping!
                </button>
            </div>
        </div>
        <AdsModal open={showModal} ads={modalAds} onClose={handleCloseModal}  />
    </div>
  );
};

export default Index;
