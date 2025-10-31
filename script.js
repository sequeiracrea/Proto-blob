const lavaGrid = document.querySelector('.lava-grid');
const modeSelector = document.getElementById('modeSelector');

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
  if (aqi <= 50) return '#00E400'; // vert
  if (aqi <= 100) return '#FFFF00'; // jaune
  if (aqi <= 150) return '#FF7E00'; // orange
  if (aqi <= 200) return '#FF0000'; // rouge
  if (aqi <= 300) return '#8F3F97'; // violet
  return '#7E0023'; // bordeaux foncé
}

function computeAQIFromData(dataItem) {
  // Exemple simple : moyenne normalisée de tous les capteurs
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

/* ----- Récupération de données réelles ----- */
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
fetchLatestData();
setInterval(fetchLatestData, 5000);

/* ----- Réactivité ----- */
modeSelector.addEventListener('change', () => {
  setupGrid();
  currentCellIndex = 0;
});
