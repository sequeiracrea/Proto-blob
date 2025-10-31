const lavaGrid = document.querySelector('.lava-grid');
const rows = 12;
const cols = 12;
const sensorKeys = ['co', 'co2', 'nh3', 'no2', 'humidity', 'bmp_temp'];
let currentCellIndex = 0;

const sensorMin = { co: 0, co2: 350, nh3: 0, no2: 0, humidity: 0, bmp_temp: 15 };
const sensorMax = { co: 1, co2: 500, nh3: 1.5, no2: 1, humidity: 100, bmp_temp: 30 };

/* ---- Création de la grille ---- */
function setupGrid() {
  lavaGrid.innerHTML = '';
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cell = document.createElement('div');
      cell.classList.add('cell');

      sensorKeys.forEach(key => {
        const blob = document.createElement('div');
        blob.classList.add('blob');
        blob.dataset.sensor = key;
        cell.appendChild(blob);
      });

      lavaGrid.appendChild(cell);
    }
  }
}

/* ---- Normalisation ---- */
function normalize(value, min, max) {
  return Math.max(0, Math.min(1, (value - min) / (max - min)));
}

/* ---- Couleurs depuis variables CSS ---- */
function valueToColor(sensor) {
  return getComputedStyle(document.documentElement).getPropertyValue(`--color-${sensor}`).trim() || '#FFFFFF';
}

function valueToOpacity(sensor, value) {
  const norm = normalize(value, sensorMin[sensor], sensorMax[sensor]);
  return 0.3 + 0.7 * norm;
}

function valueToBlur(sensor, value, blobSize) {
  const norm = normalize(value, sensorMin[sensor], sensorMax[sensor]);
  return blobSize * (0.05 + norm * 0.15);
}

/* ---- Mise à jour d’une cellule ---- */
function updateCell(cell, dataItem) {
  const blobs = cell.querySelectorAll('.blob');
  const cellSize = cell.getBoundingClientRect().width;
  let globalBrightness = 0;

  blobs.forEach(blob => {
    const key = blob.dataset.sensor;
    const value = dataItem[key] ?? 0;
    const color = valueToColor(key);
    const opacity = valueToOpacity(key, value);
    const blur = valueToBlur(key, value, cellSize);

    blob.style.background = color;
    blob.style.opacity = opacity;
    blob.style.width = `${cellSize}px`;
    blob.style.height = `${cellSize}px`;
    blob.style.filter = `blur(${blur}px)`;
    globalBrightness += opacity;
  });

  // 🌗 Équilibrage si trop lumineux
  if (globalBrightness > 3.5) {
    blobs.forEach(blob => blob.style.opacity *= 0.8);
  }
}

/* ---- Récupération des données ---- */
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

/* ---- Initialisation ---- */
setupGrid();
fetchLatestData();
setInterval(fetchLatestData, 5000);
