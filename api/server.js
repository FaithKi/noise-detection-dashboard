import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { InfluxDB } from "@influxdata/influxdb-client";
import dotenv from "dotenv";
import cors from "cors";

import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const httpServer = createServer(app);

const CORS_ORIGINS = ["http://localhost:5173"];

app.use(
  cors({
    origin: CORS_ORIGINS,
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  }),
);

const io = new Server(httpServer, {
  cors: {
    origin: CORS_ORIGINS,
    methods: ["GET", "POST"],
    credentials: true
  }
});

app.use(express.json());

const PORT = 5050;

// ---- InfluxDB config ----
const url = process.env.INFLUX_URL;
const token = process.env.INFLUX_TOKEN;
const org = process.env.INFLUX_ORG;
const bucket = process.env.INFLUX_BUCKET;

// Create client
const influxDB = new InfluxDB({ url, token });

// Simple health check route
app.get("/test", async (req, res) => {
  try {
    const queryApi = influxDB.getQueryApi(org);

    // Simple test query
    //     const fluxQuery = `
    //           from(bucket: "${bucket}")
    // 		    |> range(start: -2d)
    // 		    |> filter(fn: (r) => r["device"] == "pi1")
    // 		    |> sort(columns: ["_time"], desc: true)
    // 		    |> limit(n: 500)
    //         `;
    //
    //     const raw = await queryApi.collectRows(fluxQuery);
    // 	const values = raw.filter((d) => d._value==1)
    // 	console.log(values.length)
    res.send("Server running + InfluxDB connected ✅");
  } catch (err) {
    console.error(err);
    res.status(500).send("InfluxDB connection failed ❌");
  }
});

const formatData = (rawData) => {
  // rawData = {result,table,_start,_stop,_time,_value,_field,_measurement,device}
  const formattedData = rawData.map((d) => ({
    value: d._value,
    time: d._time,
    device: d.device,
    field: d._field,
  }));
  return formattedData;
};

app.post("/getdata", async (req, res) => {
  try {
    const defaultStart = "2026-02-24T09:00:00Z";
    const defaultStop = "2026-02-24T10:00:00Z";
    const defaultDevice = "pi1";
    const { start, stop, device } = req.body;
    const queryApi = influxDB.getQueryApi(org);
    const fluxQuery = `
		from(bucket: "${bucket}")
		|> range(start: ${start ?? defaultStart}, stop: ${stop ?? defaultStop})
		|> filter(fn: (r) => r["device"] == "${device ?? defaultDevice}")
		|> sort(columns: ["_time"], desc: true)
		`;
    console.log(`Query:\n${fluxQuery}`);
    const raw = await queryApi.collectRows(fluxQuery);
    res.status(200).json(formatData(raw));
  } catch (err) {
    console.log(err);
    res.status(500).send("Failed querying from InfluxDB ❌");
  }
});

const distPath = path.resolve(__dirname, "../dashboard/dist");

// 1️⃣ Serve static files
app.use(express.static(distPath));

// 2️⃣ Catch-all MUST come last
app.get("/{*any}", (req, res) => {
  res.sendFile(path.join(distPath, "index.html"));
});

// ---- Socket.IO real-time device status ----
const DEVICES = ["pi1", "pi2", "pi3", "pi4"];

const parsePeriodMs = (v) => {
	if (!v) return 10 * 60 * 1000;
	const n = Number(v.slice(0, -1));
	if (v.endsWith("m")) return n * 60 * 1000;
	if (v.endsWith("h")) return n * 60 * 60 * 1000;
	return 10 * 60 * 1000;
};

// A device is "online" only if its most recent data point is within this threshold
const ONLINE_THRESHOLD_MS = 10_000; // 10 seconds — matches the polling interval

const queryDeviceStatus = async (device, periodMs) => {
	try {
		const queryApi = influxDB.getQueryApi(org);
		const now = Date.now();
		const stop = new Date(now).toISOString();
		const start = new Date(now - periodMs).toISOString();
		const fluxQuery = `
			from(bucket: "${bucket}")
				|> range(start: ${start}, stop: ${stop})
				|> filter(fn: (r) => r["device"] == "${device}")
				|> sort(columns: ["_time"], desc: true)
		`;
		const raw = await queryApi.collectRows(fluxQuery);
		const formatted = raw.map((d) => Number(d._value)).filter((n) => n === 0 || n === 1);
		const count = formatted.length;
		const sum = formatted.reduce((a, b) => a + b, 0);
		const p = count > 0 ? sum / count : 0;

		// Determine online/offline by checking the most recent data timestamp
		let lastSeen = null;
		let online = false;
		if (raw.length > 0) {
			// raw is sorted desc by _time, so first element is the most recent
			lastSeen = raw[0]._time;
			const lastSeenMs = new Date(lastSeen).getTime();
			online = (now - lastSeenMs) <= ONLINE_THRESHOLD_MS;
		}

		return { device, p, count, online, lastSeen };
	} catch (err) {
		console.error(`Socket query error for ${device}:`, err.message);
		return { device, p: 0, count: 0, online: false, lastSeen: null };
	}
};

const queryAllDevices = async (periodMs) => {
	return Promise.all(DEVICES.map((d) => queryDeviceStatus(d, periodMs)));
};

io.on("connection", (socket) => {
	console.log(`[Socket.IO] Client connected: ${socket.id}`);
	let intervalId = null;
	let currentPeriod = "10m";

	const startPolling = (period) => {
		if (intervalId) clearInterval(intervalId);
		currentPeriod = period || "10m";
		const periodMs = parsePeriodMs(currentPeriod);

		// Send immediately on subscribe
		queryAllDevices(periodMs).then((statuses) => {
			socket.emit("device-status", { period: currentPeriod, devices: statuses, timestamp: new Date().toISOString() });
		});

		// Then poll every 10 seconds
		intervalId = setInterval(async () => {
			const statuses = await queryAllDevices(periodMs);
			socket.emit("device-status", { period: currentPeriod, devices: statuses, timestamp: new Date().toISOString() });
		}, 10_000);
	};

	// Client sends "subscribe" with { period: "5m" | "10m" | "30m" | "1h" | ... }
	socket.on("subscribe", (data) => {
		console.log(`[Socket.IO] ${socket.id} subscribed with period: ${data?.period}`);
		startPolling(data?.period);
	});

	// Client can change period without reconnecting
	socket.on("change-period", (data) => {
		console.log(`[Socket.IO] ${socket.id} changed period to: ${data?.period}`);
		startPolling(data?.period);
	});

	socket.on("disconnect", () => {
		console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
		if (intervalId) clearInterval(intervalId);
	});
});

// Start server
httpServer.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
