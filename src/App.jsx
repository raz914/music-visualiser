import Canvas from "./components/Canvas/Canvas";
import Landing from "./components/Landing/Landing";
import Dropzone from "./components/Dropzone/Dropzone";
import Tracks from "./components/Tracks/Tracks";
import Picker from "./components/Picker/Picker";
import AudioPlayer from "./components/AudioPlayer/AudioPlayer";
import { useEffect } from "react";
import useStore from "./utils/store";

import "./mobileStyles.css";

function App() {
  // Get the clearUnplayedTracks function from the store
  const clearUnplayedTracks = useStore(state => state.clearUnplayedTracks);
  
  // Only do cleanup periodically, not on focus or startup
  useEffect(() => {
    // Only clear unplayed tracks periodically (every 30 minutes)
    const cleanupInterval = setInterval(() => {
      console.log('Periodic cleanup of unplayed tracks');
      clearUnplayedTracks();
    }, 30 * 60 * 1000); // 30 minutes
    
    return () => {
      clearInterval(cleanupInterval);
    };
  }, [clearUnplayedTracks]);
  
  // Add listener for viewport size to handle mobile layout
  useEffect(() => {
    const checkMobile = () => {
      if (window.innerWidth <= 768) {
        document.body.classList.add('mobile-view');
      } else {
        document.body.classList.remove('mobile-view');
      }
    };
    
    // Check on load
    checkMobile();
    
    // Add listener for resize
    window.addEventListener('resize', checkMobile);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);
  
  return (
    <>
      <Landing />
      <Dropzone />
      <Picker />
      <Tracks />
      <Canvas />
      <AudioPlayer />
    </>
  );
}

export default App;
