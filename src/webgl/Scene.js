import * as THREE from "three";
import gsap from "gsap";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import Stats from "three/examples/jsm/libs/stats.module.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { GUI } from "three/addons/libs/lil-gui.module.min.js";
import { enhanceGUI } from "../utils/gui-enhancer";
import { loadVisualizerSettings, saveVisualizerSetting, resetVisualizerSettings } from "../utils/settings-manager";

// post processing
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";

// objects
import Line from "./objects/Line";
import Board from "./objects/Board";
import LogoIut from "./objects/LogoIut";
import Cover from "./objects/Cover";
import audioController from "../utils/AudioController";
import Cube from "./objects/Cube";
import Heart from "./objects/Heart";
import Star from "./objects/Star";
import Crown from "./objects/Crown";

class Scene {
  constructor() {}

  // First phase of setup - initialize everything except showing objects
  setupInitial(canvas) {
    this.canvas = canvas;
    this.width = window.innerWidth;
    this.height = window.innerHeight;

    this.currentObject = null;

    // Set up the base THREE.js environment
    this.setupScene();
    this.setupCamera();
    this.setupRenderer();
    this.setupControls();
    // this.setupStats();
    this.setupPostProcessing();
    this.setupGUI();

    this.setupTextureLoader();
    this.setupGltfLoader();

    this.addEvents();
    
    // Initialize objects but don't add them to the scene yet
    this.initializeObjects();
  }

  // Second phase - complete the setup by showing the appropriate visualizer
  completeSetup() {
    // Attempt to restore the last selected visualizer
    const visualizerRestored = this.restoreLastVisualizer();
    
    // If no visualizer was restored, default to the board
    if (!visualizerRestored) {
      this.camera.position.z = 20;
      this.scene.add(this.board.group);
      this.currentObject = this.board;
      this.currentVisualizerIndex = 1; // Index for board
    }
  }

  // For backward compatibility
  setup(canvas) {
    this.setupInitial(canvas);
    this.completeSetup();
  }

  // Initialize objects but don't add them to the scene yet
  initializeObjects() {
    // Initialize all visualizer objects
    this.line = new Line();
    this.board = new Board();
    this.logoIut = new LogoIut();
    this.cover = new Cover();
    // this.cube = new Cube();
    this.heart = new Heart();
    this.star = new Star();
    this.crown = new Crown();
  }

  // Method to restore the last selected visualizer from the store
  restoreLastVisualizer() {
    try {
      // Try to get the store state
      const storeState = window._getStoreState ? window._getStoreState() : null;
      
      if (storeState && storeState.currentVisualizer !== null) {
        // Get the saved visualizer index
        const visualizerIndex = storeState.currentVisualizer;
        console.log("Restoring last visualizer:", visualizerIndex);
        
        // Set the visualizer
        this.pickVisualizer(visualizerIndex);
        return true;
      }
    } catch (error) {
      console.error("Error restoring last visualizer:", error);
    }
    
    return false;
  }

  setupGUI() {
    this.gui = new GUI({
      width: 300,
      title: 'Controls',
      container: document.body
    });
    
    // Position the GUI at the top left of the screen instead of right
    const guiElement = this.gui.domElement;
    guiElement.style.position = 'absolute';
    guiElement.style.top = '24px';
    guiElement.style.left = '24px'; // Changed from right to left
    guiElement.style.right = 'auto'; // Remove right positioning
    guiElement.style.zIndex = '2'; // Lower z-index so it doesn't cover everything
    
    // Load initial settings for board (default visualizer)
    const initialSettings = loadVisualizerSettings(1); // Board is index 1
    if (initialSettings && initialSettings.bloom) {
      this.bloomParams.threshold = initialSettings.bloom.threshold;
      this.bloomParams.strength = initialSettings.bloom.strength;
      this.bloomParams.radius = initialSettings.bloom.radius;
      
      // Apply loaded settings to bloom pass
      this.bloomPass.threshold = this.bloomParams.threshold;
      this.bloomPass.strength = this.bloomParams.strength;
      this.bloomPass.radius = this.bloomParams.radius;
    }
    
    this.bloomFolder = this.gui.addFolder("Bloom");
    this.bloomFolder.close(); // Close the bloom folder by default
    this.bloomFolder
      .add(this.bloomParams, "threshold", 0, 1)
      .onChange((value) => {
        this.bloomPass.threshold = value;
        
        // Save the setting for current visualizer
        if (this.currentVisualizerIndex !== undefined) {
          saveVisualizerSetting(this.currentVisualizerIndex, 'bloom', 'threshold', value);
        }
      })
      .listen(); // updates the GUI visually with the new value

    this.bloomFolder
      .add(this.bloomParams, "strength", 0, 3)
      .onChange((value) => {
        this.bloomPass.strength = value;
        
        // Save the setting for current visualizer
        if (this.currentVisualizerIndex !== undefined) {
          saveVisualizerSetting(this.currentVisualizerIndex, 'bloom', 'strength', value);
        }
      })
      .listen();

    this.bloomFolder
      .add(this.bloomParams, "radius", 0, 1)
      .onChange((value) => {
        this.bloomPass.radius = value;
        
        // Save the setting for current visualizer
        if (this.currentVisualizerIndex !== undefined) {
          saveVisualizerSetting(this.currentVisualizerIndex, 'bloom', 'radius', value);
        }
      })
      .listen();
    
    // Add reset button to reset current visualizer settings
    this.bloomFolder.add({
      resetSettings: () => {
        if (this.currentVisualizerIndex !== undefined) {
          const defaultSettings = resetVisualizerSettings(this.currentVisualizerIndex);
          if (defaultSettings && defaultSettings.bloom) {
            // Update bloom parameters
            this.bloomParams.threshold = defaultSettings.bloom.threshold;
            this.bloomParams.strength = defaultSettings.bloom.strength;
            this.bloomParams.radius = defaultSettings.bloom.radius;
            
            // Apply to bloom pass
            this.bloomPass.threshold = defaultSettings.bloom.threshold;
            this.bloomPass.strength = defaultSettings.bloom.strength;
            this.bloomPass.radius = defaultSettings.bloom.radius;
          }
        }
      }
    }, 'resetSettings').name('Reset Settings');
      
    // Apply our custom GUI enhancement
    enhanceGUI(this.gui);
  }

  setupPostProcessing() {
    this.composer = new EffectComposer(this.renderer);
    this.renderPass = new RenderPass(this.scene, this.camera);

    this.bloomParams = {
      threshold: 0,
      strength: 0.6,
      radius: 1,
    };

    this.bloomPass = new UnrealBloomPass(
      new THREE.Vector2(this.width, this.height),
      0,
      0,
      0
    );

    this.bloomPass.threshold = this.bloomParams.threshold;
    this.bloomPass.strength = this.bloomParams.strength;
    this.bloomPass.radius = this.bloomParams.radius;

    this.composer.addPass(this.renderPass);
    this.composer.addPass(this.bloomPass);
  }

  setupGltfLoader() {
    this.gltfLoader = new GLTFLoader();
  }

  setupTextureLoader() {
    this.textureLoader = new THREE.TextureLoader();
  }

  setupControls() {
    this.controls = new OrbitControls(this.camera, this.canvas);
    this.controls.enableDamping = true;
  }

  setupStats() {
    this.stats = new Stats();
    document.body.appendChild(this.stats.dom);
  }

  addEvents() {
    gsap.ticker.add(this.tick);
    window.addEventListener("resize", this.onResize);
  }

  setupScene() {
    this.scene = new THREE.Scene();
  }

  setupCamera() {
    this.camera = new THREE.PerspectiveCamera(
      75,
      this.width / this.height,
      0.1,
      1000
    );

    // this.camera.position.z = 20;
  }

  setupRenderer() {
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: false,
    });

    this.renderer.setSize(this.width, this.height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  }

  pickVisualizer(index) {
    // Store the current visualizer index
    this.currentVisualizerIndex = index;
    
    // Only try to remove if we have a current object
    if (this.currentObject && this.currentObject.group) {
      // remove the rendered group
      this.scene.remove(this.currentObject.group);
    }

    // Load settings for the selected visualizer
    const settings = loadVisualizerSettings(index);
    
    // change the current object
    switch (index) {
      case 0:
        // line
        this.camera.position.z = 200;
        this.currentObject = this.line;
        break;
      case 1:
        // board
        this.camera.position.z = 20;
        this.currentObject = this.board;
        break;
      case 2:
        // logo iut
        this.camera.position.z = 5;
        this.currentObject = this.logoIut;
        break;
      case 3:
        // cover
        this.camera.position.z = 20;
        this.currentObject = this.cover;
        
        // Update Cover-specific controls if they exist
        if (this.cover.folder && settings && settings.cover) {
          this.cover.material.uniforms.uSize.value = settings.cover.uSize || 4;
        }
        break;
      case 4:
        // heart
        this.camera.position.z = 20;
        this.currentObject = this.heart;
        break;
      case 5:
        // star
        this.camera.position.z = 20;
        this.currentObject = this.star;
        break;
      case 6:
        // crown
        this.camera.position.z = 16;
        this.currentObject = this.crown;
        break;
      default:
        break;
    }

    // Apply loaded bloom settings if available
    if (settings && settings.bloom) {
      // Update bloom parameters
      this.bloomParams.threshold = settings.bloom.threshold;
      this.bloomParams.strength = settings.bloom.strength;
      this.bloomParams.radius = settings.bloom.radius;
      
      // Apply to bloom pass
      this.bloomPass.threshold = settings.bloom.threshold;
      this.bloomPass.strength = settings.bloom.strength;
      this.bloomPass.radius = settings.bloom.radius;
    }

    // Make sure we have a currentObject before trying to add its group
    if (this.currentObject && this.currentObject.group) {
      // add the new group
      this.scene.add(this.currentObject.group);
    }
  }

  tick = (time, deltaTime, frame) => {
    // this.stats.begin();

    // this.renderer.render(this.scene, this.camera);
    this.composer.render(); // prend le relais sur le renderer pour le post-processing

    this.controls.update();

    if (this.currentObject && audioController.fdata) {
      this.currentObject.update(time, deltaTime);
    }

    // this.stats.end();
  };

  onResize = () => {
    this.width = window.innerWidth;
    this.height = window.innerHeight;

    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(this.width, this.height);
    this.composer.setSize(this.width, this.height);
  };
}

const scene = new Scene();
export default scene;
