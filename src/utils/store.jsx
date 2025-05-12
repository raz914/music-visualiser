import { create } from "zustand";
import { persist } from "zustand/middleware";
import TRACKS from "./TRACKS";

// Helper function to compare tracks
function tracksMatch(track1, track2) {
  // If both have IDs, compare by ID
  if (track1.id && track2.id) {
    return track1.id === track2.id;
  }
  
  // If they have identical preview URLs, they're the same track
  if (track1.preview && track2.preview) {
    return track1.preview === track2.preview;
  }
  
  // If they have identical src values, they're the same track
  if (track1.src && track2.src) {
    return track1.src === track2.src;
  }
  
  // Last resort: compare by title if both exist
  if (track1.title && track2.title) {
    return track1.title === track2.title;
  }
  
  // Can't determine a match
  return false;
}

// Check if a track is one of the default tracks
function isDefaultTrack(track) {
  return TRACKS.some(defaultTrack => tracksMatch(track, defaultTrack));
}

const useStore = create(
  persist(
    (set, get) => ({
      // defaultTracks: TRACKS,

      // la liste processed par la librairie, et prête à être rendue dans le DOM
      tracks: [],
      setTracks: (_tracks) =>
        set(() => ({
          tracks: _tracks,
        })),
      clearTracks: () => 
        set(() => ({
          tracks: []
        })),
      
      // Current playing track
      currentTrack: null,
      setCurrentTrack: (track) => 
        set(() => ({
          currentTrack: track
        })),
      
      // Current visualizer selection
      currentVisualizer: null,
      setCurrentVisualizer: (index) =>
        set(() => ({
          currentVisualizer: index
        })),
      
      // Play history for tracking recently played tracks
      playHistory: [],
      updatePlayHistory: (track) => 
        set((state) => {
          console.log("Updating play history with track:", track);
          
          // Create a normalized track object with stable properties
          const normalizedTrack = {
            ...track,
            id: track.id || `${track.title}-${track.src || track.preview}`,
            title: track.title || "Unknown Track",
            src: track.src || track.preview
          };
          
          // Remove the track from history if it already exists
          const filteredHistory = state.playHistory.filter(
            historyTrack => !tracksMatch(historyTrack.track, normalizedTrack)
          );
          
          // Add the track to the beginning of the history with current timestamp
          const newHistory = [
            { 
              track: normalizedTrack, 
              lastPlayed: Date.now() 
            },
            ...filteredHistory
          ];
          
          console.log("Updated play history:", newHistory);
          
          return {
            playHistory: newHistory
          };
        }),
      
      // Favorites tracks
      favorites: [],
      addToFavorites: (track) => 
        set((state) => {
          // Check if track is already in favorites to avoid duplicates
          const isAlreadyFavorite = state.favorites.some(
            fav => tracksMatch(fav, track)
          );
          
          if (isAlreadyFavorite) {
            return { favorites: state.favorites };
          }
          
          // Ensure the track has a stable ID
          const trackToAdd = {
            ...track,
            id: track.id || `${track.title}-${track.src || track.preview}`
          };
          
          console.log("Adding to favorites:", trackToAdd);
          
          return {
            favorites: [...state.favorites, trackToAdd]
          };
        }),
      removeFromFavorites: (track) => 
        set((state) => {
          console.log("Removing from favorites:", track);
          return {
            favorites: state.favorites.filter(favorite => !tracksMatch(favorite, track))
          };
        }),
      isFavorite: (track) => {
        const state = get();
        return state.favorites.some(
          favorite => tracksMatch(favorite, track)
        );
      },
      
      // Clear unplayed tracks from the cache
      clearUnplayedTracks: () => 
        set((state) => {
          console.log("Clearing unplayed tracks from cache");
          
          // Keep tracks that are either:
          // 1. In the play history (have been played)
          // 2. Are default tracks from TRACKS.js
          // 3. Are in favorites
          const tracksToKeep = state.tracks.filter(track => {
            // Check if it's a default track
            if (isDefaultTrack(track)) {
              return true;
            }
            
            // Check if it's in favorites
            if (state.favorites.some(favorite => tracksMatch(favorite, track))) {
              return true;
            }
            
            // Check if it's in play history
            if (state.playHistory.some(historyItem => tracksMatch(historyItem.track, track))) {
              return true;
            }
            
            // If it doesn't match any of the above criteria, it will be removed
            return false;
          });
          
          console.log(`Cleared ${state.tracks.length - tracksToKeep.length} unplayed tracks from cache`);
          
          // Return the filtered tracks
          return {
            tracks: tracksToKeep
          };
        }),
    }),
    {
      name: "iut-visualizer-storage",
      partialize: (state) => ({ 
        favorites: state.favorites,
        playHistory: state.playHistory,
        tracks: state.tracks,
        currentTrack: state.currentTrack,
        currentVisualizer: state.currentVisualizer
      }),
    }
  )
);

// Make the store state accessible globally for AudioController
if (typeof window !== 'undefined') {
  window._getStoreState = () => {
    const state = useStore.getState();
    return state;
  };
}

export default useStore;
