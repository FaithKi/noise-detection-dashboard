import { useEffect, useRef, useState } from "react";
import { fetchData } from "../utils.ts";
import devices from "../config/devices";
import { probToColor, interpolateIDW, CANVAS_W, CANVAS_H } from "./shared/mapUtils";
import FloorMapOverlay from "./shared/FloorMapOverlay";
import OfflineLegend from "./shared/OfflineLegend";
import NoiseLegend from "./shared/NoiseLegend";
import PeriodSelector from "./shared/PeriodSelector";
import MapControls from "./shared/MapControls";

type DeviceSummary = {
	device: string;
	p: number; // duty cycle (0..1)
	count: number;
};

export default function NoiseMap() {
	const [summaries, setSummaries] = useState<DeviceSummary[]>([]);
	const [period, setPeriod] = useState<string>("10m");
	const [mode, setMode] = useState<"recent" | "custom">("recent");
	const nowLocal = new Date();
	const formatLocalInput = (d: Date) => {
		const pad = (n: number) => String(n).padStart(2, "0");
		return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(
			d.getMinutes()
		)}`;
	};
	const defaultStopLocal = formatLocalInput(nowLocal);
	const defaultStartLocal = formatLocalInput(new Date(Date.now() - 10 * 60 * 1000));
	const [startLocal, setStartLocal] = useState<string>(defaultStartLocal);
	const [stopLocal, setStopLocal] = useState<string>(defaultStopLocal);
	const [rangeVersion, setRangeVersion] = useState(0);
	const [showNames, setShowNames] = useState(false);
	const [opacityScale, setOpacityScale] = useState(0.45);
	const canvasRef = useRef<HTMLCanvasElement | null>(null);
	const containerRef = useRef<HTMLDivElement | null>(null);

	const parsePeriodMs = (v: string) => {
		if (!v) return 10 * 60 * 1000;
		const n = Number(v.slice(0, -1));
		if (v.endsWith("m")) return n * 60 * 1000;
		if (v.endsWith("h")) return n * 60 * 60 * 1000;
		return 10 * 60 * 1000;
	};

	useEffect(() => {
		let mounted = true;
		const load = async () => {
			try {
				let start: string;
				let stop: string;
				if (mode === "recent") {
					const ms = parsePeriodMs(period);
					stop = new Date().toISOString();
					start = new Date(Date.now() - ms).toISOString();
				} else {
					// custom range: convert local inputs to ISO
					start = new Date(startLocal).toISOString();
					stop = new Date(stopLocal).toISOString();
				}

				const results = await Promise.all(
					devices.map(async (d) => {
						const raw = await fetchData(start, stop, d.id);
						const arr = Array.isArray(raw) ? raw : [];
						const nums = arr.map((p: any) => Number(p.value)).filter((n) => n === 0 || n === 1);
						const sum = nums.reduce((a, b) => a + b, 0);
						const p = nums.length ? sum / nums.length : 0;
						return { device: d.id, p, count: nums.length } as DeviceSummary;
					})
				);

				if (mounted) setSummaries(results);
			} catch (err) {
				console.error("NoiseMap load error", err);
			}
		};

		load();
		return () => {
			mounted = false;
		};
	}, [period, mode, rangeVersion]);

	// draw heatmap when summaries change
	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const dpr = window.devicePixelRatio || 1;
		canvas.width = CANVAS_W * dpr;
		canvas.height = CANVAS_H * dpr;
		canvas.style.width = `${CANVAS_W}px`;
		canvas.style.height = `${CANVAS_H}px`;
		const ctx = canvas.getContext("2d");
		if (!ctx) return;
		ctx.clearRect(0, 0, canvas.width, canvas.height);

		const points = summaries
			.map((s) => {
				const cfg = devices.find((dd) => dd.id === s.device)!;
				return { x: cfg.x, y: cfg.y, v: s.p };
			})
			.filter(Boolean);

		if (points.length === 0) return;

		const img = ctx.createImageData(canvas.width, canvas.height);
		// iterate logical pixels (canvas coords scaled by dpr)
		for (let py = 0; py < canvas.height; py++) {
			for (let px = 0; px < canvas.width; px++) {
				// map back to viewBox coords (0..200, 0..100)
				const vx = (px / (canvas.width - 1)) * (CANVAS_W - 1);
				const vy = (py / (canvas.height - 1)) * (CANVAS_H - 1);
				const val = interpolateIDW(vx, vy, points, 2);
				const { r, g, b } = probToColor(val);
				const alpha = Math.round(180 * val); // more opaque for higher prob
				const idx = (py * canvas.width + px) * 4;
				img.data[idx] = r;
				img.data[idx + 1] = g;
				img.data[idx + 2] = b;
				img.data[idx + 3] = alpha;
			}
		}

		ctx.putImageData(img, 0, 0);
		// scale canvas to fit container width
		if (containerRef.current) {
			const rect = containerRef.current.getBoundingClientRect();
			canvas.style.width = `${rect.width}px`;
			canvas.style.height = `${(rect.width * CANVAS_H) / CANVAS_W}px`;
		}
	}, [summaries]);

	return (
		<div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "72vh", padding: 24 }}>
			<div style={{ width: "100%", maxWidth: 640 }} ref={containerRef}>
			{/* controls + legend */}
			<div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", gap: 12, marginBottom: 12 }}>
					<NoiseLegend />

					<div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
						<div style={{ display: "flex", gap: 12, alignItems: "center" }}>
							<PeriodSelector period={period} onChange={setPeriod} />

							<label style={{ color: "#e6eef8", fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
								<input type="radio" name="rangeMode" value="recent" checked={mode === "recent"} onChange={() => setMode("recent")} />
								Recent
							</label>
							<label style={{ color: "#e6eef8", fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
								<input type="radio" name="rangeMode" value="custom" checked={mode === "custom"} onChange={() => setMode("custom")} />
								Custom
							</label>
						</div>

						{mode === "custom" ? (
							<div style={{ display: "flex", gap: 8, alignItems: "center" }}>
								<input 
									type="datetime-local"
									value={startLocal}
									onChange={(e) => {
										const v = e.target.value;
										setStartLocal(v);
										if (v > stopLocal) setStopLocal(v);
									}}
								/>
								<input
									type="datetime-local"
									value={stopLocal}
									onChange={(e) => setStopLocal(e.target.value)}
									min={startLocal}
								/>
								<button onClick={() => setRangeVersion((v) => v + 1)} style={{ padding: "6px 10px", borderRadius: 6 }}>
									Apply
								</button>
							</div>
						) : null}
					</div>

				<MapControls
					opacityScale={opacityScale}
					onOpacityChange={setOpacityScale}
					showNames={showNames}
					onShowNamesChange={setShowNames}
				/>
			</div>

			{/* Offline legend */}
			<OfflineLegend />





			{/* Library image overlays using live data */}
			<div style={{ marginTop: 20 }}>
				{/* current range summary */}

				<h3 style={{ marginBottom: 8 }}>Library Floor Maps</h3>				
				{mode === "recent" ? (
					<div style={{ color: "#cfe8ff", fontSize: 13, marginBottom: 6 }}>Showing: Last {period}</div>
				) : (
					<div
						style={{ color: "#cfe8ff", fontSize: 13, marginBottom: 6 }}
						title={`UTC: ${new Date(startLocal).toISOString()} → ${new Date(stopLocal).toISOString()}`}>
						Showing: {new Date(startLocal).toLocaleString()} → {new Date(stopLocal).toLocaleString()}
					</div>
				)}
				<FloorMapOverlay
					summaries={summaries.map((s) => ({ ...s, online: s.count > 0 }))}
					showNames={showNames}
					opacityScale={opacityScale}
				/>
				</div>
			</div>
			</div>
		
	);
}
