const lavaGrid = document.querySelector('.lava-grid');
const modeSelector = document.getElementById('modeSelector');
const legend = document.getElementById('legend');

const rows = 12;
const cols = 12;
let currentCellIndex = 0;

const sensorKeys = ['co', 'co2', 'nh3', 'no2', 'humidity', 'bmp_temp'];

const sensorMin = { co: 0, co2: 350, nh3: 0, no2: 0, humidity: 0, bmp_temp: 15 };
const sensorMax = { co: 1, co2: 500, nh3: 1.5, no2: 1, humidity: 100, bmp_temp: 30 };

function normalize(value, min, max) {
  return Math.max(0, Math.min(1, (value - min) / (max - min)));
}

function valueToColor(sensor) {
  switch (sensor) {
    case 'co': return '#FF4400';
    case 'co2': return '#23E6F7';
    case 'nh3': return '#FFDD00';
    case 'no2': return '#00FF80';
    case 'humidity': return '#FF00FF';
    case 'bmp_temp': return '#0080FF';
    default: return '#FFFFFF';
  }
}

function valueToOpacity(sensor, value) {
  const norm = normalize(value, sensorMin[sensor], sensorMax[sensor]);
  return 0.3 + 0.7 * norm;
}

function valueToBlur(sensor, value, blobSize) {
  const norm = normalize(value, sensorMin[sensor], sensorMax[sensor]);
  return blobSize * 0.05 + norm * blobSize * 0.15;
}

/* ----- Légendes dynamiques ----- */
const legends = {
  A: `
    <strong>Mode A — AQI Global</strong><br>
    <div class="legend-item"><div class="legend-color" style="background:#00E400"></div>Air bon</div>
    <div class="legend-item"><div class="legend-color" style="background:#FFFF00"></div>Modéré</div>
    <div class="legend-item"><div class="legend-color" style="background:#FF7E00"></div>Mauvais sensible</div>
    <div class="legend-item"><div class="legend-color" style="background:#FF0000"></div>Mauvais</div>
    <div class="legend-item"><div class="legend-color" style="background:#8F3F97"></div>Très mauvais</div>
  `,
  B: `
    <strong>Mode B — Capteurs</strong><br>
    <div class="legend-item"><div class="legend-color" style="background:#FF4400"></div>CO (monoxyde de carbone)</div>
    <div class="legend-item"><div class="legend-color" style="background:#23E6F7"></div>CO₂ (dioxyde de carbone)</div>
    <div class="legend-item"><div class="legend-color" style="background:#FFDD00"></div>NH₃ (ammoniac)</div>
    <div class="legend-item"><div class="legend-color" style="background:#00FF80"></div>NO₂ (dioxyde d’azote)</div>
    <div class="legend-item"><div class="legend-color" style="background:#FF00FF"></div>Humidité</div>
    <div class="legend-item"><div class="legend-color" style="background:#0080FF"></div>Température</div>
  `,
  C: `
    <strong>Mode C — Fusion pondérée</strong><br>
    Couleur = mélange dynamique pondéré des 6 capteurs (CO, CO₂, NH₃, NO₂, humidité, température).<br>
    Intensité ↗️ = concentration moyenne ↗️
  `
};

function updateLegend() {
  const mode = modeSelector.value;
  legend.innerHTML = legends[mode];
}

/* ----- Création de la grille ----- */
function setupGrid() {
  lavaGrid.innerHTML = '';
  for (let i = 0; i < rows * cols; i++) {
    const cell = document.createElement('div');
    cell.classList.add('cell');
    lavaGrid.appendChild(cell);
  }
}

/* ----- Mode A : AQI global ----- */
function getAQIColor(aqi) {
  if (aqi <= 50) return '#00E400';
  if (aqi <= 100) return '#FFFF00';
  if (aqi <= 150) return '#FF7E00';
  if (aqi <= 200) return '#FF0000';
  if (aqi <= 300) return '#8F3F97';
  return '#7E0023';
}

function computeAQIFromData(dataItem) {
  const values = sensorKeys.map(k => normalize(dataItem[k] ?? 0, sensorMin[k], sensorMax[k]));
  return values.reduce((a, b) => a + b, 0) / values.length * 300;
}

/* ----- Mode C : Fusion pondérée ----- */
function computeMixedColor(dataItem) {
  let r = 0, g = 0, b = 0;
  sensorKeys.forEach(k => {
    const norm = normalize(dataItem[k] ?? 0, sensorMin[k], sensorMax[k]);
    const hex = valueToColor(k);
    const [cr, cg, cb] = [parseInt(hex.substr(1, 2), 16), parseInt(hex.substr(3, 2), 16), parseInt(hex.substr(5, 2), 16)];
    r += cr * norm;
    g += cg * norm;
    b += cb * norm;
  });
  const count = sensorKeys.length;
  return `rgb(${Math.min(255, r / count)}, ${Math.min(255, g / count)}, ${Math.min(255, b / count)})`;
}

/* ----- Mise à jour d'une cellule ----- */
function updateCell(cell, dataItem) {
  const mode = modeSelector.value;
  const cellSize = cell.getBoundingClientRect().width;
  cell.innerHTML = '';

  if (mode === 'A') {
    const blob = document.createElement('div');
    blob.classList.add('blob');
    const aqi = computeAQIFromData(dataItem);
    blob.style.background = getAQIColor(aqi);
    blob.style.width = `${cellSize}px`;
    blob.style.height = `${cellSize}px`;
    blob.style.opacity = 0.4 + 0.6 * (aqi / 300);
    blob.style.filter = `blur(${cellSize * 0.1}px)`;
    cell.appendChild(blob);
  }

  if (mode === 'B') {
    const subGrid = document.createElement('div');
    subGrid.classList.add('sub-grid');
    sensorKeys.forEach(key => {
      const blob = document.createElement('div');
      blob.classList.add('blob');
      const value = dataItem[key] ?? 0;
      blob.style.background = valueToColor(key);
      blob.style.opacity = valueToOpacity(key, value);
      blob.style.filter = `blur(${valueToBlur(key, value, cellSize)}px)`;
      blob.style.width = '100%';
      blob.style.height = '100%';
      subGrid.appendChild(blob);
    });
    cell.appendChild(subGrid);
  }

  if (mode === 'C') {
    const blob = document.createElement('div');
    blob.classList.add('blob');
    const color = computeMixedColor(dataItem);
    blob.style.background = color;
    blob.style.width = `${cellSize}px`;
    blob.style.height = `${cellSize}px`;
    blob.style.opacity = 0.5;
    blob.style.filter = `blur(${cellSize * 0.1}px)`;
    cell.appendChild(blob);
  }
}

/* ----- Données réelles ----- */
async function fetchLatestData() {
  try {
    const response = await fetch('https://server-online-1.onrender.com/sensor');
    const data = await response.json();
    const nextData = data[currentCellIndex % data.length];
    const cell = lavaGrid.children[currentCellIndex % (rows * cols)];
    updateCell(cell, nextData);
    currentCellIndex++;
  } catch (err) {
    console.error('Erreur fetch JSON:', err);
  }
}

/* ----- Initialisation ----- */
setupGrid();
updateLegend();
fetchLatestData();
setInterval(fetchLatestData, 5000);

/* ----- Réactivité ----- */
modeSelector.addEventListener('change', () => {
  setupGrid();
  updateLegend();
  currentCellIndex = 0;
});
