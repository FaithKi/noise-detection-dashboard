import express from "express";
import { InfluxDB } from "@influxdata/influxdb-client";
import dotenv from "dotenv";
import cors from "cors";

import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
app.use(
  cors({
    origin: ["http://localhost:5173"],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  }),
);

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

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
