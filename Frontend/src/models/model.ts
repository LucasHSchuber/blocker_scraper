// Models
export interface SearchItem {
    word: string;
    location: string;
    minPrice?: number;
    maxPrice?: number;
  }
export interface Ad {
    searchWord: string;
    title: string;
    link: string;
    link2: string;
    price: string;
    adlocation: string;
    time: string;
    image: string;
  }