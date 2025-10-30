const lavaGrid = document.querySelector('.lava-grid');
const rows = 12;
const cols = 12;
const sensorKeys = ['co', 'co2', 'nh3', 'no2', 'humidity', 'bmp_temp'];
let latestFlattenedData = [];

// --- Création de la grille 12x12 ---
function setupGrid() {
  lavaGrid.innerHTML = '';
  lavaGrid.style.display = 'grid';
  lavaGrid.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
  lavaGrid.style.gridTemplateRows = `repeat(${rows}, 1fr)`;
  lavaGrid.style.gap = '0.5vmin';

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

// --- Utilitaires ---
function normalize(value, min, max) {
  return Math.max(0, Math.min(1, (value - min) / (max - min)));
}

const sensorMin = { co: 0, co2: 350, nh3: 0, no2: 0, humidity: 0, bmp_temp: 15 };
const sensorMax = { co: 1, co2: 500, nh3: 1.5, no2: 1, humidity: 100, bmp_temp: 30 };

function valueToColor(sensor, value) {
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

// --- Mise à jour de la grille ---
function updateGridWithJSON(flattenedData) {
  const cells = document.querySelectorAll('.cell');
  const lavaWidth = lavaGrid.getBoundingClientRect().width;
  const blobSize = lavaWidth / cols;

  cells.forEach((cell, cellIdx) => {
    const blobs = cell.querySelectorAll('.blob');
    blobs.forEach((blob, blobIdx) => {
      const index = cellIdx * sensorKeys.length + blobIdx;
      const dataItem = flattenedData[index] || {};
      const key = blob.dataset.sensor;
      const value = dataItem[key] ?? 0;

      blob.style.background = valueToColor(key, value);
      blob.style.opacity = valueToOpacity(key, value);
      blob.style.width = `${blobSize}px`;
      blob.style.height = `${blobSize}px`;
      blob.style.filter = `blur(${valueToBlur(key, value, blobSize)}px)`;
    });
  });
}

// --- Récupération des données ---
async function fetchLatestData() {
  try {
    const response = await fetch('https://server-online-1.onrender.com/sensor');
    const data = await response.json();

    // transformer chaque ligne en 6 blobs
    const newFlattened = [];
    data.forEach(item => {
      sensorKeys.forEach(key => newFlattened.push({ [key]: item[key], timestamp: item.timestamp }));
    });

    // ajouter uniquement les nouvelles données
    latestFlattenedData = latestFlattenedData.concat(newFlattened);

    // conserver les 864 dernières valeurs
    if (latestFlattenedData.length > 864) {
      latestFlattenedData = latestFlattenedData.slice(-864);
    }

    updateGridWithJSON(latestFlattenedData);
  } catch (err) {
    console.error('Erreur fetch JSON:', err);
  }
}

// --- Initialisation ---
setupGrid();
fetchLatestData();
setInterval(fetchLatestData, 5000);
window.addEventListener('resize', () => updateGridWithJSON(latestFlattenedData));
