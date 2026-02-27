import ResponsiveChart from "../components/ResponsiveChart";
import QueryBuilder from "../components/QueryBuilder";
import { useEffect, useState } from "react";
import { fetchData } from "../utils.ts";

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
	useEffect(() => {
		const load = async () => {
			const formattedData = await getData();
			setData(formattedData);
		}
		load();
	}, [])
	return (
	<>
		<ResponsiveChart data={data} />
		<QueryBuilder
		  onSubmit={async ({ start, stop, device }) => {
		    // `start` and `stop` are ISO strings (UTC) from QueryBuilder; pass them directly.
		    const raw = await fetchData(start, stop, device);
		    
		    const formatted = raw.map((d: any) => ({
		      time: new Date(d.time),
		      value: d.value,
		    }));

		    setData(formatted);
		  }}
		/>
	</>
	);
}
