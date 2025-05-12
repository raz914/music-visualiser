import s from "./Canvas.module.scss";
import scene from "../../webgl/Scene";
import { useEffect, useRef, useState } from "react";
import Loading from "../Loading/Loading";

const Canvas = () => {
  const canvasRef = useRef();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Initialize scene but don't show any visualizer yet
    scene.setupInitial(canvasRef.current);
    
    // The Loading component will handle completion
  }, []);

  const handleLoadingComplete = () => {
    console.log("Loading complete, initializing visualizer");
    // Once loading animation is complete, initialize the visualizer
    scene.completeSetup();
    setIsLoading(false);
  };

  return (
    <>
      <canvas ref={canvasRef} className={s.canvas}></canvas>
      {isLoading && <Loading onComplete={handleLoadingComplete} />}
    </>
  );
};

export default Canvas;
