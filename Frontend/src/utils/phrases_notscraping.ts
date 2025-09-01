// src/utils/phrases.ts
export const phrases = [
    "Your next bargain is just around the corner!",
    "Let’s find your stuff before anyone else!",
    "What are you waiting for? Let's get scraping!",
    "Something amazing is waiting for you!"
  ];
  
  export function getRandomPhrase() {
    const index = Math.floor(Math.random() * phrases.length);
    return phrases[index];
  }
  