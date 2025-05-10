import { create } from "zustand";
import { persist } from "zustand/middleware";
import TRACKS from "./TRACKS";

// Helper function to compare tracks
function tracksMatch(track1, track2) {
  // If both have IDs, compare by ID
  if (track1.id && track2.id) {
    return track1.id === track2.id;
  }
  // Otherwise, compare by title and src
  return track1.title === track2.title && track1.src === track2.src;
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
            id: track.id || `${track.title}-${track.src}`
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
    }),
    {
      name: "iut-visualizer-storage",
      partialize: (state) => ({ favorites: state.favorites }), // Only persist favorites
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
