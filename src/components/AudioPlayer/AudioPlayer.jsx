import { useState, useEffect } from "react";
import audioController from "../../utils/AudioController";
import styles from "./AudioPlayer.module.scss";

const AudioPlayer = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLooping, setIsLooping] = useState(false);
  const [currentTrack, setCurrentTrack] = useState(null);

  console.log("AudioPlayer rendering, currentTrack:", currentTrack);

  // Initialize audio controller if needed
  useEffect(() => {
    if (!audioController.audio) {
      console.log("AudioPlayer: Setting up audioController");
      audioController.setup();
    }
  }, []);

  // Listen for track changes via custom events
  useEffect(() => {
    const handleTrackChange = (event) => {
      console.log("Track change event received:", event.detail.track);
      setCurrentTrack(event.detail.track);
    };

    const handleTrackSelected = (event) => {
      console.log("Track selected event received:", event.detail.track);
      setCurrentTrack(event.detail.track);
      setIsPlaying(true);
    };

    window.addEventListener('audiocontroller-track-change', handleTrackChange);
    window.addEventListener('track-selected', handleTrackSelected);
    
    return () => {
      window.removeEventListener('audiocontroller-track-change', handleTrackChange);
      window.removeEventListener('track-selected', handleTrackSelected);
    };
  }, []);

  // Update component state based on audio controller state
  useEffect(() => {
    // Only proceed if audio is initialized
    if (!audioController.audio) {
      console.log("AudioPlayer: audioController.audio not available yet");
      return;
    }
    
    console.log("AudioPlayer: Setting up audio event listeners");
    
    const updatePlayerState = () => {
      const track = audioController.getCurrentTrack();
      console.log("updatePlayerState called, track:", track);
      setCurrentTrack(track);
      setIsPlaying(!audioController.audio.paused);
      setIsLooping(audioController.audio.loop);
    };

    // Set up event listeners for audio state changes
    audioController.audio.addEventListener("play", updatePlayerState);
    audioController.audio.addEventListener("pause", updatePlayerState);
    audioController.audio.addEventListener("ended", updatePlayerState);
    
    // Force an immediate check of current state
    updatePlayerState();

    return () => {
      // Clean up listeners
      if (audioController.audio) {
        audioController.audio.removeEventListener("play", updatePlayerState);
        audioController.audio.removeEventListener("pause", updatePlayerState);
        audioController.audio.removeEventListener("ended", updatePlayerState);
      }
    };
  }, [audioController.audio]);

  // Force update when we know tracks are playing
  useEffect(() => {
    // Try to get the current track directly
    const track = audioController.getCurrentTrack();
    console.log("Checking current track directly:", track);
    if (track && !currentTrack) {
      console.log("Setting current track from direct check");
      setCurrentTrack(track);
    }
  }, [currentTrack]);

  const handlePlayPause = () => {
    if (!audioController.audio) return;
    const playing = audioController.togglePlayPause();
    setIsPlaying(playing);
  };

  const handleLoop = () => {
    if (!audioController.audio) return;
    const looping = audioController.toggleLoop();
    setIsLooping(looping);
  };

  // Manual track selection function for debugging
  const forceUpdateTrack = () => {
    const track = audioController.getCurrentTrack();
    console.log("Force updating track:", track);
    if (track) {
      setCurrentTrack(track);
    } else {
      console.log("No current track available");
    }
  };

  // Always render the player controls, but with placeholder content if no track
  return (
    <div className={styles.audioPlayer}>
      <div className={styles.trackInfo}>
        {currentTrack ? (
          <>
            <img 
              src={currentTrack.cover} 
              alt={currentTrack.title} 
              className={styles.albumCover} 
            />
            <div className={styles.trackDetails}>
              <h3 className={styles.trackTitle}>{currentTrack.title}</h3>
              {currentTrack.artists && (
                <p className={styles.artistName}>
                  {Array.isArray(currentTrack.artists) 
                    ? currentTrack.artists.join(", ") 
                    : currentTrack.artists}
                </p>
              )}
            </div>
          </>
        ) : (
          <div className={styles.trackDetails}>
            <h3 className={styles.trackTitle} onClick={forceUpdateTrack}>No track playing</h3>
            <p className={styles.artistName}>Select a track from the playlist</p>
          </div>
        )}
      </div>
      
      <div className={styles.controls}>
        <button 
          className={`${styles.controlButton} ${styles.playPauseButton}`}
          onClick={handlePlayPause}
          disabled={!currentTrack && !audioController.isPlaying()}
          aria-label={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? "❚❚" : "▶"}
        </button>
        
        <button 
          className={`${styles.controlButton} ${styles.loopButton} ${isLooping ? styles.active : ""}`}
          onClick={handleLoop}
          disabled={!currentTrack && !audioController.isPlaying()}
          aria-label="Loop"
        >
          🔁
        </button>
      </div>
    </div>
  );
};

export default AudioPlayer; 