// src/components/RandomPhrase.tsx
import React, { useEffect, useState } from "react";
import { getRandomPhrasesScraping } from "../utils/phrases_scraping";
import "../assets/css/randomphrases.css"; 

const RandomPhrasesScraping: React.FC = () => {
  const [phrase, setPhrase] = useState(getRandomPhrasesScraping());
  const [fade, setFade] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setFade(false); // start fade out
      setTimeout(() => {
        setPhrase(getRandomPhrasesScraping()); // change phrase
        setFade(true); // fade in
      }, 700); // match fade-out duration
    }, 15000); // every 15 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`phrase ${fade ? "fade-in" : "fade-out"}`}>
      <h2>{phrase}</h2>
    </div>
  );
};

export default RandomPhrasesScraping;
