import audioController from "../../utils/AudioController";
import scene from "../../webgl/Scene";
import s from "./Track.module.scss";
import useStore from "../../utils/store";
import { useState, useEffect } from "react";

const Track = ({ title, cover, src, duration, artists, index, track }) => {
  const { addToFavorites, removeFromFavorites, favorites } = useStore();
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  
  // Create a trackId to identify this track for favorites
  function getTrackId() {
    if (track && track.id) {
      return track.id;
    }
    // Create a unique ID from title and src if no ID exists
    return `${title}-${src}`;
  }
  
  // Get the actual track data with proper ID for comparison
  const trackData = track || {
    id: getTrackId(),
    title,
    cover,
    duration,
    artists,
    src,
    album: { cover_xl: cover }
  };
  
  // Check if this track is in favorites - explicitly compare each track only by id or exact match
  function checkIfFavorite() {
    return favorites.some(fav => {
      // If both have IDs, compare by ID
      if (fav.id && trackData.id) {
        return fav.id === trackData.id;
      }
      // Otherwise compare by title and src
      return fav.title === title && fav.src === src;
    });
  }
  
  // Set initial value using the function
  const [isTrackFavorite, setIsTrackFavorite] = useState(() => checkIfFavorite());
  
  // Update favorite status whenever favorites list changes
  useEffect(() => {
    setIsTrackFavorite(checkIfFavorite());
    // Explicitly setting dependencies to avoid stale closures
  }, [favorites, title, src, trackData.id]);
  
  useEffect(() => {
    let timeout;
    if (showToast) {
      timeout = setTimeout(() => {
        setShowToast(false);
      }, 2000);
    }
    return () => clearTimeout(timeout);
  }, [showToast]);
  
  const getSeconds = () => {
    const minutes = Math.floor(duration / 60);
    let seconds = Math.round(duration - minutes * 60);

    if (seconds < 10) {
      seconds = "0" + seconds;
    }

    return minutes + ":" + seconds;
  };

  const onClick = () => {
    // Make sure track information is complete
    if (!src) {
      console.error("Missing track source URL");
      return;
    }
    
    if (!cover) {
      console.warn("Missing track cover image");
    }
    
    const trackInfo = {
      title: title || "Unknown Track",
      cover: cover || "https://via.placeholder.com/150",
      duration: duration || 0,
      artists: artists || title || "Unknown Artist",
      src
    };
    
    console.log("Track clicked, playing track:", trackInfo);
    
    // First ensure AudioController is initialized
    if (!audioController.audio) {
      console.log("Initializing AudioController");
      audioController.setup();
    }
    
    // Play the track
    audioController.play(src, trackInfo, index);
    
    // Update the 3D scene cover if available
    if (scene && scene.cover && typeof scene.cover.setCover === 'function') {
      scene.cover.setCover(cover);
    } else {
      console.warn("Scene cover object not available");
    }
    
    // Also dispatch an event that AudioPlayer can listen for
    window.dispatchEvent(new CustomEvent('track-selected', { 
      detail: { track: trackInfo }
    }));
  };

  const handleFavoriteClick = (e) => {
    e.stopPropagation(); // Prevent track click event from firing
    
    if (isTrackFavorite) {
      // Confirm before removing from favorites
      const confirmRemove = window.confirm(`Remove "${title}" from favorites?`);
      if (confirmRemove) {
        removeFromFavorites(trackData);
        setToastMessage(`Removed ${title} from favorites`);
        setShowToast(true);
        // Let the useEffect update the state based on favorites
      }
    } else {
      addToFavorites(trackData);
      setToastMessage(`Added ${title} to favorites`);
      setShowToast(true);
      // Let the useEffect update the state based on favorites
    }
  };

  // Add debug class to check if we're properly detecting favorites
  const debugClass = isTrackFavorite ? `${s.favoriteBtn} ${s.active}` : s.favoriteBtn;

  return (
    <div className={s.track} onClick={onClick}>
      <span className={s.order}>{index + 1}</span>
      <div className={s.title}>
        <img src={cover} alt="" className={s.cover} />
        <div className={s.details}>
          <span className={s.trackName}>{title}</span>
          {/* {artists.map((artist, i) => (
            <span key={artist + i} className={s.artistName}>
              {artist}
            </span>
          ))} */}
        </div>
      </div>
      <span className={s.duration}>{getSeconds()}</span>
      <button 
        className={debugClass}
        onClick={handleFavoriteClick}
        title={isTrackFavorite ? "Remove from favorites" : "Add to favorites"}
      >
        ♥
      </button>
      
      {showToast && (
        <div className={s.toast}>
          {toastMessage}
        </div>
      )}
    </div>
  );
};

export default Track;
