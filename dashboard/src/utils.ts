import axios from "axios";

export const getLocalDateTime = (addHours = 0) => {
  const now = new Date();
  now.setHours(now.getHours() + addHours);

  const offset = now.getTimezoneOffset();
  const local = new Date(now.getTime() - offset * 60 * 1000);
  return local.toISOString().slice(0, 16);
};

export const fetchData = async (
  start = undefined,
  stop = undefined,
  device = undefined,
) => {
  try {
    const safeStart = start ?? getLocalDateTime(-1);
    const safeStop = stop ?? getLocalDateTime(0);
    const safeDevice = device ?? "pi1";
    const response = await axios.post("http://localhost:5050/getdata", {
      device: safeDevice,
      start: safeStart,
      stop: safeStop,
    });

    console.log("Fetch data successfully");
    console.log({ safeDevice, safeStart, safeStop });
    return response.data;
  } catch (error) {
    console.error("Error:", error);
  }
};
