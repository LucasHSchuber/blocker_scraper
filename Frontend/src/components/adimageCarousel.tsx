import { useState } from "react";


function AdImageCarousel({ currentAd } : any) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!currentAd?.image || currentAd.image.length === 0) return null;

  const nextImage = () => {
    setCurrentIndex((prev) => (prev + 1) % currentAd.image.length);
  };

  const prevImage = () => {
    setCurrentIndex(
      (prev) => (prev - 1 + currentAd.image.length) % currentAd.image.length
    );
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div style={{ position: "relative" }}>
        <img
          src={currentAd.image[currentIndex]}
          alt={currentAd.title}
          style={{
            marginTop: "0.4em",
            width: "300px",
            height: "auto",
            maxHeight: "200px",
            minHeight: "200px",
            objectFit: "contain",
          }}
        />
        {currentAd.image.length > 1 && (
          <>
            <button
              onClick={prevImage}
              style={{
                position: "absolute",
                left: -10,
                top: "50%",
                transform: "translateY(-50%)",
                background: "rgba(0,0,0,0.3)",
                color: "white",
                border: "none",
                // borderRadius: "30px",
                // height:"30px",
                cursor: "pointer",
                // padding: "0.5em",
              }}
            >
              ◀
            </button>
            <button
              onClick={nextImage}
              style={{
                position: "absolute",
                right: -10,
                top: "50%",
                transform: "translateY(-50%)",
                background: "rgba(0,0,0,0.3)",
                color: "white",
                border: "none",
                cursor: "pointer",
                // padding: "0.5em",
              }}
            >
              ▶
            </button>
          </>
        )}
      </div>
      <div style={{ marginTop: "0.3em", marginBottom: "0.5em", fontWeight: "600", fontSize: "0.8em" }}>
        {currentIndex + 1} / {currentAd.image.length}
      </div>
    </div>
  );
}

export default AdImageCarousel;
