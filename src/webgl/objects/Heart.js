import * as THREE from "three";
import audioController from "../../utils/AudioController";

class Heart {
  constructor() {
    this.group = new THREE.Group();
    this.createHeart();
    this.baseColor = new THREE.Color(0xff4f8b); // Pink
    this.altColor = new THREE.Color(0xFF00FF ); // Yellow
  }

  createHeart() {
    // Classic parametric heart shape
    const heartShape = new THREE.Shape();
    heartShape.moveTo(0, 0);
    heartShape.bezierCurveTo(0, 0, 0, 2.5, 2, 2.5);
    heartShape.bezierCurveTo(4, 2.5, 4, 0, 4, 0);
    heartShape.bezierCurveTo(4, -3, 0, -3.5, 0, -6);
    heartShape.bezierCurveTo(0, -3.5, -4, -3, -4, 0);
    heartShape.bezierCurveTo(-4, 0, -4, 2.5, -2, 2.5);
    heartShape.bezierCurveTo(0, 2.5, 0, 0, 0, 0);

    // Extrude settings (flat by default)
    const extrudeSettings = {
      steps: 1,
      depth: 0.5,
      bevelEnabled: true,
      bevelThickness: 0.15,
      bevelSize: 0.15,
      bevelSegments: 2,
    };

    // MeshBasicMaterial for flat, always-glowing look
    this.material = new THREE.MeshBasicMaterial({
      color: 0xff4f8b, // pink
    });

    // Geometry and mesh
    this.geometry = new THREE.ExtrudeGeometry(heartShape, extrudeSettings);
    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;
    this.mesh.position.set(0, 0, 0);
    this.mesh.scale.set(1.2, 1.2, 0.7); // Make the heart smaller
    this.group.add(this.mesh);
  }

  update(time, deltaTime) {
    // Animate scale (pulse) with the beat
    if (audioController.fdata) {
      const avg = audioController.fdata.reduce((a, b) => a + b, 0) / audioController.fdata.length;
      // Pulse between 1 and 1.25 scale
      const scale = 1 + 0.25 * (avg / 255);
      this.mesh.scale.set(1.2 * scale, 1.2 * scale, 0.7 + 0.3 * (avg / 255));
    }
    // Alternate color effect (blend between pink and yellow)
    const t = (Math.sin(performance.now() * 0.001) + 1) / 2;
    const blended = this.baseColor.clone().lerp(this.altColor, t);
    this.material.color.copy(blended);
  }
}

export default Heart; 