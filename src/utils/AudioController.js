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
    
    this.audio.src = src;
    this.currentTrack = trackInfo;
    this.currentTrackIndex = trackIndex;
    console.log("Current track set to:", this.currentTrack, "index:", this.currentTrackIndex);
    this.audio.play().catch(error => {
      console.error("Error playing audio:", error);
    });
    
    // Dispatch a custom event that we can listen for
    window.dispatchEvent(new CustomEvent('audiocontroller-track-change', { 
      detail: { track: this.currentTrack }
    }));
  };

  nextTrack = () => {
    // Get tracks from store
    const store = window._getStoreState?.(); // Access store state directly
    if (!store) return false;
    
    const { tracks, favorites } = store;
    const allTracks = tracks;
    
    if (!allTracks || allTracks.length === 0) return false;
    
    // If we don't have a current track index or it's invalid, start with first track
    if (this.currentTrackIndex < 0 || this.currentTrackIndex >= allTracks.length - 1) {
      const nextTrack = allTracks[0];
      // Ensure track has all needed properties
      const trackInfo = {
        ...nextTrack,
        title: nextTrack.title || "Unknown Track",
        cover: nextTrack.album?.cover_xl || nextTrack.cover || "https://via.placeholder.com/150",
        duration: nextTrack.duration || 0,
        artists: nextTrack.artists || nextTrack.title || "Unknown Artist",
        src: nextTrack.preview
      };
      
      this.play(nextTrack.preview, trackInfo, 0);
      
      // Update the 3D scene cover if available
      if (scene && scene.cover && typeof scene.cover.setCover === 'function') {
        scene.cover.setCover(trackInfo.cover);
      }
    } else {
      const nextIndex = this.currentTrackIndex + 1;
      const nextTrack = allTracks[nextIndex];
      // Ensure track has all needed properties
      const trackInfo = {
        ...nextTrack,
        title: nextTrack.title || "Unknown Track",
        cover: nextTrack.album?.cover_xl || nextTrack.cover || "https://via.placeholder.com/150",
        duration: nextTrack.duration || 0,
        artists: nextTrack.artists || nextTrack.title || "Unknown Artist",
        src: nextTrack.preview
      };
      
      this.play(nextTrack.preview, trackInfo, nextIndex);
      
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
    
    const { tracks, favorites } = store;
    const allTracks = tracks;
    
    if (!allTracks || allTracks.length === 0) return false;
    
    // If we don't have a current track index or it's at the beginning, go to the last track
    if (this.currentTrackIndex <= 0) {
      const lastIndex = allTracks.length - 1;
      const prevTrack = allTracks[lastIndex];
      // Ensure track has all needed properties
      const trackInfo = {
        ...prevTrack,
        title: prevTrack.title || "Unknown Track",
        cover: prevTrack.album?.cover_xl || prevTrack.cover || "https://via.placeholder.com/150",
        duration: prevTrack.duration || 0,
        artists: prevTrack.artists || prevTrack.title || "Unknown Artist",
        src: prevTrack.preview
      };
      
      this.play(prevTrack.preview, trackInfo, lastIndex);
      
      // Update the 3D scene cover if available
      if (scene && scene.cover && typeof scene.cover.setCover === 'function') {
        scene.cover.setCover(trackInfo.cover);
      }
    } else {
      const prevIndex = this.currentTrackIndex - 1;
      const prevTrack = allTracks[prevIndex];
      // Ensure track has all needed properties
      const trackInfo = {
        ...prevTrack,
        title: prevTrack.title || "Unknown Track",
        cover: prevTrack.album?.cover_xl || prevTrack.cover || "https://via.placeholder.com/150",
        duration: prevTrack.duration || 0,
        artists: prevTrack.artists || prevTrack.title || "Unknown Artist",
        src: prevTrack.preview
      };
      
      this.play(prevTrack.preview, trackInfo, prevIndex);
      
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
      this.audio.play();
    }
  };

  togglePlayPause = () => {
    if (this.audio.paused) {
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

  getCurrentTrack = () => {
    console.log("getCurrentTrack called, returning:", this.currentTrack);
    return this.currentTrack;
  };

  tick = () => {
    this.analyserNode.getByteFrequencyData(this.fdata);
  };
}

const audioController = new AudioController();
export default audioController;
