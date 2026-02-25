import axios from "axios";

export const fetchData = async (start=undefined, stop=undefined, device=undefined) => {
  try {
  	const safeStart = start??"2026-02-24T09:00:00Z"
  	const safeStop = stop??"2026-02-24T10:00:00Z"
  	const safeDevice = device??"pi1"
    const response = await axios.post(
      "http://localhost:5050/getdata",
      { device:safeDevice, start:safeStart, stop:safeStop }
    );

	console.log("Fetch data successfully")
	console.log({ safeDevice, safeStart, safeStop })
    return response.data
  } catch (error) {
    console.error("Error:", error);
  }
}
