import gsap from "gsap";
import detect from "bpm-detective";

class AudioController {
  constructor() {
    this.currentTrack = null;
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

  play = (src, trackInfo = null) => {
    console.log("AudioController.play called with:", { src, trackInfo });
    this.audio.src = src;
    this.currentTrack = trackInfo;
    console.log("Current track set to:", this.currentTrack);
    this.audio.play().catch(error => {
      console.error("Error playing audio:", error);
    });
    
    // Dispatch a custom event that we can listen for
    window.dispatchEvent(new CustomEvent('audiocontroller-track-change', { 
      detail: { track: this.currentTrack }
    }));
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
