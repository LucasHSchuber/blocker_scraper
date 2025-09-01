// src/utils/phrases.ts
export const phrases = [
    "Hunting down the best deals… hold tight!",
    "Let the Blocket treasure hunt begin!",
    "Searching high and low for your hidden gems…",
    "Hold tight, we’re digging deep through the Blocket jungle!",
    "Scraping stuff faster than a squirrel on espresso…",
    "Hunting your ads like a ninja in socks!",
    "Scanning like a raccoon in a dumpster… fast and furious!",
    "Patience, young padawan… the tresures are coming...",

  ];
  
  export function getRandomPhrasesScraping() {
    const index = Math.floor(Math.random() * phrases.length);
    return phrases[index];
  }
  