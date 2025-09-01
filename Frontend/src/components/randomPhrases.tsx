// src/components/RandomPhrase.tsx
import React, { useEffect, useState } from "react";
import { getRandomPhrase } from "../utils/phrases_notscraping";
import "../assets/css/randomphrases.css"; 

const RandomPhrase: React.FC = () => {
  const [phrase, setPhrase] = useState(getRandomPhrase());
  const [fade, setFade] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setFade(false); // start fade out
      setTimeout(() => {
        setPhrase(getRandomPhrase()); // change phrase
        setFade(true); // fade in
      }, 700); // match fade-out duration
    }, 6000); // every 6 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`phrase ${fade ? "fade-in" : "fade-out"}`}>
      <h2>{phrase}</h2>
    </div>
  );
};

export default RandomPhrase;
