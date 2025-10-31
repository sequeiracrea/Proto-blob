const modeSelector = document.getElementById("modeSelector");
const gridA = document.getElementById("modeA");
const containerB = document.getElementById("modeB");
const timeline = document.querySelector(".timeline");
const layerC = document.getElementById("modeC");

const sensorKeys = ["pm2_5", "pm10", "nh3", "no2", "humidity", "bmp_temp"];
const sensorColors = {
  pm2_5: "#FF4400",
  pm10: "#FF8800",
  nh3: "#FFDD00",
  no2: "#00FF80",
  humidity: "#FF00FF",
  bmp_temp: "#0080FF",
};
const sensorMin = { pm2_5: 0, pm10: 0, nh3: 0, no2: 0, humidity: 0, bmp_temp: 15 };
const sensorMax = { pm2_5: 50, pm10: 80, nh3: 2, no2: 2, humidity: 100, bmp_temp: 35 };

let currentMode = modeSelector.value;
let intervalId;

modeSelector.addEventListener("change", () => {
  clearInterval(intervalId);
  currentMode = modeSelector.value;
  switchMode(currentMode);
});

function switchMode(mode) {
  gridA.style.display = "none";
  containerB.style.display = "none";
  layerC.style.display = "none";

  if (mode === "A") {
    gridA.style.display = "grid";
    startModeA();
  }
  if (mode === "B") {
    containerB.style.display = "flex";
    startModeB();
  }
  if (mode === "C") {
    layerC.style.display = "flex";
    layerC.textContent = "Mode C – Fusion pondérée (à venir)";
  }
}

// --- UTILITAIRES ---
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

function createBlob(sensor, value, dataItem, inline = false) {
  const blob = document.createElement("div");
  blob.classList.add("blob");
  blob.style.background = sensorColors[sensor];
  const norm = normalize(value, sensorMin[sensor], sensorMax[sensor]);
  const size = inline ? 16 + norm * 50 : 30 + norm * 80;
  blob.style.width = `${size}px`;
  blob.style.height = `${size}px`;
  blob.style.opacity = 0.5 + norm * 0.5;
  blob.style.filter = `blur(${4 + norm * 14}px)`;
  const tooltip = createTooltip(dataItem);
  blob.appendChild(tooltip);
  return blob;
}

// --- MODE A ---
function startModeA() {
  gridA.innerHTML = "";
  const rows = 12, cols = 12;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cell = document.createElement("div");
      cell.classList.add("cell");
      const blob = document.createElement("div");
      blob.classList.add("blob");
      blob.style.background = "#00FF80";
      blob.style.width = "100%";
      blob.style.height = "100%";
      cell.appendChild(blob);
      gridA.appendChild(cell);
    }
  }
}

// --- MODE B ---
function setupTimelineRows() {
  timeline.innerHTML = "";
  sensorKeys.forEach(() => {
    const row = document.createElement("div");
    row.classList.add("timeline-row");
    timeline.appendChild(row);
  });
}

function addTimelineCluster(dataItem) {
  const rows = timeline.querySelectorAll(".timeline-row");
  sensorKeys.forEach((key, i) => {
    const val = dataItem[key] ?? 0;
    const blob = createBlob(key, val, dataItem, true);
    rows[i].appendChild(blob);
  });
  containerB.scrollLeft = containerB.scrollWidth;
}

async function fetchLatestDataB() {
  try {
    const res = await fetch("https://server-online-1.onrender.com/sensor");
    const data = await res.json();
    if (Array.isArray(data) && data.length > 0) {
      const last = data[data.length - 1];
      addTimelineCluster(last);
    }
  } catch (err) {
    console.error("Erreur fetch JSON:", err);
  }
}

function startModeB() {
  setupTimelineRows();
  fetchLatestDataB();
  intervalId = setInterval(fetchLatestDataB, 5000);
}

// --- INIT ---
switchMode(currentMode);
