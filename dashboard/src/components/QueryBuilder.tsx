import { useState } from "react";
import styles from "./QueryBuilder.module.css";

type QueryParams = {
  start: string;
  stop: string;
  device: string;
};

type QueryBuilderProps = {
  onSubmit: (params: QueryParams) => void;
};

export default function QueryBuilder({ onSubmit }: QueryBuilderProps) {
  const [start, setStart] = useState("2026-02-24T16:00");
  const [stop, setStop] = useState("2026-02-24T17:00");
  const [device, setDevice] = useState("pi1");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    onSubmit({
      start: new Date(start).toISOString(),
      stop: new Date(stop).toISOString(),
      device,
    });
  };

  return (
    <form className={styles.container} onSubmit={handleSubmit}>
      <div className={styles.field}>
        <label>Start</label>
        <input
          type="datetime-local"
          value={start}
          onChange={(e) => setStart(e.target.value)}
        />
      </div>

      <div className={styles.field}>
        <label>Stop</label>
        <input
          type="datetime-local"
          value={stop}
          onChange={(e) => setStop(e.target.value)}
        />
      </div>

      <div className={styles.field}>
        <label>Device</label>
        <select
          value={device}
          onChange={(e) => setDevice(e.target.value)}
        >
          <option value="pi1">pi1</option>
          <option value="pi2">pi2</option>
          <option value="pi3">pi3</option>
          <option value="pi4">pi4</option>
          <option value="all">All devices</option>
        </select>
      </div>

      <button className={styles.button} type="submit">
        Run Query
      </button>
    </form>
  );
}
