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
	const [showNames, setShowNames] = useState(false);
	const [opacityScale, setOpacityScale] = useState(0.45);
	const canvasRef = useRef<HTMLCanvasElement | null>(null);
	const containerRef = useRef<HTMLDivElement | null>(null);

	useEffect(() => {
		let mounted = true;

		const load = async () => {
			try {
				const results = await Promise.all(
					devices.map(async (d) => {
						const raw = await fetchData(undefined, undefined, d.id);
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
	}, []);

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





			{/* Library image overlays using live data */}
			<div style={{ marginTop: 20 }}>
				<h3 style={{ marginBottom: 8 }}>Library Floor Maps</h3>
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
															<circle cx={d.x} cy={d.y} r={radius} fill="none" stroke="#e5e7eb" strokeWidth={1.2} strokeOpacity={0.9} />
														) : (
															<circle cx={d.x} cy={d.y} r={radius} fill={fill} fillOpacity={opacityScale} stroke="none" />
														)}
														{showNames && !offline ? (
															<g>
																<rect x={d.x - 14} y={d.y - 7} width={28} height={14} rx={6} fill="rgba(0,0,0,0.65)" />
																<text x={d.x} y={d.y} fontSize={8} textAnchor="middle" dominantBaseline="central" fill="#ffffff" fontWeight={700}>
																	{d.id}
																</text>
															</g>
														) : null}
														<title>{`${d.id}: ${(p * 100).toFixed(0)}% noisy (${count} samples)`}</title>
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
