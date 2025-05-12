import { useState, useEffect } from "react";
import scene from "../../webgl/Scene";
import s from "./Picker.module.scss";
import useStore from "../../utils/store";

const VISUALIZERS = [
  {
    name: "Line",
    index: 0,
    icon: "┃"
  },
  {
    name: "Board",
    index: 1,
    icon: "▢"
  },
  {
    name: "Logo Iut",
    index: 2,
    icon: "◈"
  },
  {
    name: "Cover",
    index: 3,
    icon: "◉"
  },
  {
    name: "Heart",
    index: 4,
    icon: "♥"
  },
  {
    name: "Star",
    index: 5,
    icon: "★"
  },
  {
    name: "Crown",
    index: 6,
    icon: "♔"
  },
];

const Picker = () => {
  // Get saved visualizer from store
  const savedVisualizer = useStore(state => state.currentVisualizer);
  const setCurrentVisualizer = useStore(state => state.setCurrentVisualizer);
  
  // Initialize with saved visualizer or default to index 0 (Line)
  const [current, setCurrent] = useState(savedVisualizer !== null ? savedVisualizer : 0);
  const [isChanging, setIsChanging] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  // Set initial visualizer on component mount
  useEffect(() => {
    if (savedVisualizer !== null && savedVisualizer !== current) {
      // Update the local state with the saved visualizer
      setCurrent(savedVisualizer);
      
      // Apply the visualizer to the scene
      scene.pickVisualizer(savedVisualizer);
    }
  }, [savedVisualizer, current]);

  const pickVisualizer = (index) => {
    if (index === current) return;
    
    // Add transition effect
    setIsChanging(true);
    
    // Short delay before actually changing the visualizer
    setTimeout(() => {
      // changer visuellement la liste
      setCurrent(index);

      // Save to store for persistence
      setCurrentVisualizer(index);

      // appeler la méthode qui permet de changer d'objet 3D
      scene.pickVisualizer(index);
      
      // Reset the changing state after a delay
      setTimeout(() => {
        setIsChanging(false);
        // Close dropdown on mobile after selection
        setIsOpen(false);
      }, 300);
    }, 100);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isOpen && !event.target.closest(`.${s.picker}`)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const currentVisualizer = VISUALIZERS.find(v => v.index === current);

  return (
    <div className={`${s.picker} ${isChanging ? s.changing : ''} ${isOpen ? s.open : ''}`}>
      <div className={s.header} onClick={() => setIsOpen(!isOpen)}>
        <div className={s.title}>
          <span className={s.titleText}>Visualizers</span>
          <span className={s.currentVisualizer}>
            <span className={s.icon}>{currentVisualizer.icon}</span>
            <span className={s.name}>{currentVisualizer.name}</span>
          </span>
          <span className={s.dropdownArrow}>▼</span>
        </div>
      </div>
      <div className={s.visualizerList}>
        {VISUALIZERS.map((visualizer) => (
          <span
            key={visualizer.name}
            className={`${current === visualizer.index ? s.current : ""}`}
            onClick={() => pickVisualizer(visualizer.index)}
          >
            <span className={s.icon}>{visualizer.icon}</span>
            <span className={s.name}>{visualizer.name}</span>
          </span>
        ))}
      </div>
    </div>
  );
};

export default Picker;
