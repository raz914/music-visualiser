/**
 * Settings Manager for Visualizer Controls
 * Handles saving and loading control settings for each visualizer type
 */

const STORAGE_KEY = 'iut-visualizer-settings';

// Default settings for each visualizer type
const DEFAULT_SETTINGS = {
  line: {
    bloom: { threshold: 0, strength: 0.6, radius: 1 }
  },
  board: {
    bloom: { threshold: 0, strength: 0.6, radius: 1 }
  },
  logoIut: {
    bloom: { threshold: 0.6, strength: 0.6, radius: 1 }
  },
  cover: {
    bloom: { threshold: 0.6, strength: 0.6, radius: 1 },
    cover: { uSize: 4 }
  },
  heart: {
    bloom: { threshold: 0.2, strength: 0.6, radius: 1 }
  },
  star: {
    bloom: { threshold: 0.2, strength: 0.6, radius: 1 }
  },
  crown: {
    bloom: { threshold: 0.34, strength: 0.6, radius: 1 }
  }
};

// Map from index to visualizer name
const VISUALIZER_MAP = {
  0: 'line',
  1: 'board',
  2: 'logoIut',
  3: 'cover',
  4: 'heart',
  5: 'star',
  6: 'crown'
};

/**
 * Load all visualizer settings from localStorage
 * @returns {Object} The saved settings or default settings if none exist
 */
export function loadSettings() {
  try {
    const savedSettings = localStorage.getItem(STORAGE_KEY);
    if (savedSettings) {
      const parsedSettings = JSON.parse(savedSettings);
      
      // Merge with default settings to ensure all properties exist
      const mergedSettings = { ...DEFAULT_SETTINGS };
      
      // Apply saved settings where they exist
      Object.keys(parsedSettings).forEach(visualizer => {
        if (mergedSettings[visualizer]) {
          mergedSettings[visualizer] = {
            ...mergedSettings[visualizer],
            ...parsedSettings[visualizer]
          };
          
          // Ensure all bloom properties exist
          if (parsedSettings[visualizer].bloom && mergedSettings[visualizer].bloom) {
            mergedSettings[visualizer].bloom = {
              ...mergedSettings[visualizer].bloom,
              ...parsedSettings[visualizer].bloom
            };
          }
        }
      });
      
      return mergedSettings;
    }
  } catch (error) {
    console.error('Error loading settings from localStorage:', error);
  }
  
  return { ...DEFAULT_SETTINGS };
}

/**
 * Save settings for a specific visualizer type
 * @param {number} visualizerIndex - The index of the visualizer
 * @param {string} controlGroup - The control group (e.g., 'bloom')
 * @param {string} property - The property to save
 * @param {any} value - The value to save
 */
export function saveVisualizerSetting(visualizerIndex, controlGroup, property, value) {
  const visualizerName = VISUALIZER_MAP[visualizerIndex];
  if (!visualizerName) return;
  
  try {
    // Load current settings
    const settings = loadSettings();
    
    // Update the specific setting
    if (!settings[visualizerName]) {
      settings[visualizerName] = {};
    }
    
    if (!settings[visualizerName][controlGroup]) {
      settings[visualizerName][controlGroup] = {};
    }
    
    settings[visualizerName][controlGroup][property] = value;
    
    // Save back to localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    
    console.log(`Saved setting for ${visualizerName}.${controlGroup}.${property} = ${value}`);
  } catch (error) {
    console.error('Error saving settings to localStorage:', error);
  }
}

/**
 * Load settings for a specific visualizer
 * @param {number} visualizerIndex - The index of the visualizer
 * @returns {Object} The settings for the specified visualizer
 */
export function loadVisualizerSettings(visualizerIndex) {
  const visualizerName = VISUALIZER_MAP[visualizerIndex];
  if (!visualizerName) return null;
  
  const settings = loadSettings();
  return settings[visualizerName] || DEFAULT_SETTINGS[visualizerName];
}

/**
 * Reset all visualizer settings to defaults
 */
export function resetAllSettings() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_SETTINGS));
  return { ...DEFAULT_SETTINGS };
}

/**
 * Reset settings for a specific visualizer to defaults
 * @param {number} visualizerIndex - The index of the visualizer
 */
export function resetVisualizerSettings(visualizerIndex) {
  const visualizerName = VISUALIZER_MAP[visualizerIndex];
  if (!visualizerName) return;
  
  const settings = loadSettings();
  settings[visualizerName] = { ...DEFAULT_SETTINGS[visualizerName] };
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  return settings[visualizerName];
} 