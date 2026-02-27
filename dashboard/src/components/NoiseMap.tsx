import { useEffect, useRef, useState } from "react";
import { fetchData } from "../utils.ts";
import devices from "../config/devices";
import imageDevices from "../config/imageDevices";
import lib3 from "../assets/library3rdFloor.jpg";
import lib4 from "../assets/library4thFloor.jpg";

type DeviceSummary = {
	device: string;
	p: number; // duty cycle (0..1)
	count: number;
};

const canvasW = 200;
const canvasH = 100;

const probToColor = (p: number) => {
	// p in [0,1] -> green(0) to red(1)
	const r = Math.round(34 + (255 - 34) * p);
	const g = Math.round(139 - 139 * p);
	const b = 0;
	return { r, g, b };
};

// IDW interpolation
const interpolateIDW = (
	x: number,
	y: number,
	points: { x: number; y: number; v: number }[],
	power = 2,
	eps = 1e-6
) => {
	let nom = 0;
	let denom = 0;
	for (const p of points) {
		const dx = x - p.x;
		const dy = y - p.y;
		const d2 = dx * dx + dy * dy + eps;
		const w = 1 / Math.pow(Math.sqrt(d2), power);
		nom += w * p.v;
		denom += w;
	}
	return denom ? nom / denom : 0;
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
		canvas.width = canvasW * dpr;
		canvas.height = canvasH * dpr;
		canvas.style.width = `${canvasW}px`;
		canvas.style.height = `${canvasH}px`;
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
				const vx = (px / (canvas.width - 1)) * (canvasW - 1);
				const vy = (py / (canvas.height - 1)) * (canvasH - 1);
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
			canvas.style.height = `${(rect.width * canvasH) / canvasW}px`;
		}
	}, [summaries]);

	return (
		<div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "72vh", padding: 24 }}>
			<div style={{ width: "100%", maxWidth: 640 }} ref={containerRef}>
			{/* controls + legend */}
			<div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", gap: 12, marginBottom: 12 }}>
					<div style={{ display: "flex", gap: 8 }}>
						<div style={{ color: "#e6eef8", fontSize: 13 }}>Quiet</div>
						<div style={{ width: 220, height: 12, borderRadius: 6, background: "linear-gradient(90deg, rgb(34,139,0), rgb(255,165,0), rgb(255,0,0))" }} />
						<div style={{ color: "#e6eef8", fontSize: 13 }}>Noisy</div>
					</div>

					<div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
						<div style={{ display: "flex", gap: 12, alignItems: "center" }}>
							<label style={{ color: "#e6eef8", fontSize: 13, display: "flex", alignItems: "center", gap: 8 }}>
								Period
								<select value={period} onChange={(e) => setPeriod(e.target.value)} style={{ marginLeft: 8 }}>
									<option value="5m">5 minutes</option>
									<option value="10m">10 minutes</option>
									<option value="30m">30 minutes</option>
									<option value="1h">1 hour</option>
									<option value="6h">6 hours</option>
									<option value="24h">24 hours</option>
								</select>
							</label>

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

				<div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
					<label style={{ color: "#e6eef8", fontSize: 13, display: "flex", alignItems: "center", gap: 8 }}>
						Opacity
						<input
							type="range"
							min={0}
							max={1}
							step={0.05}
							value={opacityScale}
							onChange={(e) => setOpacityScale(Number(e.target.value))}
						/>
						<span style={{ minWidth: 36, textAlign: "right" }}>{Math.round(opacityScale * 100)}%</span>
					</label>
					<label style={{ color: "#e6eef8", fontSize: 13, display: "flex", alignItems: "center", gap: 8 }}>
						<input type="checkbox" style={{ marginRight: 4 }} checked={showNames} onChange={(e) => setShowNames(e.target.checked)} />
						Show device name
					</label>
				</div>
			</div>

			{/* Offline legend */}
			<div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8, padding: "6px 8px", borderRadius: 8 }}>
				<svg width={24} height={24} viewBox="0 0 24 24" aria-hidden="true" style={{ display: "block" }}>
					{/* dashed ring */}
					<circle cx={12} cy={12} r={7} fill="none" stroke="rgba(255,99,71,0.95)" strokeWidth={2} strokeDasharray="4 2" />
					{/* center dot */}
					<circle cx={12} cy={12} r={2} fill="rgba(255,99,71,0.95)" />
					{/* cross */}
					<line x1={8} y1={8} x2={16} y2={16} stroke="rgba(255,99,71,0.95)" strokeWidth={1.2} strokeLinecap="round" />
					<line x1={8} y1={16} x2={16} y2={8} stroke="rgba(255,99,71,0.95)" strokeWidth={1.2} strokeLinecap="round" />
				</svg>
				<div style={{ color: "#e6eef8", fontSize: 13 }}>Offline — no samples</div>
			</div>





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
				<div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 12 }}>
					{imageDevices.map((imgCfg, idx) => {
						const imgSrc = imgCfg.image.includes("3rd") ? lib3 : lib4;
						return (
							<div key={imgCfg.image} className="image-card">
								<div className="image-inner">
									<div style={{ position: "relative", width: "100%" }}>
										<img src={imgSrc} alt={imgCfg.image} style={{ display: "block", width: "100%", height: "auto" }} />

										<svg viewBox={`0 0 ${canvasW} ${canvasH}`} style={{ position: "absolute", left: 0, top: 0, width: "100%", height: "100%", pointerEvents: "none" }}>
											{imgCfg.devices.map((d) => {
												const s = summaries.find((x) => x.device === d.id) ?? { device: d.id, p: 0, count: 0 };
												const p = s.p;
												const count = s.count;
												const offline = count === 0;
												const color = probToColor(p);
												const fill = `rgb(${color.r},${color.g},0)`;
												const radius = 6 + Math.min(12, p * 20);
												return (
													<g key={d.id}>
														{offline ? (
															<g>
																<circle cx={d.x} cy={d.y} r={radius + 3} fill="none" stroke="rgba(255,99,71,0.95)" strokeWidth={2} strokeDasharray="4 2" />
																<circle cx={d.x} cy={d.y} r={Math.max(2, Math.round(radius / 3))} fill="rgba(255,99,71,0.95)" />
																<line x1={d.x - radius / 2} y1={d.y - radius / 2} x2={d.x + radius / 2} y2={d.y + radius / 2} stroke="rgba(255,99,71,0.95)" strokeWidth={1.2} strokeLinecap="round" />
																<line x1={d.x - radius / 2} y1={d.y + radius / 2} x2={d.x + radius / 2} y2={d.y - radius / 2} stroke="rgba(255,99,71,0.95)" strokeWidth={1.2} strokeLinecap="round" />
															</g>
														) : (
															<circle cx={d.x} cy={d.y} r={radius} fill={fill} fillOpacity={opacityScale} stroke="none" />
														)}
														{showNames ? (
															<g>
																<rect
																	x={d.x - (offline ? 30 : 20)}
																	y={d.y - 9}
																	width={offline ? 60 : 40}
																	height={16}
																	rx={6}
																	fill={ "rgba(0,0,0,0.65)"}
																/>
																<text x={d.x} y={d.y} fontSize={8} textAnchor="middle" dominantBaseline="central" fill={offline ? "#e5e7eb" : "#ffffff"} fontWeight={700}>
																	{d.id}{offline ? " (offline)" : ""}
																</text>
															</g>
														) : null}
														<title>{`${d.id}: ${(p * 100).toFixed(0)}% noisy (${count} samples)${offline ? " — offline (no samples)" : ""}`}</title>
													</g>
												);
												})}
										</svg>
									</div>

									{imgCfg.label && <div className="image-label-below">{imgCfg.label}</div>}
								</div>
							</div>
						);
						})}
					</div>
				</div>
			</div>
			</div>
		
	);
}
