// Simple demo sample data per device. Each array is a sequence of 0/1 readings.
const demoData: Record<string, number[]> = {
  pi1: [1,1,1,1,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1], // mostly noisy
  pi2: [0,0,1,0,0,1,0,0,0,0,1,0,0,0,0,0,0,0,1,0], // occasional
  pi3: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], // offline or always quiet
  pi4: [0,1,0,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1,0,0], // low activity
};

export default demoData;
