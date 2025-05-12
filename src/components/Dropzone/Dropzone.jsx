import s from "./Dropzone.module.scss";
import { useDropzone } from "react-dropzone";
import { useCallback, useState, useEffect } from "react";
import useStore from "../../utils/store";
import { fetchMetadata } from "../../utils/utils";

import Button from "../Button/Button";

const Dropzone = () => {
  const { tracks, setTracks } = useStore();
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  // Add listener for screen resize to detect mobile view
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const onDrop = useCallback(
    (acceptedFiles) => {
      // Créer un tableau temporaire
      const tracksArray = [];

      acceptedFiles.forEach((file, i) => {
        const path = URL.createObjectURL(file);

        //   // Créer un objet avec la structure similaire à celle de TRACKS dans TRACKS.js
        const _track = {
          name: file.name,
          path: path,
          id: tracks.length + i,
        };

        tracksArray.push(_track);
      });

      fetchMetadata(tracksArray, tracks, setTracks);
    },
    [tracks]
  );

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop: onDrop,
    noClick: true,
    accept: {
      "audio/mpeg": [],
      "audio/mp3": [],
      "audio/wav": [],
    },
  });

  return (
    <div
      {...getRootProps()}
      className={`
      ${s.dropzone} 
      ${isDragActive ? s.dropzone_active : ""}
      `}
    >
      <input {...getInputProps()} />

      {/* {isDragActive && (
        // l'utilisateur est en train de drag and drop, afficher la dropzone
        <div className={s.outer}>
          <div className={s.inner}>
            <p>Déposez vos fichiers dans cette zone</p>
          </div>
        </div>
      )} */}

      <div className={s.import}>
        <p className={s.desktopText}>Import your MP3 files</p>
        <p className={s.mobileText}>Import MP3</p>
        <Button label={"Browse"} onClick={open} />
      </div>
    </div>
  );
};

export default Dropzone;
