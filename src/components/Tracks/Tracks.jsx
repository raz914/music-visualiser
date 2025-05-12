import { useEffect, useState, useCallback, useRef } from "react";

import Track from "../Track/Track";
import useStore from "../../utils/store";
import { fetchMetadata } from "../../utils/utils";
import TRACKS from "../../utils/TRACKS";
import audioController from "../../utils/AudioController";
import scene from "../../webgl/Scene";

import fetchJsonp from "fetch-jsonp";
// Import Fuse.js for fuzzy searching
import Fuse from 'fuse.js';

import s from "./Tracks.module.scss";

// Debounce utility function
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

const Tracks = () => {
  // permet d'alterner entre true et false pour afficher / cacher le composant
  const [showTracks, setShowTracks] = useState(false);
  const [activeTab, setActiveTab] = useState("all"); // "all" or "favorites"
  const [searchTerm, setSearchTerm] = useState(""); // Added search term state
  const [sortUpdateTrigger, setSortUpdateTrigger] = useState(0); // Trigger for re-sorting
  const { tracks, setTracks, favorites, playHistory, clearTracks } = useStore();
  const [isSearching, setIsSearching] = useState(false); // Track search in progress

  // Debounce search term to avoid too many API calls
  const debouncedSearchTerm = useDebounce(searchTerm, 700);

  // Effect for automatic search when debounced search term changes
  useEffect(() => {
    if (debouncedSearchTerm && debouncedSearchTerm.trim() !== '' && !isSearching) {
      console.log("Automatic search triggered for:", debouncedSearchTerm);
      handleTopSearchSubmit();
    }
  }, [debouncedSearchTerm]);

  // Removed auto-open of tracklist when tracks are added from Deezer
  // and on page reload (to prevent tracklist from automatically opening)

  // Force a re-sort when needed
  const forceReSort = useCallback(() => {
    console.log("Forcing re-sort of tracks...");
    setSortUpdateTrigger(prev => prev + 1);
  }, []);

  // Listen for track play events to update sorting
  useEffect(() => {
    const handleTrackChange = () => {
      forceReSort();
    };
    
    const handlePlayHistoryUpdate = () => {
      console.log("Play history updated event received");
      forceReSort();
    };
    
    window.addEventListener('audiocontroller-track-change', handleTrackChange);
    window.addEventListener('play-history-updated', handlePlayHistoryUpdate);
    
    return () => {
      window.removeEventListener('audiocontroller-track-change', handleTrackChange);
      window.removeEventListener('play-history-updated', handlePlayHistoryUpdate);
    };
  }, [forceReSort]);

  // TODO : Slider (infini ou non) pour sélectionner les tracks

  // TODO : Fonction de tri / filtre sur les tracks, par nom, durée...

  // TODO : Récupérer les tracks du store

  // Load initial tracks if none exist in the store
  useEffect(() => {
    // Only process the default tracks if we don't have any tracks already in the store
    // This allows tracks to be restored from localStorage via zustand/persist
    if (tracks.length === 0) {
      console.log("No tracks found in store, loading defaults from TRACKS array");
      // Commented out loading of default tracks
      // fetchMetadata(TRACKS, tracks, setTracks);
    } else {
      console.log("Tracks loaded from persistent storage:", tracks.length);
      // Removed automatic opening of tracklist on page reload
    }
  }, []);

  // Component mounted message
  useEffect(() => {
    console.log("Tracks component mounted");
    // Test if DOM events are working at all
    document.addEventListener('keydown', (e) => {
      console.log("Document keydown:", e.key);
    });
    return () => {
      document.removeEventListener('keydown', () => {});
    };
  }, []);

  // Reference to the search input
  const searchInputRef = useRef(null);
  
  // Focus the search input when showTracks changes to true
  useEffect(() => {
    if (showTracks && searchInputRef.current) {
      console.log("Tracks shown, focusing search input");
      setTimeout(() => {
        searchInputRef.current.focus();
      }, 300);
    }
  }, [showTracks]);

  const onKeyDown = (e) => {
    console.log("Key pressed:", e.key, "KeyCode:", e.keyCode, "Value:", e.target.value);
    
    // Check both for Enter key and keyCode 13 (for browser compatibility)
    if ((e.key === 'Enter' || e.keyCode === 13) && e.target.value.trim() !== "") {
      // l'utilisateur a appuyé sur sa touche entrée
      const userInput = e.target.value.trim();
      console.log("Deezer search input detected:", userInput);

      // appeler la fonction
      getSongs(userInput);
      
      // Prevent form submission if inside a form
      e.preventDefault();
    }
  };
  
  // Input change event
  const onInputChange = (e) => {
    console.log("Input changed:", e.target.value);
  };
  
  // Input focus event
  const onInputFocus = () => {
    console.log("Input focused");
  };
  
  // Input blur event
  const onInputBlur = () => {
    console.log("Input blurred");
  };
  
  // Test with a manual trigger for Deezer API
  const testSearchAPICall = () => {
    console.log("Testing Deezer API call directly");
    getSongs("Dua Lipa");
  };
  
  // Test with a different API to check if CORS/network is the issue
  const testAlternativeAPI = async () => {
    const statusEl = document.createElement('div');
    statusEl.style.position = 'fixed';
    statusEl.style.bottom = '20px';
    statusEl.style.left = '20px';
    statusEl.style.backgroundColor = 'rgba(0,0,0,0.8)';
    statusEl.style.color = 'white';
    statusEl.style.padding = '10px';
    statusEl.style.borderRadius = '5px';
    statusEl.style.zIndex = '9999';
    statusEl.innerHTML = 'Testing external API access...';
    document.body.appendChild(statusEl);
    
    try {
      console.log("Testing access to JSONPlaceholder API");
      statusEl.innerHTML += '<br>Trying JSONPlaceholder API...';
      
      const response = await fetch('https://jsonplaceholder.typicode.com/todos/1');
      const data = await response.json();
      
      console.log("JSONPlaceholder API test successful:", data);
      statusEl.innerHTML += '<br>External API test successful!';
      
      // Now try iTunes API as another test
      statusEl.innerHTML += '<br>Trying iTunes API...';
      const itunesResponse = await fetch('https://itunes.apple.com/search?term=jack+johnson&limit=1');
      const itunesData = await itunesResponse.json();
      
      console.log("iTunes API test result:", itunesData);
      if (itunesData && itunesData.results && itunesData.results.length > 0) {
        statusEl.innerHTML += '<br>iTunes API test successful!';
        statusEl.innerHTML += '<br>Network and CORS appear to be working.';
        statusEl.innerHTML += '<br>Issue is likely specific to Deezer API.';
      } else {
        statusEl.innerHTML += '<br>iTunes API returned empty results.';
      }
    } catch (error) {
      console.error("API test failed:", error);
      statusEl.innerHTML += `<br>Test failed: ${error.message}`;
      statusEl.innerHTML += '<br>Possible network or CORS issue with your setup.';
    }
    
    setTimeout(() => {
      try {
        document.body.removeChild(statusEl);
      } catch (e) {
        console.error("Could not remove status element:", e);
      }
    }, 8000);
  };
  
  // Direct search function for the button
  const handleSearchButtonClick = () => {
    if (searchInputRef.current) {
      const inputValue = searchInputRef.current.value.trim();
      console.log("Search button clicked with input ref value:", inputValue);
      
      if (inputValue !== "") {
        getSongs(inputValue);
      } else {
        console.log("Search button clicked but input is empty");
        alert("Please enter an artist or song name to search");
      }
    } else {
      console.log("Search input reference not found");
      
      // Fallback to querySelector
      const searchInput = document.querySelector(`.${s.searchInput}`);
      if (searchInput && searchInput.value.trim() !== "") {
        console.log("Search button clicked with value:", searchInput.value);
        getSongs(searchInput.value.trim());
      } else {
        console.log("Could not find search input element");
        alert("Could not find search input. Please try clicking on the input field first.");
      }
    }
  };

  const getSongs = async (userInput) => {
    // Show some UI feedback that search is in progress
    console.log("Searching Deezer API for:", userInput);
    
    // Remove any existing search indicators first
    const existingIndicator = document.getElementById('searchIndicator');
    if (existingIndicator && existingIndicator.parentNode) {
      existingIndicator.parentNode.removeChild(existingIndicator);
    }
    
    // Show user we're searching with a small indicator near the search box
    const searchIndicator = document.createElement('div');
    searchIndicator.style.position = 'absolute';
    searchIndicator.style.right = '50px';
    searchIndicator.style.top = '50%';
    searchIndicator.style.transform = 'translateY(-50%)';
    searchIndicator.style.fontSize = '12px';
    searchIndicator.style.color = '#ff50ff';
    // searchIndicator.style.animation = 'pulse 1s infinite';
    searchIndicator.innerHTML = 'Searching...';
    searchIndicator.id = 'searchIndicator';
    
    // Add animation style
    const style = document.createElement('style');
    style.innerHTML = `
      @keyframes pulse {
        0% { opacity: 0.5; }
        50% { opacity: 1; }
        100% { opacity: 0.5; }
      }
    `;
    document.head.appendChild(style);
    
    // Find the search container and append the indicator
    const searchContainer = document.querySelector(`.${s.searchContainer}`);
    if (searchContainer) {
      searchContainer.style.position = 'relative';
      searchContainer.appendChild(searchIndicator);
    }
    
    try {
      // Properly encode the search term
      const encodedQuery = encodeURIComponent(userInput);
      
      // Create URLs for different search types
      const apiUrls = [
        // Default track search
        `https://api.deezer.com/search?q=${encodedQuery}&output=jsonp`,
        // Artist-specific search
        `https://api.deezer.com/search?q=artist:"${encodedQuery}"&output=jsonp`,
        // Album-specific search
        `https://api.deezer.com/search?q=album:"${encodedQuery}"&output=jsonp`
      ];
      
      // Keep track of all found tracks to avoid duplicates
      let allFoundTracks = [];
      
      // Process each search type
      for (const apiUrl of apiUrls) {
        try {
          console.log("Searching Deezer with URL:", apiUrl);
          // Use JSONP approach
          let response = await fetchJsonp(apiUrl);
          
          if (response.ok) {
            let data = await response.json();
            
            if (data.data && data.data.length > 0) {
              // Add unique tracks to our results
              data.data.forEach(track => {
                if (!allFoundTracks.some(existing => existing.id === track.id)) {
                  allFoundTracks.push(track);
                }
              });
            }
          }
        } catch (err) {
          console.error("Error with specific Deezer search:", err);
          // Continue with other search types even if one fails
        }
      }
      
      // Process all found tracks
      if (allFoundTracks.length > 0) {
        console.log(`Found ${allFoundTracks.length} unique tracks from searches`);
        processSearchResults({ data: allFoundTracks }, userInput, searchIndicator);
      } else {
        console.log("No tracks found from any search type");
        if (searchIndicator) {
          searchIndicator.innerHTML = "No results";
          setTimeout(() => {
            if (searchIndicator.parentNode) {
              searchIndicator.parentNode.removeChild(searchIndicator);
            }
          }, 2000);
        }
      }
    } catch (error) {
      console.error("Exception during Deezer search:", error);
      
      if (searchIndicator) {
        searchIndicator.innerHTML = "Search failed";
        setTimeout(() => {
          if (searchIndicator.parentNode) {
            searchIndicator.parentNode.removeChild(searchIndicator);
          }
        }, 2000);
      }
    }
  };
  
  // Helper function to process search results
  const processSearchResults = (response, userInput, statusElement) => {
    console.log("Processing search results");
    
    if (statusElement) {
      statusElement.innerHTML = `Found ${response.data && response.data.length ? response.data.length : 0} tracks`;
      
      // Ensure we remove the status element after a delay
      setTimeout(() => {
        if (statusElement.parentNode) {
          statusElement.parentNode.removeChild(statusElement);
        }
      }, 2000);
    }
    
    if (response.data && response.data.length > 0) {
      // récupérer le tableau de tracks du store existant
      const _tracks = [...tracks];
      
      // Keep track of how many new tracks we add vs. duplicates we skip
      let newTracksCount = 0;
      let duplicatesCount = 0;

      // pour chaque track renvoyée par l'API
      response.data.forEach((result) => {
        // Check if the track already exists in the tracks array
        const trackExists = _tracks.some(existingTrack => tracksMatch(existingTrack, result));
        
        if (!trackExists) {
          _tracks.push(result);
          newTracksCount++;
        } else {
          duplicatesCount++;
          console.log(`Track "${result.title}" already exists, skipping`);
        }
      });

      // màj le store
      setTracks(_tracks);
      
      // Log results to console instead of showing toast
      console.log(`Added ${newTracksCount} new tracks from Deezer! (Skipped ${duplicatesCount} duplicates)`);
    } else {
      console.log(`No tracks found on Deezer for: "${userInput}"`);
    }
  }

  // Helper function to compare tracks
  const tracksMatch = (track1, track2) => {
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
  };

  // Debug function to log play history
  useEffect(() => {
    if (playHistory && playHistory.length > 0) {
      console.log("Current play history:", playHistory);
    }
  }, [playHistory, sortUpdateTrigger]);

  // Sort tracks by play history (recently played first)
  const getSortedTracks = useCallback(() => {
    // Create a copy of tracks to sort
    const tracksCopy = [...tracks];
    
    // If there's an active search term, prioritize matches at the top
    if (searchTerm) {
      // Return search-prioritized tracks
      return tracksCopy.sort((trackA, trackB) => {
        const titleA = trackA.title?.toLowerCase() || "";
        const titleB = trackB.title?.toLowerCase() || "";
        const searchTermLower = searchTerm.toLowerCase();
        
        // Exact matches first
        const exactMatchA = titleA === searchTermLower;
        const exactMatchB = titleB === searchTermLower;
        
        if (exactMatchA && !exactMatchB) return -1;
        if (!exactMatchA && exactMatchB) return 1;
        
        // Then starts-with matches
        const startsWithA = titleA.startsWith(searchTermLower);
        const startsWithB = titleB.startsWith(searchTermLower);
        
        if (startsWithA && !startsWithB) return -1;
        if (!startsWithA && startsWithB) return 1;
        
        // Then play history order (recently played first)
        const historyItemA = playHistory.find(item => tracksMatch(item.track, trackA));
        const historyItemB = playHistory.find(item => tracksMatch(item.track, trackB));
        
        if (historyItemA && historyItemB) {
          return historyItemB.lastPlayed - historyItemA.lastPlayed;
        }
        
        // Played tracks above unplayed ones
        if (historyItemA) return -1;
        if (historyItemB) return 1;
        
        // Finally alphabetical order
        return titleA.localeCompare(titleB);
      });
    }
    
    // If no search, sort by play history (recently played first)
    if (!playHistory || playHistory.length === 0) {
      return tracksCopy;
    }
    
    // Sort tracks by their position in play history (most recent first)
    return tracksCopy.sort((trackA, trackB) => {
      // Find tracks in play history
      const historyItemA = playHistory.find(item => tracksMatch(item.track, trackA));
      const historyItemB = playHistory.find(item => tracksMatch(item.track, trackB));
      
      // If both tracks are in history, compare timestamps
      if (historyItemA && historyItemB) {
        return historyItemB.lastPlayed - historyItemA.lastPlayed;
      }
      
      // If only trackA is in history, it comes first
      if (historyItemA) return -1;
      
      // If only trackB is in history, it comes first
      if (historyItemB) return 1;
      
      // If neither track is in history, maintain original order
      return 0;
    });
  }, [tracks, playHistory, sortUpdateTrigger, tracksMatch, searchTerm]);

  // Get tracks to display based on active tab, search term, and sort order
  const getDisplayedTracks = useCallback(() => {
    // Get the appropriate track list based on active tab
    const baseTracks = activeTab === "all" ? getSortedTracks() : favorites;
    
    // If searching, temporarily show all matching results using fuzzy search
    if (searchTerm && searchTerm.trim() !== '') {
      const searchTermLower = searchTerm.toLowerCase().trim();
      
      // Create Fuse instance for fuzzy searching
      const fuseOptions = {
        keys: ['title', 'artist.name', 'artists', 'album.title', 'album'],
        includeScore: true,
        threshold: 0.4, // Lower threshold means more strict matching
        minMatchCharLength: 2
      };
      
      const fuse = new Fuse(baseTracks, fuseOptions);
      const fuseResults = fuse.search(searchTermLower);
      
      // Return results that match with fuzzy search
      return fuseResults.map(result => result.item);
    }
    
    // Filter tracks when not searching
    return baseTracks.filter(track => {
      // In favorites tab, show all favorites
      if (activeTab === "favorites") {
        return true;
      }
      
      // In all tracks tab, only show tracks that:
      // 1. Have been played before
      // 2. Are uploaded tracks (more inclusive detection)
      const isPlayed = playHistory.some(historyItem => tracksMatch(historyItem.track, track));
      
      // More comprehensive check for uploaded tracks
      const isUploaded = (
        // Check if this is not a Deezer track (Deezer tracks have an ID)
        !track.id ||
        // Has localhost in preview URL
        (track.preview && (
          track.preview.includes('localhost') || 
          track.preview.includes('blob:') || 
          track.preview.startsWith('data:')
        )) ||
        // Or has a source property (often used for uploaded files)
        track.src ||
        // Or has been explicitly marked as uploaded
        track.isUploaded === true
      );
      
      // Remove the recently added tracks option
      return isPlayed || isUploaded;
    });
  }, [activeTab, favorites, getSortedTracks, searchTerm, playHistory]);
  
  // Compute filtered tracks (will re-compute when dependencies change)
  const filteredTracks = getDisplayedTracks();
  
  // Debug information
  useEffect(() => {
    console.log("All available tracks:", tracks.length);
    console.log("Filtered tracks:", filteredTracks.length);
    
    if (filteredTracks.length === 0 && tracks.length > 0) {
      console.log("Filter criteria:");
      console.log("- Active tab:", activeTab);
      console.log("- Search term:", searchTerm);
      console.log("- Play history length:", playHistory.length);
      
      // Check the first few tracks to see why they're filtered out
      const sampleSize = Math.min(3, tracks.length);
      console.log(`Debug info for first ${sampleSize} tracks:`);
      
      for (let i = 0; i < sampleSize; i++) {
        const track = tracks[i];
        console.log(`Track ${i}: "${track.title || 'Unknown'}"`, {
          isPlayed: playHistory.some(historyItem => tracksMatch(historyItem.track, track)),
          isUploaded: !!(
            (track.preview && (
              track.preview.includes('localhost') || 
              track.preview.includes('blob:') || 
              track.preview.startsWith('data:')
            )) || 
            track.src || 
            track.isUploaded === true
          ),
          hasPreview: !!track.preview,
          hasSrc: !!track.src,
          previewUrl: track.preview,
          srcUrl: track.src
        });
      }
    }
  }, [tracks, filteredTracks, activeTab, searchTerm, playHistory]);

  // Handle top search input change
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };
  
  // Simplify keyboard handling to just handle Enter for search
  const handleTopSearchKeyDown = (e) => {
    if (e.key === 'Enter' || e.keyCode === 13) {
      handleTopSearchSubmit(e);
    }
  };

  // Handle top search submit for both filtering and Deezer search
  const handleTopSearchSubmit = (e) => {
    if (e) e.preventDefault();
    
    const searchValue = searchTerm.trim();
    if (searchValue && !isSearching) {
      setIsSearching(true); // Prevent multiple simultaneous searches
      
      // First, filter the existing tracks (this happens automatically via searchTerm state)
      
      // Then also search Deezer
      getSongs(searchValue).finally(() => {
        setIsSearching(false); // Reset search state when done
        
        // Clean up unplayed Deezer tracks when search completes
        setTimeout(cleanupUnplayedDeezerTracks, 5000);
      });
    }
  };
  
  // Clean up unplayed Deezer tracks to avoid cluttering the store
  const cleanupUnplayedDeezerTracks = () => {
    // Only clean up if we're in "all" tab and not searching
    if (activeTab === "all" && (!searchTerm || searchTerm.trim() === '')) {
      console.log("Cleaning up unplayed Deezer tracks...");
      
      // Get all tracks that are Deezer tracks (have ID) but have never been played
      const allTracks = [...tracks];
      const tracksToKeep = allTracks.filter(track => {
        // Keep if not a Deezer track (no ID)
        if (!track.id) return true;
        
        // Keep if it's been played before
        const isPlayed = playHistory.some(historyItem => tracksMatch(historyItem.track, track));
        if (isPlayed) return true;
        
        // Keep if it's a favorite
        const isFavorite = favorites.some(fav => tracksMatch(fav, track));
        if (isFavorite) return true;
        
        // Otherwise, it's an unplayed Deezer track - remove it
        return false;
      });
      
      // If we removed any tracks, update the store
      if (tracksToKeep.length < allTracks.length) {
        console.log(`Removed ${allTracks.length - tracksToKeep.length} unplayed Deezer tracks`);
        setTracks(tracksToKeep);
      }
    }
  };
  
  // Handle clear tracks button click
  const handleClearTracks = () => {
    if (window.confirm("Are you sure you want to clear all tracks? This will remove all saved tracks, including those from Deezer.")) {
      clearTracks();
      
      // Show confirmation message
      const message = document.createElement('div');
      message.style.position = 'fixed';
      message.style.top = '20px';
      message.style.left = '50%';
      message.style.transform = 'translateX(-50%)';
      message.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
      message.style.color = 'white';
      message.style.padding = '10px 20px';
      message.style.borderRadius = '5px';
      message.style.zIndex = '9999';
      message.style.fontSize = '14px';
      message.innerHTML = 'All tracks cleared';
      document.body.appendChild(message);
      
      setTimeout(() => {
        try {
          document.body.removeChild(message);
        } catch (e) {}
      }, 3000);
      
      // Commented out loading of default tracks after clearing
      // fetchMetadata(TRACKS, [], setTracks);
    }
  };

  // Handle closing the tracklist - clear search and filter unplayed tracks
  const handleCloseTracklist = () => {
    // Hide the tracklist
    setShowTracks(false);
    
    // Clear the search
    setSearchTerm("");
    
    // Remove any search indicators when closing the tracklist
    const searchIndicator = document.getElementById('searchIndicator');
    if (searchIndicator && searchIndicator.parentNode) {
      searchIndicator.parentNode.removeChild(searchIndicator);
    }
    
    // No longer clearing unplayed tracks when closing
    // useStore.getState().clearUnplayedTracks();
  };

  // Listen for track upload events to auto-play and show tracklist
  useEffect(() => {
    const handleTrackUploaded = (event) => {
      console.log("Track uploaded event received");
      
      // Open the tracklist if it's not already open
      if (!showTracks) {
        setShowTracks(true);
      }
      
      // Force re-sort to ensure new tracks appear
      forceReSort();
      
      // Auto-play the newly uploaded track if available
      if (event.detail && event.detail.track) {
        console.log("Auto-playing newly uploaded track:", event.detail.track);
        
        // Get the track from the event
        const track = event.detail.track;
        
        // Ensure the track has a valid source URL
        const trackSource = track.preview || track.src || track.path;
        
        if (!trackSource) {
          console.error("No valid source URL for track:", track);
          return;
        }
        
        // Ensure all required properties are present
        const enhancedTrack = {
          ...track,
          preview: trackSource,
          src: trackSource,
          id: track.id || `track-${Date.now()}`
        };
        
        // Explicitly update the 3D scene cover if it's the active visualizer
        if (scene && scene.cover && typeof scene.cover.setCover === 'function') {
          const coverImage = enhancedTrack.cover || 
                            (enhancedTrack.album && enhancedTrack.album.cover_xl) || 
                            "https://placehold.co/600x400";
          console.log("Updating 3D scene cover for uploaded track:", coverImage);
          scene.cover.setCover(coverImage);
          
          // Force a scene update if needed
          if (typeof scene.update === 'function') {
            scene.update();
          }
        }
        
        // Create a custom event to trigger playback of this track
        const playEvent = new CustomEvent('play-track', { 
          detail: { track: enhancedTrack }
        });
        
        // Direct call to AudioController for more reliable playback
        if (audioController) {
          console.log("Directly playing track with AudioController");
          const src = trackSource;
          try {
            // Initialize AudioController if needed
            if (!audioController.audio) {
              console.log("Initializing AudioController");
              audioController.setup();
            }
            
            // Play the track directly
            audioController.play(src, enhancedTrack);
          } catch (error) {
            console.error("Error directly playing track:", error);
          }
        }
        
        // Also dispatch the event as a backup approach
        setTimeout(() => {
          window.dispatchEvent(playEvent);
          console.log("Play event dispatched for uploaded track");
        }, 300);
      }
    };
    
    window.addEventListener('track-uploaded', handleTrackUploaded);
    
    return () => {
      window.removeEventListener('track-uploaded', handleTrackUploaded);
    };
  }, [forceReSort, showTracks]);

  return (
    <>
      <div
        className={s.toggleTracks}
        onClick={() => setShowTracks(!showTracks)}
      >
        Tracklist
      </div>

      <section
        className={`
      ${s.wrapper}
      ${showTracks ? s.wrapper_visible : ""}`}
      >
        <button 
          className={s.closeButton} 
          onClick={handleCloseTracklist}
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
        
        <div className={s.searchContainer} style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
          <input
            type="text"
            placeholder="Search tracks or Deezer"
            className={s.searchInputTop}
            value={searchTerm}
            onChange={handleSearchChange}
            onKeyDown={handleTopSearchKeyDown}
          />
          <button
            onClick={handleTopSearchSubmit}
            style={{
              marginLeft: '10px',
              padding: '6px',
              background: 'linear-gradient(to right, #ff50ff, #5050ff)',
              border: 'none',
              borderRadius: '50%',
              color: 'white',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '30px',
              height: '30px'
            }}
            aria-label="Search"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M15.5 14H14.71L14.43 13.73C15.41 12.59 16 11.11 16 9.5C16 5.91 13.09 3 9.5 3C5.91 3 3 5.91 3 9.5C3 13.09 5.91 16 9.5 16C11.11 16 12.59 15.41 13.73 14.43L14 14.71V15.5L19 20.49L20.49 19L15.5 14ZM9.5 14C7.01 14 5 11.99 5 9.5C5 7.01 7.01 5 9.5 5C11.99 5 14 7.01 14 9.5C14 11.99 11.99 14 9.5 14Z" fill="white"/>
            </svg>
          </button>
        </div>

        <div className={s.tracks}>
          <div className={s.header}>
            <span className={s.order}>#</span>
            <span className={s.title}>Title</span>
            <span className={s.duration}>Duration</span>
          </div>

          {filteredTracks.length > 0 ? (
            filteredTracks.map((track, i) => (
              <Track
                key={`${track.id || `track-${i}`}-${sortUpdateTrigger}`}
                title={track.title || "Unknown Track"}
                cover={track.album?.cover_xl || track.cover || "https://via.placeholder.com/150"}
                src={track.preview}
                duration={track.duration || 0}
                artists={track.artist?.name || track.artists || "Unknown Artist"}
                index={i}
                track={track}
                album={track.album?.title || track.album || "Unknown Album"}
              />
            ))
          ) : (
            <div className={s.emptyState}>
              {searchTerm ? 
                `No tracks found matching "${searchTerm}"` : 
                activeTab === "favorites" 
                  ? "No favorite tracks yet. Click the heart icon on a track to add it to your favorites." 
                  : "No tracks available. Search for tracks below."}
            </div>
          )}
        </div>
      </section>
    </>
  );
};

export default Tracks;