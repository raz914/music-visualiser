import * as THREE from "three";
import audioController from "../../utils/AudioController";
import scene from "../Scene";
import fragmentShader from "../shaders/cover/fragment.glsl";
import vertexShader from "../shaders/cover/vertex.glsl";
import { saveVisualizerSetting } from "../../utils/settings-manager";

export default class Cover {
  constructor() {
    this.group = new THREE.Group();

    this.geometry = new THREE.PlaneGeometry(12, 12, 256, 256);
    this.material = new THREE.ShaderMaterial({
      uniforms: {
        uMap: new THREE.Uniform(),
        uSize: new THREE.Uniform(4),
        uTime: new THREE.Uniform(0),
        uAudioFrequency: new THREE.Uniform(0),
      },
      side: THREE.DoubleSide,
      fragmentShader: fragmentShader,
      vertexShader: vertexShader,
    });

    this.mesh = new THREE.Points(this.geometry, this.material);

    this.group.add(this.mesh);

    this.addTweaks();
  }

  addTweaks() {
    this.folder = scene.gui.addFolder("Cover");

    this.folder
      .add(this.material.uniforms.uSize, "value", 0, 10)
      .name("uSize")
      .onChange((value) => {
        this.material.uniforms.uSize.value = value;
        
        // Save the setting when it changes
        // Cover is visualizer index 3
        if (scene.currentVisualizerIndex === 3) {
          saveVisualizerSetting(3, 'cover', 'uSize', value);
        }
      })
      .listen(); // rafraichit visuellement la GUI avec la nouvelle valeur
  }

  setCover(src) {
    // Add debug logging
    console.log("Cover.setCover called with src:", src);
    
    // Make sure we have a valid source
    if (!src) {
      console.warn("No cover image source provided to setCover, using fallback");
      src = "https://via.placeholder.com/150";
    }
    
    try {
      // charger la texture
      this.texture = scene.textureLoader.load(
        src, 
        // Success callback
        (texture) => {
          console.log("Cover texture loaded successfully:", texture);
        },
        // Progress callback
        undefined,
        // Error callback
        (error) => {
          console.error("Error loading cover texture:", error);
        }
      );

      // donner la texture au material
      // this.material.map = this.texture;

      console.log("Setting cover texture to material uniform");
      this.material.uniforms.uMap.value = this.texture;

      // force la recompilation du material
      this.material.needsUpdate = true;

      console.log("Cover texture updated successfully");
    } catch (error) {
      console.error("Error in setCover:", error);
    }
  }

  update(time) {
    // màj le time passé en uniform
    this.material.uniforms.uTime.value = time;
    this.material.uniforms.uAudioFrequency.value = audioController.fdata[0];
  }
}
