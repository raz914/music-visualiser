import * as THREE from "three";
import audioController from "../../utils/AudioController";

class Crown {
  constructor() {
    this.group = new THREE.Group();
    this.createCrown();
    this.baseColor = new THREE.Color(0xffd700); // Gold
    this.altColor = new THREE.Color(0xffbb00 ); // Blue
  }
  //#ffbb00

  createCrown() {
    // Crown shape: four distinct spikes, flat bottom, and a band
    const shape = new THREE.Shape();
    // Start at left base
    shape.moveTo(-3.5, -1.5);
    
    // First spike (leftmost)
    shape.lineTo(-3.2, 2.5);
    // Valley between spikes
    shape.lineTo(-1.8, -0.2);
    // Second spike (left-center)
    shape.lineTo(-0.8, 2.5);
    // Valley between spikes
    shape.lineTo(0, -0.2);
    // Third spike (right-center)
    shape.lineTo(0.8, 2.5);
    // Valley between spikes
    shape.lineTo(1.8, -0.2);
    // Fourth spike (rightmost)
    shape.lineTo(3.2, 2.5);
    
    // End at right base
    shape.lineTo(3.5, -1.5);
    // Close base
    shape.lineTo(3.5, -2);
    shape.lineTo(-3.5, -2);
    shape.lineTo(-3.5, -1.5);

    // Extrude settings
    const extrudeSettings = {
      steps: 1,
      depth: 0.5,
      bevelEnabled: true,
      bevelThickness: 0.15,
      bevelSize: 0.15,
      bevelSegments: 2,
    };

    // Gold material
    this.material = new THREE.MeshBasicMaterial({
      color: 0xffd700,
    });

    // Geometry and mesh
    this.geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;
    this.mesh.position.set(0, 0, 0);
    this.mesh.scale.set(1.1, 1.1, 0.7);
    this.group.add(this.mesh);

    // Add the band (rectangle at the bottom)
    const bandGeometry = new THREE.BoxGeometry(7, 0.5, 0.55);
    const bandMaterial = new THREE.MeshBasicMaterial({
      color: 0xffd700,
    });
    const band = new THREE.Mesh(bandGeometry, bandMaterial);
    band.position.set(0, -1.75, 0.1);
    this.group.add(band);

    // Add jewels (spheres) on each spike
    const jewelMaterialBlue = new THREE.MeshBasicMaterial({ color: 0x00bfff });
    const jewelMaterialRed = new THREE.MeshBasicMaterial({ color: 0xff4444 });
    const jewelRadius = 0.22;
    const spikeJewels = [
      [-3.2, 2.5],  // First spike jewel
      [-0.8, 2.5],  // Second spike jewel
      [0.8, 2.5],   // Third spike jewel
      [3.2, 2.5],   // Fourth spike jewel
    ];
    spikeJewels.forEach(([x, y], i) => {
      const jewelGeo = new THREE.SphereGeometry(jewelRadius, 16, 16);
      const mat = i % 2 === 0 ? jewelMaterialBlue : jewelMaterialRed;
      const jewel = new THREE.Mesh(jewelGeo, mat);
      jewel.position.set(x, y + 0.3, 0.3);
      this.mesh.add(jewel);
    });

    // Add jewels on the band (3 evenly spaced)
    const bandJewels = [
      [-2.0, -1.75],
      [0, -1.75],
      [2.0, -1.75],
    ];
    bandJewels.forEach(([x, y], i) => {
      const jewelGeo = new THREE.SphereGeometry(jewelRadius * 0.8, 16, 16);
      const mat = i % 2 === 0 ? jewelMaterialRed : jewelMaterialBlue;
      const jewel = new THREE.Mesh(jewelGeo, mat);
      jewel.position.set(x, y, 0.4);
      this.group.add(jewel);
    });
  }

  update(time, deltaTime) {
    // Add multiple animation effects when music is playing
    if (audioController.fdata) {
      const avg = audioController.fdata.reduce((a, b) => a + b, 0) / audioController.fdata.length;
      const intensity = avg / 255;
      
      // 1. Rotation effect - crown rotates based on music intensity
      this.mesh.rotation.y = Math.sin(performance.now() * 0.001) * 0.2 * intensity;
      
      // 2. Vertical bounce effect
      const bounce = Math.sin(performance.now() * 0.003) * 1.3 * intensity;
      this.group.position.y = bounce;
      
      // 3. Slight tilt based on beat
      this.mesh.rotation.z = Math.sin(performance.now() * 0.002) * 0.7 * intensity;
      
      // 4. Jewel animation - make jewels pulse with different timing
      this.mesh.children.forEach((jewel, i) => {
        if (jewel.isMesh) {
          const pulseScale = 1 + 0.3 * Math.sin(performance.now() * 0.004 + i * 0.5) * intensity;
          jewel.scale.set(pulseScale, pulseScale, pulseScale);
        }
      });
    }
    
    // Color pulsing effect (enhanced)
    const t = (Math.sin(performance.now() * 0.001) + 1) / 2;
    const blended = this.baseColor.clone().lerp(this.altColor, t);
    
    // Apply color to main crown and band
    this.material.color.copy(blended);
    
    // Create halo effect by adjusting emissive (if needed)
    if (this.material.emissive) {
      const emissiveIntensity = (Math.sin(performance.now() * 0.002) + 1) / 4;
      this.material.emissive.copy(blended).multiplyScalar(emissiveIntensity);
    }
  }
}

export default Crown; 