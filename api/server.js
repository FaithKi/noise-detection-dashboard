import express from "express";
import { InfluxDB } from "@influxdata/influxdb-client";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 5050;

// ---- InfluxDB config ----
const url = process.env.INFLUX_URL;
const token = process.env.INFLUX_TOKEN;
const org = process.env.INFLUX_ORG;
const bucket = process.env.INFLUX_BUCKET;

// Create client
const influxDB = new InfluxDB({ url, token });

// Simple health check route
app.get("/", async (req, res) => {
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
	return {value:rawData._value, time:rawData._time, device:rawData.device, field=rawData._field}
}

app.post("/getData", async (req, res) => {
	try {
		const {start, stop, device} = req.body;
		const queryApi = influxDB.getQueryApi(org);
		const fluxQuery = `
		 from(bucket: "${bucket}")
			|> range(start: ${start}, stop: ${stop})
			|> filter(fn: (r) => r["device"] == "${device}")
		    |> sort(columns: ["_time"], desc: true)
		  	`;
		const raw = await queryApi.collectRows(fluxQuery);
		res.status(200).json(formatData(raw));
	} catch (err) {
		console.log(err);
		res.status(500).send("Failed querying from InfluxDB ❌");
	}
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
