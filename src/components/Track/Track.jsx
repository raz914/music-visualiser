import audioController from "../../utils/AudioController";
import scene from "../../webgl/Scene";
import s from "./Track.module.scss";

const Track = ({ title, cover, src, duration, artists, index }) => {
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
    audioController.play(src, trackInfo);
    
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
    </div>
  );
};

export default Track;
