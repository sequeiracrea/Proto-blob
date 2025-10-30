const lavaGrid = document.querySelector('.lava-grid');
const rows = 12;
const cols = 12;
const sensorKeys = ['co', 'co2', 'nh3', 'no2', 'humidity', 'bmp_temp'];

// --- Création de la grille 12x12 avec blobs ---
function setupGrid() {
  lavaGrid.innerHTML = ''; // réinitialise si nécessaire
  lavaGrid.style.display = 'grid';
  lavaGrid.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
  lavaGrid.style.gridTemplateRows = `repeat(${rows}, 1fr)`;
  lavaGrid.style.gap = '1vmin';

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cell = document.createElement('div');
      cell.classList.add('cell');
      cell.style.position = 'relative';
      cell.style.width = '100%';
      cell.style.aspectRatio = '1 / 1'; // carré

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

// --- Fonctions utilitaires ---
function normalize(value, min, max) {
  return Math.max(0, Math.min(1, (value - min) / (max - min)));
}

function valueToColor(sensor, value) {
  const norm = normalize(value, sensorMin[sensor], sensorMax[sensor]);
  if (norm < 0.25) return '#00ff00';
  if (norm < 0.5) return '#ffff00';
  if (norm < 0.75) return '#ff8000';
  return '#ff0040';
}

function valueToBlur(sensor, value, cellSize) {
  const norm = normalize(value, sensorMin[sensor], sensorMax[sensor]);
  return (5 + norm * 20) * (cellSize / 120); // proportionnel à la taille de la cellule
}

function valueToOpacity(sensor, value) {
  return normalize(value, sensorMin[sensor], sensorMax[sensor]) * 0.8 + 0.2; // 0.2 → 1
}

// --- Définir min/max par capteur ---
const sensorMin = { co: 0, co2: 350, nh3: 0, no2: 0, humidity: 0, bmp_temp: 15 };
const sensorMax = { co: 1, co2: 500, nh3: 1.5, no2: 1, humidity: 100, bmp_temp: 30 };

// --- Mise à jour des blobs avec une nouvelle mesure ---
function updateGridWithJSON(latestDataArray) {
  const cells = document.querySelectorAll('.cell');
  cells.forEach((cell, idx) => {
    const blobs = cell.querySelectorAll('.blob');
    const dataItem = latestDataArray[idx] || {};
    const cellSize = cell.getBoundingClientRect().width;

    blobs.forEach(blob => {
      const key = blob.dataset.sensor;
      const value = dataItem[key] ?? 0;
      blob.style.background = valueToColor(key, value);
      blob.style.filter = `blur(${valueToBlur(key, value, cellSize)}px)`;
      blob.style.opacity = valueToOpacity(key, value);
    });
  });
}

// --- Récupération du flux JSON ---
async function fetchLatestData() {
  try {
    const response = await fetch('https://server-online-1.onrender.com/sensor');
    const data = await response.json();
    const latest144 = data.slice(-144);
    updateGridWithJSON(latest144);
  } catch (err) {
    console.error('Erreur fetch JSON:', err);
  }
}

// --- Initialisation ---
setupGrid();
fetchLatestData();
setInterval(fetchLatestData, 5000);

// --- Ajuster la taille des blobs si la fenêtre change ---
window.addEventListener('resize', () => {
  const cells = document.querySelectorAll('.cell');
  cells.forEach(cell => {
    const blobs = cell.querySelectorAll('.blob');
    const cellSize = cell.getBoundingClientRect().width;
    blobs.forEach(blob => {
      // redimensionne le blob proportionnellement à la cellule
      blob.style.width = `${cellSize * 0.9}px`;
      blob.style.height = `${cellSize * 0.9}px`;
    });
  });
});
