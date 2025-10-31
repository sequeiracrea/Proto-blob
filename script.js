const modeSelector = document.getElementById("modeSelector");
const grid = document.querySelector(".horizontal-grid");

const sensorKeys = ["pm2_5", "pm10", "nh3", "no2", "humidity", "bmp_temp"];
const sensorColors = {
  pm2_5: "#FF4400",
  pm10: "#FF8800",
  nh3: "#FFDD00",
  no2: "#00FF80",
  humidity: "#FF00FF",
  bmp_temp: "#0080FF",
};

// Échelles normalisées
const sensorMin = { pm2_5: 0, pm10: 0, nh3: 0, no2: 0, humidity: 0, bmp_temp: 15 };
const sensorMax = { pm2_5: 50, pm10: 80, nh3: 2, no2: 2, humidity: 100, bmp_temp: 35 };

let currentMode = modeSelector.value;

modeSelector.addEventListener("change", () => {
  currentMode = modeSelector.value;
  if (currentMode === "B") {
    startHorizontalMode();
  } else {
    grid.innerHTML = "";
  }
});

function normalize(v, min, max) {
  return Math.max(0, Math.min(1, (v - min) / (max - min)));
}

function createTooltip(dataItem) {
  const tooltip = document.createElement("div");
  tooltip.classList.add("tooltip");
  tooltip.innerHTML = Object.entries(dataItem)
    .map(([k, v]) => `${k.toUpperCase()}: ${v}`)
    .join("<br>");
  return tooltip;
}

function createBlob(sensor, value, dataItem) {
  const blob = document.createElement("div");
  blob.classList.add("blob");
  blob.style.background = sensorColors[sensor];

  const norm = normalize(value, sensorMin[sensor], sensorMax[sensor]);
  const size = 20 + norm * 60; // diamètre variable
  blob.style.width = `${size}px`;
  blob.style.height = `${size}px`;
  blob.style.opacity = 0.6 + norm * 0.4;
  blob.style.filter = `blur(${4 + norm * 12}px)`;

  const tooltip = createTooltip(dataItem);
  blob.appendChild(tooltip);
  return blob;
}

function addDataColumn(dataItem) {
  const col = document.createElement("div");
  col.classList.add("data-column");

  sensorKeys.forEach((key) => {
    const val = dataItem[key] ?? 0;
    const blob = createBlob(key, val, dataItem);
    col.appendChild(blob);
  });

  grid.appendChild(col);
  grid.scrollLeft = grid.scrollWidth; // scroll auto vers la droite
}

async function fetchLatestData() {
  try {
    const response = await fetch("https://server-online-1.onrender.com/sensor");
    const data = await response.json();

    if (Array.isArray(data) && data.length > 0) {
      const lastItem = data[data.length - 1];
      addDataColumn(lastItem);
    }
  } catch (err) {
    console.error("Erreur fetch JSON:", err);
  }
}

function startHorizontalMode() {
  grid.innerHTML = "";
  fetchLatestData();
  setInterval(() => {
    if (currentMode === "B") fetchLatestData();
  }, 5000);
}

// Démarrage initial
if (currentMode === "B") startHorizontalMode();
