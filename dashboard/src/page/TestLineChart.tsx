import ResponsiveChart from "../components/ResponsiveChart";
import QueryBuilder from "../components/QueryBuilder";
import { useEffect, useState } from "react";
import { fetchData } from "../utils.ts";
import devices from "../config/devices";

type DataPoint = {
  time: Date;
  value: number;
};

const getData = async () => {
	const raw = await fetchData();
	const formattedData = raw.map((d) => ({time: new Date(d.time), value:d.value}));
	return formattedData;
}

export default function TestLineChart() {
	const [data, setData] = useState<DataPoint[]>([]);
	const [series, setSeries] = useState<{ id: string; data: DataPoint[] }[] | null>(null);
	useEffect(() => {
		const load = async () => {
			const formattedData = await getData();
			setData(formattedData);
		}
		load();
	}, [])
	return (
	<>
		<ResponsiveChart data={data} series={series ?? undefined} />
		<QueryBuilder
					onSubmit={async ({ start, stop, device }) => {
						if (device === "all") {
							// fetch each device series in parallel
							const results = await Promise.all(
								devices.map(async (d) => {
									const raw = await fetchData(start, stop, d.id);
									const formatted = (Array.isArray(raw) ? raw : []).map((r: any) => ({ time: new Date(r.time), value: r.value }));
									return { id: d.id, data: formatted };
								})
							);
							setSeries(results);
							setData([]);
						} else {
							const raw = await fetchData(start, stop, device);
							const formatted = raw.map((d: any) => ({
								time: new Date(d.time),
								value: d.value,
							}));
							setSeries(null);
							setData(formatted);
						}
					}}
		/>
	</>
	);
}
