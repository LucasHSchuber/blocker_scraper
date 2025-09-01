// components/AdsModal.tsx
import React, { useState, useEffect } from "react";
import { Modal, Box, Typography, Button, IconButton } from "@mui/material";
import { ArrowBack, ArrowForward } from "@mui/icons-material";
import "../assets/css/component_adsModal.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCopy } from "@fortawesome/free-solid-svg-icons";
import { useWakeLock } from "../utils/useWakeLock";
import AdImageCarousel from "./adimageCarousel";
import type { Ad } from "../models/model";


// interface Ad {
//   searchWord: string;
//   title: string;
//   link: string;
//   link2: string;
//   price: string;
//   adlocation: string;
//   time: string;
//   image: string;
// }

interface AdsModalProps {
  open: boolean;
  ads: Ad[];
  onClose: () => void;
}

const style = {
  position: 'absolute' as const,
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: "40em",
  // maxHeight: '86%',
  // minHeight: '86%',
  bgcolor: 'background.paper',
  borderRadius: 2,
  boxShadow: 24,
  p: 4,
  pb: 2,
  display: 'flex',
  flexDirection: 'column' as const,
  // alignItems: 'center',
  // justifyContent: 'center',
};

const AdsModal: React.FC<AdsModalProps> = ({ open, ads, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  useWakeLock(open);

  useEffect(() => {
    // Reset to first ad whenever new ads come in
    if (ads.length > 0) setCurrentIndex(0);
  }, [ads]);


  if (!ads || ads.length === 0) return null;

  const currentAd = ads[currentIndex];

  const handlePrev = () => {
    setCurrentIndex(prev => (prev === 0 ? ads.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex(prev => (prev === ads.length - 1 ? 0 : prev + 1));
  };


  const copyPlaceHolderText = (searchWord: string) => {
    var text = `Hej! Är intresserad av ${searchWord}n. Har du den kvar? I så fall hämtar jag den gärna idag/imorgon eller när det passar dig :) Allt gott`;
    navigator.clipboard.writeText(text).then(function() {
      console.log('Async: Copying to clipboard was successful!');
    }, function(err) {
      console.error('Async: Could not copy text: ', err);
    });
  }


  return (
    <Modal open={open} onClose={onClose}>
       <Box sx={style}>
          <Box 
            flex={1} 
            sx={{ 
              display: "flex", 
              alignItems: "center", 
              justifyContent: "space-between", 
              width: "100%", 
              marginTop: "0.2em",
              marginBottom: "0.2em"
            }}>
            <Box sx={{ width: "75px" }}/> 
            <Typography  variant="h6" 
            sx={{ textAlign: "center", flexGrow: 1, fontWeight: "900", fontSize: "1.6em", fontFamily: '"Indie Flower", "Patrick Hand", cursive'
            }}>Match for "{currentAd?.searchWord ?? ""}"</Typography>
            <Button 
              variant="outlined" 
              color="error" 
              onClick={onClose} 
              className="close-modal-btn"
            >
              Close
            </Button>
          </Box>
          <Box 
            mb={1} 
            p={2} 
            pb={2.75} 
            borderBottom="1px solid #ccc" 
            // borderRadius={2} 
            textAlign="center"
            width="100%"
            >
            <Typography variant="subtitle1"><strong>{currentAd?.title ?? ""}</strong></Typography>
            {/* <div>
              <img
                src={currentAd?.image[0]}
                alt={currentAd?.title} 
                style={{ 
                  marginTop: "0.4em",
                  width: "300px",       
                  height: "auto",       
                  maxHeight: "200px",   
                  minHeight: "200px",
                  objectFit: "contain",  // ensures the entire image fits in the box
                }} 
              ></img>
            </div> */}
            <AdImageCarousel currentAd={currentAd} />

            <Typography>Price: {currentAd?.price ?? ""}</Typography>
            <Typography>Location: {currentAd?.adlocation ?? ""}</Typography>
            <Typography>Uploaded: {currentAd?.time ?? ""}</Typography>
            <Typography>
              <button className="view-blocket-link" style={{ marginTop: "5px" }}>
                  <a href={currentAd?.link2 ?? ""} target="_blank" rel="noreferrer"  
                    style={{ 
                      textDecoration: "none",   
                      color: "inherit"           
                    }}>View on Blocket
                  </a>
              </button>
              <button className="view-blocket-link" style={{ marginTop: "5px", marginLeft: "3px", cursor: "copy" }} onClick={() => copyPlaceHolderText(currentAd?.searchWord)}><FontAwesomeIcon icon={faCopy} /></button>
            </Typography>
          </Box>

          <Box display="flex" justifyContent="space-between" alignItems="center">
            <IconButton onClick={handlePrev}><ArrowBack /></IconButton>
            <Typography sx={{ fontWeight: "700", fontSize: "0.9em" }}>{currentIndex + 1} / {ads.length}</Typography>
            <IconButton onClick={handleNext}><ArrowForward /></IconButton>
          </Box>
       </Box>
    </Modal>
  );
};

export default AdsModal;
