import { useEffect, useRef, useState } from "react";
import { fetchData } from "../utils.ts";
import devices from "../config/devices";

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
		<div style={{ width: "100%", maxWidth: 600 }} ref={containerRef}>
			<div style={{ position: "relative", width: "100%" }}>
				<canvas
					ref={canvasRef}
					style={{ display: "block", width: "100%", height: "auto", borderRadius: 6 }}
				/>

				<svg
					viewBox={`0 0 ${canvasW} ${canvasH}`}
					style={{ position: "absolute", left: 0, top: 0, width: "100%", height: "100%", pointerEvents: "none" }}
				>
					<rect x="0" y="0" width={canvasW} height={canvasH} fill="none" />

					{summaries.map((s) => {
						const pos = devices.find((d) => d.id === s.device);
						if (!pos) return null;
						const color = probToColor(s.p);
						const fill = `rgb(${color.r},${color.g},${color.b})`;
						const radius = 6 + Math.min(12, s.p * 20);
						return (
							<g key={s.device} pointerEvents="auto">
								<circle cx={pos.x} cy={pos.y} r={radius} fill={fill} stroke="#fff" strokeWidth={1} />
								<text x={pos.x} y={pos.y - radius - 4} fontSize={8} textAnchor="middle" fill="#111827">
									{s.device}
								</text>
								<title>{`${s.device}: ${(s.p * 100).toFixed(0)}% noisy (${s.count} samples)`}</title>
							</g>
						);
					})}
				</svg>
			</div>

			<div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 8 }}>
				<div style={{ width: 16, height: 12, background: "rgb(34,139,0)" }} />
				<div style={{ fontSize: 12 }}>Quiet</div>
				<div style={{ flex: 1 }} />
				<div style={{ fontSize: 12 }}>Noisy</div>
				<div style={{ width: 16, height: 12, background: "rgb(255,0,0)" }} />
			</div>
		</div>
	);
}
