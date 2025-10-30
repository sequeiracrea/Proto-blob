const lavaGrid = document.querySelector('.lava-grid');
const rows = 12;
const cols = 12;
const sensorKeys = ['co', 'co2', 'nh3', 'no2', 'humidity', 'bmp_temp'];

let currentCellIndex = 0; // cellule à mettre à jour
let latestData = [];      // stocke les données reçues

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
      cell.style.position = 'relative';
      cell.style.width = '100%';
      cell.style.height = '100%';

      sensorKeys.forEach(key => {
        const blob = document.createElement('div');
        blob.classList.add('blob');
        blob.dataset.sensor = key;
        blob.style.position = 'absolute';
        blob.style.top = '50%';
        blob.style.left = '50%';
        blob.style.transform = 'translate(-50%, -50%)';
        blob.style.borderRadius = '50%';
        blob.style.mixBlendMode = 'screen';
        blob.style.transition = 'background 0.5s, filter 0.5s, opacity 0.5s';
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
  return 0.3 + 0.7 * norm; // entre 0.3 et 1
}

function valueToBlur(sensor, value, blobSize) {
  const norm = normalize(value, sensorMin[sensor], sensorMax[sensor]);
  return blobSize * 0.05 + norm * blobSize * 0.15;
}

// --- Mise à jour d'une cellule avec un lot de 6 valeurs ---
function updateCell(cell, dataItem) {
  const blobs = cell.querySelectorAll('.blob');
  const cellWidth = cell.getBoundingClientRect().width;

  blobs.forEach(blob => {
    const key = blob.dataset.sensor;
    const value = dataItem[key] ?? 0;
    blob.style.background = valueToColor(key);
    blob.style.opacity = valueToOpacity(key, value);
    blob.style.width = `${cellWidth}px`;
    blob.style.height = `${cellWidth}px`;
    blob.style.filter = `blur(${valueToBlur(key, value, cellWidth)}px)`;
  });
}

// --- Récupération du flux JSON et mise à jour progressive ---
async function fetchLatestData() {
  try {
    const response = await fetch('https://server-online-1.onrender.com/sensor');
    const data = await response.json();

    // On ne prend que les nouvelles données après celles déjà appliquées
    const newData = data.slice(latestData.length);

    newData.forEach(item => {
      if (currentCellIndex < rows * cols) {
        const cell = lavaGrid.children[currentCellIndex];
        updateCell(cell, item);
        currentCellIndex++;
      }
    });

    latestData = data; // mettre à jour le journal des données

  } catch (err) {
    console.error('Erreur fetch JSON:', err);
  }
}

// --- Initialisation ---
setupGrid();
fetchLatestData();
setInterval(fetchLatestData, 5000);

// --- Gestion responsive ---
window.addEventListener('resize', () => {
  for (let i = 0; i < currentCellIndex; i++) {
    updateCell(lavaGrid.children[i], latestData[i]);
  }
});
