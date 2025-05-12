import jsmediatags from "jsmediatags/dist/jsmediatags.min.js";
import scene from "../webgl/Scene";

// Helper function to check if two tracks match (same as in store.jsx)
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
  
  // Compare by title and name if both exist
  if ((track1.title && track2.title) || (track1.name && track2.name)) {
    return (track1.title === track2.title) || (track1.name === track2.name);
  }
  
  // Can't determine a match
  return false;
}

export const fetchMetadata = async (TRACKS, tracks, setTracks) => {
  console.log("======== LOADING LOCAL TRACKS ========");
  console.log("Local tracks to process:", TRACKS);
  
  const promises = TRACKS.map(
    (track) =>
      new Promise((resolve, reject) => {
        console.log(`Processing local track: ${track.name} (path: ${track.path})`);
        // get duration
        const audio = new Audio(track.path);
        audio.addEventListener("loadedmetadata", () => {
          console.log(`Audio metadata loaded for: ${track.name}, duration: ${audio.duration}s`);
          
          // Fetch the MP3 file as a Blob
          console.log(`Fetching MP3 file as blob: ${track.path}`);
          fetch(track.path)
            .then((response) => {
              if (!response.ok) {
                throw new Error(`Failed to fetch ${track.path}`);
              }
              console.log(`Fetch successful for: ${track.name}`);
              return response.blob();
            })
            .then((blob) => {
              console.log(`Reading metadata from blob for: ${track.name}`);
              // Read metadata from the Blob
              jsmediatags.read(blob, {
                onSuccess: (tag) => {
                  console.log(`Metadata successfully read for: ${track.name}`, tag.tags);
                  const { title, artist, album, picture } = tag.tags;
                  // Extract cover image if it exists
                  let cover = "https://placehold.co/600x400";
                  if (picture) {
                    const base64String = btoa(
                      picture.data
                        .map((char) => String.fromCharCode(char))
                        .join("")
                    );
                    cover = `data:${picture.format};base64,${base64String}`;
                    console.log(`Cover image extracted for: ${track.name}`);
                  } else {
                    console.log(`No cover image found for: ${track.name}`);
                  }
                  let _artists = [];
                  if (artist) {
                    _artists = artist.split(",");
                  }

                  const trackObj = {
                    index: track.id,
                    name: track.name,
                    title: title || track.name,
                    duration: audio.duration,
                    artists: _artists || [],
                    album: {
                      cover_xl: cover,
                      title: album || "Unknown Album",
                    },
                    preview: track.path,
                  };
                  
                  console.log(`Resolved track object for: ${track.name}`, trackObj);
                  resolve(trackObj);
                },
                onError: (error) => {
                  console.error(
                    `Error reading metadata for ${track.name}:`,
                    error
                  );
                  resolve({
                    index: track.id,
                    name: track.name,
                    title: track.name,
                    duration: audio.duration,
                    artists: [],
                    album: {
                      cover_xl: cover,
                      title: "Unknown Album",
                    },
                    preview: track.path,
                  });
                },
              });
            })
            .catch((error) => {
              console.error(`Failed to fetch ${track.name}:`, error);
              reject(error);
            });
        });
      })
  );
  try {
    console.log("Waiting for all local tracks to be processed...");
    const results = await Promise.all(promises);
    console.log("All local tracks processed:", results);

    // récupérer le tableau de tracks du store existant
    const _tracks = [...tracks];
    console.log("Existing tracks before adding local tracks:", _tracks.length);

    // Add tracks only if they don't already exist
    let newTracksCount = 0;
    // pour chaque track processed par la librairie pour récupérer les metadata
    results.forEach((result) => {
      // Check if the track already exists in the tracks array
      const trackExists = _tracks.some(existingTrack => tracksMatch(existingTrack, result));
      
      if (!trackExists) {
        _tracks.push(result);
        newTracksCount++;
      } else {
        console.log(`Track "${result.title || result.name}" already exists, skipping`);
      }
    });

    console.log(`Added ${newTracksCount} new tracks (skipped duplicates)`);
    console.log("Tracks after adding local tracks:", _tracks.length);
    // màj le store
    setTracks(_tracks);
    console.log("======== FINISHED LOADING LOCAL TRACKS ========");

    // Dispatch track-uploaded event for the first newly added track to trigger autoplay
    if (newTracksCount > 0 && results.length > 0) {
      // Find the first track that was actually added (not skipped as duplicate)
      const newTrack = results.find(result => {
        return !tracks.some(existingTrack => tracksMatch(existingTrack, result));
      });
      
      if (newTrack) {
        // Ensure the track has all properties needed for playback
        const enhancedTrack = {
          ...newTrack,
          id: newTrack.id || `track-${Date.now()}`,
          preview: newTrack.preview || newTrack.path,
          src: newTrack.preview || newTrack.path,
          title: newTrack.title || newTrack.name || "Uploaded Track",
          // Add direct cover property for easier access
          cover: (newTrack.album && newTrack.album.cover_xl) || "https://placehold.co/600x400",
          // These properties ensure compatibility with both track list and player
          isUploaded: true
        };
        
        console.log("Dispatching track-uploaded event for auto-play:", enhancedTrack);
        
        // Update the 3D scene cover first
        if (scene && scene.cover && typeof scene.cover.setCover === 'function') {
          console.log("Directly updating 3D scene cover after upload:", enhancedTrack.cover);
          scene.cover.setCover(enhancedTrack.cover);
          
          // Force a scene update if needed
          if (typeof scene.update === 'function') {
            scene.update();
          }
        }
        
        // Then dispatch the event to ensure proper sequence
        setTimeout(() => {
          window.dispatchEvent(
            new CustomEvent('track-uploaded', { 
              detail: { track: enhancedTrack }
            })
          );
          console.log("track-uploaded event dispatched");
        }, 100);
      }
    }

    // _tracks.push(results)
  } catch (error) {
    console.error("Error fetching metadata:", error);
  }
};
