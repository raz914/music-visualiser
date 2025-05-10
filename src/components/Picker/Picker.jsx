import { useState, useEffect } from "react";
import scene from "../../webgl/Scene";
import s from "./Picker.module.scss";

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
  const [current, setCurrent] = useState(0);
  const [isChanging, setIsChanging] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const pickVisualizer = (index) => {
    if (index === current) return;
    
    // Add transition effect
    setIsChanging(true);
    
    // Short delay before actually changing the visualizer
    setTimeout(() => {
      // changer visuellement la liste
      setCurrent(index);

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
