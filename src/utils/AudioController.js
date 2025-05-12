import gsap from "gsap";
import detect from "bpm-detective";
import useStore from "./store";
import scene from "../webgl/Scene";

class AudioController {
  constructor() {
    this.currentTrack = null;
    this.currentTrackIndex = -1;
  }

  setup() {
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();

    this.audio = new Audio();
    this.audio.crossOrigin = "anonymous";
    this.bpm = null;

    // this.audio.src = danceTheNight;
    this.audio.volume = 0.1;

    this.audioSource = this.ctx.createMediaElementSource(this.audio);

    this.analyserNode = new AnalyserNode(this.ctx, {
      fftSize: 1024,
      smoothingTimeConstant: 0.8,
    });

    this.fdata = new Uint8Array(this.analyserNode.frequencyBinCount);

    this.audioSource.connect(this.analyserNode);
    this.audioSource.connect(this.ctx.destination);

    gsap.ticker.add(this.tick);

    this.audio.addEventListener("loadeddata", async () => {
      await this.detectBPM();
      // console.log(`The BPM is: ${bpm}`);
    });
    
    // Add event listener for track ended
    this.audio.addEventListener("ended", () => {
      if (!this.audio.loop) {
        // Auto play next track if not looping
        this.nextTrack();
      }
    });
    
    console.log("AudioController setup complete");
  }

  detectBPM = async () => {
    // Create an offline audio context to process the data
    const offlineCtx = new OfflineAudioContext(
      1,
      this.audio.duration * this.ctx.sampleRate,
      this.ctx.sampleRate
    );
    // Decode the current audio data
    const response = await fetch(this.audio.src); // Fetch the audio file
    const buffer = await response.arrayBuffer();
    const audioBuffer = await offlineCtx.decodeAudioData(buffer);
    // Use bpm-detective to detect the BPM
    this.bpm = detect(audioBuffer);
    console.log(`Detected BPM: ${this.bpm}`);
    // return bpm;
  };

  play = (src, trackInfo = null, trackIndex = -1) => {
    console.log("AudioController.play called with:", { src, trackInfo, trackIndex });
    
    // Log specific details about the cover image for debugging
    if (trackInfo) {
      console.log("Track cover details:", {
        cover: trackInfo.cover,
        albumCoverXL: trackInfo.album?.cover_xl,
        hasCover: !!trackInfo.cover,
        hasAlbumCover: !!(trackInfo.album && trackInfo.album.cover_xl)
      });
    }
    
    try {
      // Ensure the audio element exists
      if (!this.audio) {
        console.log("Audio element not initialized, setting up");
        this.setup();
      }
      
      // Make sure we have a valid source
      if (!src) {
        console.error("No source provided for playback");
        return;
      }
      
      // Set the source and play
      this.audio.src = src;
      this.currentTrack = trackInfo;
      this.currentTrackIndex = trackIndex;
      console.log("Current track set to:", this.currentTrack, "index:", this.currentTrackIndex);
      
      // Force load and play
      this.audio.load();
      const playPromise = this.audio.play();
      
      if (playPromise !== undefined) {
        playPromise.then(() => {
          console.log("Audio playback started successfully");
        }).catch(error => {
          console.error("Error playing audio:", error);
          
          // Try again with user interaction simulation
          setTimeout(() => {
            console.log("Attempting playback again after delay");
            this.audio.play().catch(retryError => {
              console.error("Retry play failed:", retryError);
            });
          }, 500);
        });
      }
      
      // Manually dispatch play event to ensure UI updates
      setTimeout(() => {
        try {
          // Dispatch play event to ensure progress animation starts
          const playEvent = new Event('play');
          this.audio.dispatchEvent(playEvent);
          
          // Also dispatch timeupdate to force time display to update
          const timeUpdateEvent = new Event('timeupdate');
          this.audio.dispatchEvent(timeUpdateEvent);
          
          console.log("Manually dispatched play and timeupdate events");
        } catch (error) {
          console.error("Error dispatching manual events:", error);
        }
      }, 50);
    } catch (error) {
      console.error("Exception in play method:", error);
    }
    
    // Add track to play history in store - DIRECT APPROACH
    if (trackInfo) {
      try {
        // Get the store object
        const useStoreHook = useStore;
        const storeState = useStoreHook.getState();
        
        if (storeState && storeState.updatePlayHistory) {
          // Create a normalized track to ensure it can be found
          const normalizedTrack = {
            ...trackInfo,
            id: trackInfo.id || `track-${src}`,
            preview: src,
            src: src 
          };
          
          console.log("Updating play history with track:", normalizedTrack);
          
          // Update play history in store
          storeState.updatePlayHistory(normalizedTrack);
          
          // Save the current track to the store
          if (storeState.setCurrentTrack) {
            storeState.setCurrentTrack(normalizedTrack);
            console.log("Saved current track to store:", normalizedTrack);
          }
          
          // Force a re-render of components by dispatching a custom event
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent('play-history-updated', { 
              detail: { track: normalizedTrack }
            }));
          }, 50);
        }
      } catch (error) {
        console.error("Error updating play history:", error);
      }
    }
    
    // Dispatch a custom event that we can listen for
    window.dispatchEvent(new CustomEvent('audiocontroller-track-change', { 
      detail: { track: this.currentTrack }
    }));
  };

  nextTrack = () => {
    // Get tracks from store
    const store = window._getStoreState?.(); // Access store state directly
    if (!store) return false;
    
    const { tracks, playHistory } = store;
    
    if (!tracks || tracks.length === 0 || !playHistory || playHistory.length === 0) return false;
    
    // Filter tracks to only include those that have been played at least once
    const playedTracks = tracks.filter(track => 
      playHistory.some(historyItem => 
        (track.id && historyItem.track.id && track.id === historyItem.track.id) ||
        (track.preview && historyItem.track.preview && track.preview === historyItem.track.preview)
      )
    );
    
    if (playedTracks.length === 0) return false;
    
    // Find the current track's index in the played tracks list
    const currentPlayedIndex = playedTracks.findIndex(track => 
      (this.currentTrack && track.id && this.currentTrack.id && track.id === this.currentTrack.id) ||
      (this.currentTrack && track.preview && this.currentTrack.preview && track.preview === this.currentTrack.preview)
    );
    
    // If we don't have a current track index or it's invalid, start with first track
    if (currentPlayedIndex < 0 || currentPlayedIndex >= playedTracks.length - 1) {
      const nextTrack = playedTracks[0];
      // Ensure track has all needed properties
      const trackInfo = {
        ...nextTrack,
        title: nextTrack.title || "Unknown Track",
        cover: nextTrack.album?.cover_xl || nextTrack.cover || "https://via.placeholder.com/150",
        duration: nextTrack.duration || 0,
        artists: nextTrack.artists || nextTrack.title || "Unknown Artist",
        src: nextTrack.preview
      };
      
      this.play(nextTrack.preview, trackInfo, tracks.indexOf(nextTrack));
      
      // Update the 3D scene cover if available
      if (scene && scene.cover && typeof scene.cover.setCover === 'function') {
        scene.cover.setCover(trackInfo.cover);
      }
    } else {
      const nextIndex = currentPlayedIndex + 1;
      const nextTrack = playedTracks[nextIndex];
      // Ensure track has all needed properties
      const trackInfo = {
        ...nextTrack,
        title: nextTrack.title || "Unknown Track",
        cover: nextTrack.album?.cover_xl || nextTrack.cover || "https://via.placeholder.com/150",
        duration: nextTrack.duration || 0,
        artists: nextTrack.artists || nextTrack.title || "Unknown Artist",
        src: nextTrack.preview
      };
      
      this.play(nextTrack.preview, trackInfo, tracks.indexOf(nextTrack));
      
      // Update the 3D scene cover if available
      if (scene && scene.cover && typeof scene.cover.setCover === 'function') {
        scene.cover.setCover(trackInfo.cover);
      }
    }
    
    return true;
  };
  
  previousTrack = () => {
    // Get tracks from store
    const store = window._getStoreState?.(); // Access store state directly
    if (!store) return false;
    
    const { tracks, playHistory } = store;
    
    if (!tracks || tracks.length === 0 || !playHistory || playHistory.length === 0) return false;
    
    // Filter tracks to only include those that have been played at least once
    const playedTracks = tracks.filter(track => 
      playHistory.some(historyItem => 
        (track.id && historyItem.track.id && track.id === historyItem.track.id) ||
        (track.preview && historyItem.track.preview && track.preview === historyItem.track.preview)
      )
    );
    
    if (playedTracks.length === 0) return false;
    
    // Find the current track's index in the played tracks list
    const currentPlayedIndex = playedTracks.findIndex(track => 
      (this.currentTrack && track.id && this.currentTrack.id && track.id === this.currentTrack.id) ||
      (this.currentTrack && track.preview && this.currentTrack.preview && track.preview === this.currentTrack.preview)
    );
    
    // If we don't have a current track index or it's at the beginning, go to the last track
    if (currentPlayedIndex <= 0) {
      const lastIndex = playedTracks.length - 1;
      const prevTrack = playedTracks[lastIndex];
      // Ensure track has all needed properties
      const trackInfo = {
        ...prevTrack,
        title: prevTrack.title || "Unknown Track",
        cover: prevTrack.album?.cover_xl || prevTrack.cover || "https://via.placeholder.com/150",
        duration: prevTrack.duration || 0,
        artists: prevTrack.artists || prevTrack.title || "Unknown Artist",
        src: prevTrack.preview
      };
      
      this.play(prevTrack.preview, trackInfo, tracks.indexOf(prevTrack));
      
      // Update the 3D scene cover if available
      if (scene && scene.cover && typeof scene.cover.setCover === 'function') {
        scene.cover.setCover(trackInfo.cover);
      }
    } else {
      const prevIndex = currentPlayedIndex - 1;
      const prevTrack = playedTracks[prevIndex];
      // Ensure track has all needed properties
      const trackInfo = {
        ...prevTrack,
        title: prevTrack.title || "Unknown Track",
        cover: prevTrack.album?.cover_xl || prevTrack.cover || "https://via.placeholder.com/150",
        duration: prevTrack.duration || 0,
        artists: prevTrack.artists || prevTrack.title || "Unknown Artist",
        src: prevTrack.preview
      };
      
      this.play(prevTrack.preview, trackInfo, tracks.indexOf(prevTrack));
      
      // Update the 3D scene cover if available
      if (scene && scene.cover && typeof scene.cover.setCover === 'function') {
        scene.cover.setCover(trackInfo.cover);
      }
    }
    
    return true;
  };

  pause = () => {
    if (this.audio && !this.audio.paused) {
      this.audio.pause();
    }
  };

  resume = () => {
    if (this.audio && this.audio.paused) {
      // If we have a current track but the audio source isn't set, set it now
      if (this.currentTrack && (!this.audio.src || this.audio.src === '')) {
        console.log("Setting audio source before resuming:", this.currentTrack.preview || this.currentTrack.src);
        this.audio.src = this.currentTrack.preview || this.currentTrack.src;
        this.audio.load();
      }
      
      console.log("Resuming playback");
      this.audio.play().catch(error => {
        console.error("Error resuming audio:", error);
      });
    }
  };

  togglePlayPause = () => {
    // If audio source is not set but we have a current track, set it
    if (this.currentTrack && (!this.audio.src || this.audio.src === '')) {
      console.log("Setting audio source in togglePlayPause:", this.currentTrack.preview || this.currentTrack.src);
      this.audio.src = this.currentTrack.preview || this.currentTrack.src;
    }
    
    if (this.audio.paused) {
      // If resuming from a paused state, make sure to update the scene
      if (this.currentTrack && scene && scene.cover && typeof scene.cover.setCover === 'function') {
        const coverUrl = this.currentTrack.album?.cover_xl || this.currentTrack.cover;
        console.log("Updating scene cover before play:", coverUrl);
        scene.cover.setCover(coverUrl);
      }
      
      // Resume playback
      this.resume();
    } else {
      this.pause();
    }
    return !this.audio.paused;
  };

  toggleLoop = () => {
    this.audio.loop = !this.audio.loop;
    return this.audio.loop;
  };

  isPlaying = () => {
    return this.audio && !this.audio.paused;
  };

  seek = (time) => {
    if (!this.audio || !this.currentTrack) return false;
    
    // Ensure time is within valid range
    const seekTime = Math.max(0, Math.min(time, this.audio.duration || 0));
    console.log(`Seeking to ${seekTime}s`);
    
    // Set the current time of the audio element
    this.audio.currentTime = seekTime;
    
    // Trigger a timeupdate event so UI components know to update
    const timeUpdateEvent = new Event('timeupdate');
    this.audio.dispatchEvent(timeUpdateEvent);
    
    return true;
  };

  getCurrentTrack = () => {
    console.log("getCurrentTrack called, returning:", this.currentTrack);
    
    // If no track in memory, try to get from store
    if (!this.currentTrack) {
      try {
        const storeState = window._getStoreState?.();
        if (storeState && storeState.currentTrack) {
          console.log("Got track from store:", storeState.currentTrack);
          this.currentTrack = storeState.currentTrack;
        }
      } catch (err) {
        console.error("Error getting track from store:", err);
      }
    }
    
    return this.currentTrack;
  };

  tick = () => {
    this.analyserNode.getByteFrequencyData(this.fdata);
  };

  // Add a method to restore the last played track
  restoreLastTrack = () => {
    try {
      // Get the store object
      const storeState = window._getStoreState?.();
      
      if (storeState && storeState.currentTrack) {
        const lastTrack = storeState.currentTrack;
        console.log("Restoring last played track:", lastTrack);
        
        // Ensure the track object has all required properties
        const normalizedTrack = {
          ...lastTrack,
          id: lastTrack.id || `track-${lastTrack.preview || lastTrack.src}`,
          title: lastTrack.title || "Unknown Track",
          cover: lastTrack.album?.cover_xl || lastTrack.cover || "https://via.placeholder.com/150",
          duration: lastTrack.duration || 0,
          artists: lastTrack.artists || lastTrack.title || "Unknown Artist",
          src: lastTrack.preview || lastTrack.src,
          preview: lastTrack.preview || lastTrack.src
        };
        
        // Set the current track info but don't auto-play
        this.currentTrack = normalizedTrack;
        
        // Make sure the audio source is set
        if (this.audio) {
          this.audio.src = normalizedTrack.preview || normalizedTrack.src;
          console.log("Set audio src to:", this.audio.src);
          
          // Preload the audio to ensure it's ready to play
          this.audio.load();
        } else {
          console.warn("Audio element not initialized yet");
        }
        
        // Find the index of this track in the tracks array
        if (storeState.tracks && storeState.tracks.length > 0) {
          this.currentTrackIndex = storeState.tracks.findIndex(track => 
            (track.id && normalizedTrack.id && track.id === normalizedTrack.id) || 
            (track.preview && normalizedTrack.preview && track.preview === normalizedTrack.preview)
          );
          console.log("Restored track index:", this.currentTrackIndex);
        }
        
        // Update the 3D scene cover if available
        if (scene && scene.cover && typeof scene.cover.setCover === 'function' && normalizedTrack.cover) {
          scene.cover.setCover(normalizedTrack.cover);
          
          // Force a scene update if needed
          if (typeof scene.update === 'function') {
            scene.update();
          }
        }
        
        // Dispatch event to update UI with delay to ensure components are ready
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('audiocontroller-track-change', { 
            detail: { track: normalizedTrack }
          }));
        }, 100);
        
        return true;
      } else {
        console.log("No saved track found in store");
      }
    } catch (error) {
      console.error("Error restoring last track:", error);
    }
    
    return false;
  };
}

const audioController = new AudioController();
export default audioController;
