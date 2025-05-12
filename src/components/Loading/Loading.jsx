import { useState, useEffect } from 'react';
import styles from './Loading.module.scss';

const Loading = ({ duration = 1500, onComplete }) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      if (onComplete) onComplete();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onComplete]);

  return visible ? (
    <div className={styles.loadingOverlay}>
      <div className={styles.loadingContent}>
        <div className={styles.loadingIcon}>
          <span>┃</span>
          <span>▢</span>
          <span>◈</span>
          <span>◉</span>
          <span>★</span>
        </div>
        <div className={styles.loadingText}>Loading Visualizer</div>
      </div>
    </div>
  ) : null;
};

export default Loading; 