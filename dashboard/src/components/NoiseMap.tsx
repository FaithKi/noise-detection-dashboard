import { useEffect, useState } from "react";
import { fetchData } from "../utils.ts"

const getColor = () => {
	//TODO: Aggregate data and return color to tell whether the area is noisy or not	
}

const NoiseMap = () => {
	const [data, setData] = useState([]);
	useEffect(() => {
			const getData = () => {
				return fetchData();	
			};
			setData(getData());
		}
		, []);
	return (
		<div style={{ width: "100%", maxWidth: 600 }}>
		  <svg
		    viewBox="0 0 200 100"
		    style={{ width: "100%", height: "auto" }}
		  >
		    <rect x="0" y="0" width="200" height="100" fill="lightblue" />
		  </svg>
		</div>
	);
};

export default NoiseMap;
