// Map images to a small set of devices and their initial positions (viewBox coords 0..200,0..100)
const imageDevices = [
  {
    image: "library3rdFloor.jpg",
    label: "3rd Floor",
    devices: [
      { id: "pi1", x: 80, y: 50 },
      { id: "pi2", x: 190, y: 85 },
    ],
  },
  {
    image: "library4thFloor.jpg",
    label: "4th Floor",
    devices: [
      { id: "pi3", x: 60, y: 50 },
      { id: "pi4", x: 180, y: 60 },
    ],
  },
];

export default imageDevices;
