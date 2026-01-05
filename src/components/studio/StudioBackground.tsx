'use client';

import styles from './StudioBackground.module.css';

export default function StudioBackground() {
  return (
    <>
      <div className={styles.studioBackground}></div>
      <div className={styles.edgeLights} aria-hidden="true"></div>
      <div className={styles.noiseOverlay}></div>
    </>
  );
}

