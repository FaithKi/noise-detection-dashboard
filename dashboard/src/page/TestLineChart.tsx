import LineChart from "../components/LineChart";

const data = [
  { time: new Date("2026-02-20T10:00:00Z"), value: 10 },
  { time: new Date("2026-02-20T11:00:00Z"), value: 25 },
  { time: new Date("2026-02-20T12:00:00Z"), value: 18 },
  { time: new Date("2026-02-20T13:00:00Z"), value: 40 },
  { time: new Date("2026-02-20T14:00:00Z"), value: 32 },
];

export default function TestLineChart() {
	console.log("TestLineChart Mounted")
	return <LineChart data={data} />;
}
