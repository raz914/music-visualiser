import { useState, useEffect, useRef } from "react";
import audioController from "../../utils/AudioController";
import scene from "../../webgl/Scene";
import styles from "./AudioPlayer.module.scss";
import useStore from "../../utils/store";

const AudioPlayer = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLooping, setIsLooping] = useState(false);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const progressBarRef = useRef(null);
  const animationFrameRef = useRef(null);
  // Get currentTrack directly from store
  const storedTrack = useStore(state => state.currentTrack);

  console.log("AudioPlayer rendering, currentTrack:", currentTrack, "storedTrack:", storedTrack);
  console.log("Is playing:", isPlaying, "Is dragging:", isDragging);

  // Initialize audio controller if needed
  useEffect(() => {
    if (!audioController.audio) {
      console.log("AudioPlayer: Setting up audioController");
      audioController.setup();
      
      // After setup, try to restore the last played track
      setTimeout(() => {
        const restored = audioController.restoreLastTrack();
        console.log("Restored last track:", restored);
      }, 500); // Short delay to make sure audio controller is fully initialized
    }

    // Add listener for screen resize to detect mobile view
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Set the current track from store if available
  useEffect(() => {
    if (storedTrack && !currentTrack) {
      console.log("Setting current track from store:", storedTrack);
      setCurrentTrack(storedTrack);
      
      // Also update the AudioController's current track
      if (!audioController.currentTrack) {
        console.log("Updating AudioController with stored track");
        audioController.currentTrack = storedTrack;
        if (audioController.audio) {
          audioController.audio.src = storedTrack.preview || storedTrack.src;
        }
      }
    }
  }, [storedTrack, currentTrack]);

  // Update progress bar using requestAnimationFrame
  const startProgressAnimation = () => {
    // Cancel any existing animation
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
    // Create our animation function
    const updateProgress = () => {
      if (audioController.audio && !isDragging) {
        // Get current time and duration
        const curTime = audioController.audio.currentTime;
        const durTime = audioController.audio.duration || 0;
        
        // Only update state if values have changed
        if (Math.abs(curTime - currentTime) > 0.01 || Math.abs(durTime - duration) > 0.01) {
          setCurrentTime(curTime);
          setDuration(durTime);
          
          // Force immediate DOM update for the progress bar fill
          const progressBar = progressBarRef.current;
          if (progressBar) {
            const fillBar = progressBar.querySelector(`.${styles.progressFill}`);
            if (fillBar && durTime > 0) {
              const percentage = (curTime / durTime) * 100;
              fillBar.style.width = `${percentage}%`;
            }
          }
        }
      }
      
      // Continue animation as long as audio is playing
      if (audioController.audio && !audioController.audio.paused) {
        animationFrameRef.current = requestAnimationFrame(updateProgress);
      } else {
        // Cancel when not playing
        animationFrameRef.current = null;
      }
    };
    
    // Start the animation
    animationFrameRef.current = requestAnimationFrame(updateProgress);
    console.log("Started progress animation");
  };
  
  const stopProgressAnimation = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
      console.log("Stopped progress animation");
    }
  };

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
      // Start animation when track is selected
      startProgressAnimation();
    };
    
    // Add direct play-track event handler for uploaded tracks
    const handlePlayTrack = (event) => {
      console.log("Direct play-track event received:", event.detail.track);
      if (event.detail && event.detail.track) {
        // Make sure audio controller is initialized
        if (!audioController.audio) {
          console.log("Initializing AudioController for play-track event");
          audioController.setup();
        }
        
        const track = event.detail.track;
        const src = track.preview || track.src;
        
        if (src) {
          console.log("Playing track directly:", track.title, "src:", src);
          
          // Ensure the track has a cover property
          const enhancedTrack = {
            ...track,
            // Look for cover in multiple places and provide a fallback
            cover: track.cover || 
                  (track.album && track.album.cover_xl) || 
                  "https://placehold.co/600x400"
          };
          
          // Update the 3D scene cover if available
          if (scene && scene.cover && typeof scene.cover.setCover === 'function') {
            console.log("Updating 3D scene cover for track:", enhancedTrack.cover);
            scene.cover.setCover(enhancedTrack.cover);
            
            // Force a scene update if needed
            if (typeof scene.update === 'function') {
              scene.update();
            }
          }
          
          try {
            // Play the track with the AudioController
            audioController.play(src, enhancedTrack);
            console.log("Started playback via AudioController");
            
            // Force the UI to update
            setCurrentTrack(enhancedTrack);
            setIsPlaying(true);
            
            // Start animation when track starts playing
            startProgressAnimation();
            
            // Force audio element to play if needed
            if (audioController.audio && audioController.audio.paused) {
              console.log("Forcing audio to play");
              audioController.audio.play().catch(e => console.error("Play error:", e));
            }
          } catch (error) {
            console.error("Error playing track:", error);
          }
        } else {
          console.error("No source URL found for track:", track);
        }
      }
    };

    window.addEventListener('audiocontroller-track-change', handleTrackChange);
    window.addEventListener('track-selected', handleTrackSelected);
    window.addEventListener('play-track', handlePlayTrack);
    
    return () => {
      window.removeEventListener('audiocontroller-track-change', handleTrackChange);
      window.removeEventListener('track-selected', handleTrackSelected);
      window.removeEventListener('play-track', handlePlayTrack);
    };
  }, [isDragging]); // Re-attach when isDragging changes

  // Main audio event listeners
  useEffect(() => {
    if (!audioController.audio) {
      console.log("AudioPlayer: audioController.audio not available yet");
      return;
    }
    
    console.log("AudioPlayer: Setting up audio event listeners");
    
    const handlePlay = () => {
      console.log("Play event detected");
      setIsPlaying(true);
      startProgressAnimation();
    };
    
    const handlePause = () => {
      console.log("Pause/End event detected");
      setIsPlaying(false);
      stopProgressAnimation();
    };
    
    const handleLoadedMetadata = () => {
      console.log("Loaded metadata, duration:", audioController.audio.duration);
      setDuration(audioController.audio.duration || 0);
      setCurrentTime(audioController.audio.currentTime);
      
      // If audio is already playing, start animation
      if (!audioController.audio.paused) {
        startProgressAnimation();
      }
    };
    
    // Set up event listeners for audio state changes
    audioController.audio.addEventListener("play", handlePlay);
    audioController.audio.addEventListener("pause", handlePause);
    audioController.audio.addEventListener("ended", handlePause);
    audioController.audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    
    // Initial state check
    setIsPlaying(!audioController.audio.paused);
    setIsLooping(audioController.audio.loop);
    setDuration(audioController.audio.duration || 0);
    setCurrentTime(audioController.audio.currentTime);
    
    // If audio is already playing, start animation
    if (!audioController.audio.paused) {
      console.log("Audio is already playing, starting animation");
      startProgressAnimation();
    }

    return () => {
      // Clean up
      if (audioController.audio) {
        audioController.audio.removeEventListener("play", handlePlay);
        audioController.audio.removeEventListener("pause", handlePause);
        audioController.audio.removeEventListener("ended", handlePause);
        audioController.audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      }
      stopProgressAnimation();
    };
  }, []); // Only run once on mount

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopProgressAnimation();
    };
  }, []);

  // Handle dragging state changes
  useEffect(() => {
    if (!isDragging && isPlaying && audioController.audio && !audioController.audio.paused) {
      console.log("Dragging stopped, restarting animation");
      startProgressAnimation();
    }
  }, [isDragging, isPlaying]);

  const handlePlayPause = () => {
    if (!audioController.audio) return;
    
    // If the audio source is not set (which can happen after page reload),
    // ensure it's properly set from the currentTrack
    if (currentTrack && (!audioController.audio.src || audioController.audio.src === '')) {
      console.log("Setting audio source before play:", currentTrack.preview || currentTrack.src);
      audioController.audio.src = currentTrack.preview || currentTrack.src;
    }
    
    // If the audio source is properly set but not loaded, load it
    if (currentTrack && audioController.currentTrack !== currentTrack) {
      console.log("Updating audioController's currentTrack before playing");
      audioController.currentTrack = currentTrack;
    }
    
    const playing = audioController.togglePlayPause();
    setIsPlaying(playing);
    
    // Animation will be handled by the play/pause event listeners
  };

  const handleLoop = () => {
    if (!audioController.audio) return;
    const looping = audioController.toggleLoop();
    setIsLooping(looping);
  };

  const handlePreviousTrack = () => {
    if (!audioController.audio) return;
    audioController.previousTrack();
    setIsPlaying(true);
    // Animation will be handled by the play event listener
  };

  const handleNextTrack = () => {
    if (!audioController.audio) return;
    audioController.nextTrack();
    setIsPlaying(true);
    // Animation will be handled by the play event listener
  };

  // Format time in minutes:seconds
  const formatTime = (timeInSeconds) => {
    if (isNaN(timeInSeconds) || timeInSeconds === Infinity) return "0:00";
    
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
  };

  // Handle progress bar click/drag
  const handleProgressClick = (e) => {
    if (!audioController.audio || !progressBarRef.current) return;
    
    const progressRect = progressBarRef.current.getBoundingClientRect();
    const clickPosition = (e.clientX - progressRect.left) / progressRect.width;
    const newTime = clickPosition * duration;
    
    // Update the audio position using the seek method
    audioController.seek(newTime);
    setCurrentTime(newTime);
    
    // Update fill bar immediately for responsiveness
    const fillBar = progressBarRef.current.querySelector(`.${styles.progressFill}`);
    if (fillBar) {
      fillBar.style.width = `${clickPosition * 100}%`;
    }
  };
  
  // Start dragging the progress bar
  const handleProgressDragStart = (e) => {
    stopProgressAnimation(); // Stop animation while dragging
    setIsDragging(true);
    document.body.style.cursor = 'grabbing';
    
    // Capture pointer to improve drag behavior
    if (progressBarRef.current) {
      progressBarRef.current.setPointerCapture(e.pointerId);
    }
    
    // Set initial position
    handleProgressDrag(e);
  };
  
  // Handle dragging the progress bar
  const handleProgressDrag = (e) => {
    if (!isDragging || !progressBarRef.current) return;
    
    const progressRect = progressBarRef.current.getBoundingClientRect();
    const dragPosition = Math.max(0, Math.min(1, (e.clientX - progressRect.left) / progressRect.width));
    
    // Update time state
    const newTime = dragPosition * duration;
    setCurrentTime(newTime);
    
    // Update fill bar directly for immediate visual feedback
    const fillBar = progressBarRef.current.querySelector(`.${styles.progressFill}`);
    if (fillBar) {
      fillBar.style.width = `${dragPosition * 100}%`;
    }
  };
  
  // End dragging and set the new position
  const handleProgressDragEnd = (e) => {
    if (!audioController.audio || !progressBarRef.current) return;
    
    // Release pointer capture
    if (progressBarRef.current && e.pointerId) {
      progressBarRef.current.releasePointerCapture(e.pointerId);
    }
    
    const progressRect = progressBarRef.current.getBoundingClientRect();
    const releasePosition = Math.max(0, Math.min(1, (e.clientX - progressRect.left) / progressRect.width));
    const newTime = releasePosition * duration;
    
    // Update the audio position using the seek method
    audioController.seek(newTime);
    setCurrentTime(newTime);
    setIsDragging(false);
    document.body.style.cursor = '';
    
    // Animation will restart due to the isDragging useEffect
  };

  // Replace mouse events with pointer events for better cross-device support
  const pointerEventProps = {
    onPointerDown: handleProgressDragStart,
    onPointerMove: handleProgressDrag,
    onPointerUp: handleProgressDragEnd,
    onPointerCancel: handleProgressDragEnd,
    onPointerLeave: isDragging ? handleProgressDragEnd : null,
    onClick: handleProgressClick,
    style: { touchAction: 'none' } // Disable browser handling of touch events
  };

  // Force update track (debug function)
  const forceUpdateTrack = () => {
    const track = audioController.getCurrentTrack();
    console.log("Force updating track:", track);
    if (track) {
      setCurrentTrack(track);
    } else {
      console.log("No current track available");
    }
  };

  // Calculate progress percentage for the progress bar
  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;
  
  // Log progress percentage periodically to debug fill bar movement
  useEffect(() => {
    if (currentTime > 0 && duration > 0) {
      console.log(`Progress: ${currentTime.toFixed(2)}s / ${duration.toFixed(2)}s (${progressPercentage.toFixed(2)}%)`);
    }
  }, [currentTime, duration]);

  // Always render the player controls, but with placeholder content if no track
  return (
    <div className={`${styles.audioPlayer} ${isMobile ? styles.mobilePlayer : ''}`}>
      <div className={styles.trackInfo}>
        {currentTrack ? (
          <>
            <img 
              src={currentTrack.cover || (currentTrack.album && currentTrack.album.cover_xl) || "https://placehold.co/600x400"} 
              alt={currentTrack.title} 
              className={styles.albumCover} 
              onError={(e) => {
                console.log("Album cover failed to load, using placeholder");
                e.target.src = "https://placehold.co/600x400"; 
              }}
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
      
      {/* Progress bar/slider */}
      <div className={styles.progressContainer}>
        <span className={styles.currentTime}>{formatTime(currentTime)}</span>
        <div 
          className={styles.progressBar} 
          ref={progressBarRef}
          {...pointerEventProps}
          data-progress={`${progressPercentage.toFixed(2)}%`}
        >
          <div 
            className={styles.progressFill} 
            style={{ width: `${progressPercentage}%` }}
            data-width={`${progressPercentage.toFixed(2)}%`}
          >
            <div className={styles.progressHandle}></div>
          </div>
        </div>
        <span className={styles.duration}>{formatTime(duration)}</span>
      </div>
      
      <div className={styles.controls}>
        <button 
          className={`${styles.controlButton} ${styles.previousButton}`}
          onClick={handlePreviousTrack}
          disabled={!currentTrack}
          aria-label="Previous Track"
        >
          ⏮
        </button>
        
        <button 
          className={`${styles.controlButton} ${styles.playPauseButton}`}
          onClick={handlePlayPause}
          disabled={!currentTrack && !audioController.isPlaying()}
          aria-label={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? "❚❚" : "▶"}
        </button>
        
        <button 
          className={`${styles.controlButton} ${styles.nextButton}`}
          onClick={handleNextTrack}
          disabled={!currentTrack}
          aria-label="Next Track"
        >
          ⏭
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