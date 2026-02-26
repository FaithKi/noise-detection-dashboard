# Noise Detection Dashboard

This repository contains a small noise-detection project consisting of:

- an API server (`/api`) that queries InfluxDB for sensor samples;
- a React + Vite dashboard (`/dashboard`) that visualizes sensor data.

The dashboard is focused on showing where in a space (e.g. a library) noise threshold events occurred and which areas are safe for quiet study.

Key concepts
- Sensors report binary samples (0/1). A value of `1` indicates the sensor detected sound above its local threshold at that sample time.
- The dashboard computes a per-device duty cycle p = (# of 1s) / N over the selected time window. p is the fraction of time the sensor exceeded its threshold.
- The `NoiseMap` visualizes p as a continuous field using inverse-distance weighting (IDW) interpolation across the floor plan and renders a heatmap overlay plus device markers.

Demo vs production behavior
- `src/components/NoiseMap.tsx` — production-style map: fetches real data via `fetchData` and interpolates duty-cycle values into a canvas heatmap, overlaying SVG markers.
- `src/components/DemoNoiseMap.tsx` + `src/sample/sampleData.ts` — demo page that uses local sample arrays and shows an example heatmap. In the demo, a device with all-zero samples is currently shown as "offline" (hollow marker) so you can tell "no-data" apart from "quiet".

How the map encodes values
- Color: green (p≈0) → red (p≈1)
- Marker radius: grows with p so higher activity appears larger
- Heatmap opacity: increases with p so quiet areas are more transparent

Run the project locally
1. Start the API server (requires InfluxDB env vars in `api/.env`):

```bash
cd api
npm run dev
```

2. Start the dashboard frontend:

```bash
cd dashboard
npm run dev
```

3. Open the app (Vite will show the dev URL). Use the navbar to open the "Map Demo" page to see sample data without the backend.

Files to look at
- `dashboard/src/components/NoiseMap.tsx` — canvas IDW heatmap + SVG overlay (real-data map)
- `dashboard/src/components/DemoNoiseMap.tsx` — demo-only map that uses `dashboard/src/sample/sampleData.ts`
- `dashboard/src/config/devices.ts` — device coordinates used for map placement
- `dashboard/src/sample/sampleData.ts` — mock 0/1 sequences for demo
- `api/server.js` — backend route `/getdata` which returns InfluxDB rows

Notes and recommendations
- Because sensors are binary, converting p to a decibel value is not straightforward without calibration. The dashboard uses p as "probability of exceedance" which is suitable for indicating "safe" (low p) vs "noisy" (high p) areas.
- If sensors may be unpowered or otherwise not returning data, treat `count === 0` as offline and visually distinguish it from a quiet sensor (all-zero samples). The demo currently marks all-zero as offline; adjust `DemoNoiseMap`/`NoiseMap` if you want a different rule.
- To improve the map: add confidence weighting (ignore low-sample devices), contour extraction (`d3-contour`) for safe-zone polygons, and time-smoothing (EMA) to reduce sensitivity to short spikes.

If you want, I can:
- change the offline rule so all-zero = quiet instead of offline, or
- add a threshold slider + contour visualization, or
- wire real-time updates. Tell me which and I'll implement it.

