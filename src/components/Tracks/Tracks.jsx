import { useEffect, useState } from "react";

import Track from "../Track/Track";
import useStore from "../../utils/store";
import { fetchMetadata } from "../../utils/utils";
import TRACKS from "../../utils/TRACKS";

import fetchJsonp from "fetch-jsonp";

import s from "./Tracks.module.scss";

const Tracks = () => {
  // permet d'alterner entre true et false pour afficher / cacher le composant
  const [showTracks, setShowTracks] = useState(false);
  const [activeTab, setActiveTab] = useState("all"); // "all" or "favorites"
  const { tracks, setTracks, favorites } = useStore();

  // écouter la variable tracks qui vient du store
  useEffect(() => {
    if (tracks.length > TRACKS.length) {
      setShowTracks(true);
    }
  }, [tracks]);

  // TODO : Slider (infini ou non) pour sélectionner les tracks

  // TODO : Fonction de tri / filtre sur les tracks, par nom, durée...

  // TODO : Récupérer les tracks du store

  useEffect(() => {
    fetchMetadata(TRACKS, tracks, setTracks);
  }, []);

  const onKeyDown = (e) => {
    if (e.keyCode === 13 && e.target.value !== "") {
      // l'utilisateur a appuyé sur sa touche entrée
      const userInput = e.target.value;

      // appeler la fonction
      getSongs(userInput);
    }
  };

  const getSongs = async (userInput) => {
    let response = await fetchJsonp(
      `https://api.deezer.com/search?q=${userInput}&output=jsonp`
    );

    if (response.ok) {
      response = await response.json();

      // récupérer le tableau de tracks du store existant
      const _tracks = [...tracks];

      // pour chaque track renvoyée par l'API
      response.data.forEach((result) => {
        _tracks.push(result);
      });

      // màj le store
      setTracks(_tracks);

      console.log(_tracks);
    } else {
      // erreurs
    }
  };

  // Get tracks to display based on active tab
  const displayedTracks = activeTab === "all" ? tracks : favorites;
  
  // Debug info
  console.log(`Tab: ${activeTab}, Tracks: ${displayedTracks.length}, Favorites: ${favorites.length}`);

  return (
    <>
      <div
        className={s.toggleTracks}
        onClick={() => setShowTracks(!showTracks)}
      >
        tracklist
      </div>

      <section
        className={`
      ${s.wrapper}
      ${showTracks ? s.wrapper_visible : ""}`}
      >
        <button 
          className={s.closeButton} 
          onClick={() => setShowTracks(false)}
          aria-label="Close tracklist"
        >
          ×
        </button>
        
        <div className={s.tabs}>
          <button 
            className={`${s.tab} ${activeTab === "all" ? s.active : ""}`}
            onClick={() => setActiveTab("all")}
          >
            All Tracks
          </button>
          <button 
            className={`${s.tab} ${activeTab === "favorites" ? s.active : ""}`}
            onClick={() => setActiveTab("favorites")}
          >
            Favorites ({favorites.length})
          </button>
        </div>

        <div className={s.tracks}>
          <div className={s.header}>
            <span className={s.order}>#</span>
            <span className={s.title}>Titre</span>
            <span className={s.duration}>Durée</span>
          </div>

          {displayedTracks.length > 0 ? (
            displayedTracks.map((track, i) => (
              <Track
                key={track.id || `${track.title}-${i}`}
                title={track.title}
                duration={track.duration}
                cover={track.album?.cover_xl || track.cover}
                src={track.preview}
                index={i}
                track={track}
              />
            ))
          ) : (
            <div className={s.emptyState}>
              {activeTab === "favorites" 
                ? "No favorite tracks yet. Click the heart icon on a track to add it to your favorites." 
                : "No tracks available. Search for tracks below."}
            </div>
          )}
        </div>

        <input
          type="text"
          placeholder="Chercher un artiste"
          className={s.searchInput}
          onKeyDown={onKeyDown}
        />
      </section>
    </>
  );
};

export default Tracks;
