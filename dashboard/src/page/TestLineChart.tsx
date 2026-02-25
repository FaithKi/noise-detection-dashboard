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
			const startTime = new Date(start);
			const thaiStartTime = new Date(startTime.getTime() - 7 * 60 * 60 * 1000); // minus 7 hrs (Thai to UTC)
			const stopTime = new Date(stop);
			const thaiStopTime = new Date(stopTime.getTime() - 7 * 60 * 60 * 1000); // minus 7 hrs (Thai to UTC)

			// console.log(offsetDate.toISOString());
		    const raw = await fetchData(thaiStartTime, thaiStopTime, device);
		    
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
