import Canvas from "./components/Canvas/Canvas";
import Landing from "./components/Landing/Landing";
import Dropzone from "./components/Dropzone/Dropzone";
import Tracks from "./components/Tracks/Tracks";
import Picker from "./components/Picker/Picker";
import AudioPlayer from "./components/AudioPlayer/AudioPlayer";
import { useEffect } from "react";

import "./mobileStyles.css";

function App() {
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
