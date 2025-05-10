import * as THREE from "three";
import audioController from "../../utils/AudioController";

class Star {
  constructor() {
    this.group = new THREE.Group();
    this.createStar();
    this.altColor = new THREE.Color(0xb266ff); // Magenta as third color
    this.baseColor = new THREE.Color(0x8f00ff); // Yellow  //0xffe066 
  }
 //#ebff32  
 //#fdde2c  

  createStar() {
    // Create a 5-pointed star shape
    const outerRadius = 4;
    const innerRadius = 1.7;
    const spikes = 5;
    const shape = new THREE.Shape();
    for (let i = 0; i < spikes * 2; i++) {
      const angle = (i / (spikes * 2)) * Math.PI * 2;
      const r = i % 2 === 0 ? outerRadius : innerRadius;
      const x = Math.cos(angle) * r;
      const y = Math.sin(angle) * r;
      if (i === 0) {
        shape.moveTo(x, y);
      } else {
        shape.lineTo(x, y);
      }
    }
    shape.closePath();

    // Extrude settings (flat by default)
    const extrudeSettings = {
      steps: 1,
      depth: 1.5,
      bevelEnabled: true,
      bevelThickness: 0.3,
      bevelSize: 0.3,
      bevelSegments: 20,
    };

    // Material for lighting and bloom
    this.material = new THREE.MeshPhysicalMaterial({
        color: 0xffe066,
        emissive: 0xfff6b0, // always bright for bloom
        emissiveIntensity: 1.8,
        roughness: 0.15,
        metalness: 0.8,
        clearcoat: 1,
        clearcoatRoughness: 0.1,
      });

    // Geometry and mesh
    this.geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;
    this.mesh.position.set(0, 0, 0);
    this.mesh.scale.set(1.1, 1.1, 0.7); // Slightly smaller than heart
    this.group.add(this.mesh);
  }

  update(time, deltaTime) {
    // Animate scale (pulse) and emissive intensity with the beat
    if (audioController.fdata) {
      const avg = audioController.fdata.reduce((a, b) => a + b, 0) / audioController.fdata.length;
      // Pulse between 1 and 1.25 scale
      const scale = 1 + 1.5 * (avg / 255);
      this.mesh.scale.set(1.1 * scale, 1.1 * scale, 0.7 + 0.3 * (avg / 255));
      // Pulse emissive intensity for extra bloom
      const minEmissive = 1.9;
      const maxEmissive = 5;
      const pulse = minEmissive + (maxEmissive - minEmissive) * (avg / 255);
      this.material.emissiveIntensity = pulse;
    }

    // Auto-rotate the star
    this.mesh.rotation.z += 0.01;
    this.mesh.rotation.y += 0.01;


    // Alternate color effect (blend between yellow and magenta)
    const t = (Math.sin(performance.now() * 0.001) + 1) / 2;
    const blended = this.baseColor.clone().lerp(this.altColor, t);
    this.material.color.copy(blended);
    
    // Keep the emissive always bright for bloom
    // this.material.emissive.set(0xfff6b0); // or 0
  }
}

export default Star; 