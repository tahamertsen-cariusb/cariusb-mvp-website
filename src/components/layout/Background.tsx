import styles from './Background.module.css';

export function Background() {
  return (
    <>
      <div className={styles.pageBackground} />
      <div className={styles.noiseOverlay} />
    </>
  );
}

