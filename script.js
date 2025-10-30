// --- Variables globales ---
const lavaGrid = document.querySelector('.lava-grid');
const rows = 12;
const cols = 12;
const sensorKeys = ['co', 'co2', 'nh3', 'no2', 'humidity', 'bmp_temp'];

// --- Définir min/max par capteur ---
const sensorMin = { co: 0, co2: 350, nh3: 0, no2: 0, humidity: 0, bmp_temp: 15 };
const sensorMax = { co: 1, co2: 500, nh3: 1.5, no2: 1, humidity: 100, bmp_temp: 30 };

// --- Fonction utilitaire ---
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

function valueToBlur(sensor, value) {
  const norm = normalize(value, sensorMin[sensor], sensorMax[sensor]);
  return 5 + norm * 20; // 5px → 25px
}

// --- Création de la grille responsive ---
function setupGrid() {
  lavaGrid.innerHTML = ''; // reset

  const availableWidth = window.innerWidth * 0.9; // 90% de la largeur
  const cellSize = Math.min(availableWidth / cols, 80); // max 80px par cell
  lavaGrid.style.display = 'grid';
  lavaGrid.style.gridTemplateColumns = `repeat(${cols}, ${cellSize}px)`;
  lavaGrid.style.gridTemplateRows = `repeat(${rows}, ${cellSize}px)`;
  lavaGrid.style.gap = '2vmin';

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cell = document.createElement('div');
      cell.classList.add('cell');
      cell.style.width = `${cellSize}px`;
      cell.style.height = `${cellSize}px`;
      cell.style.position = 'relative';

      sensorKeys.forEach(key => {
        const blob = document.createElement('div');
        blob.classList.add('blob');
        blob.dataset.sensor = key;
        blob.style.position = 'absolute';
        blob.style.top = '50%';
        blob.style.left = '50%';
        blob.style.transform = 'translate(-50%, -50%)';
        blob.style.width = `${cellSize}px`;
        blob.style.height = `${cellSize}px`;
        blob.style.borderRadius = '50%';
        blob.style.opacity = '0.7';
        blob.style.mixBlendMode = 'screen';
        blob.style.transition = 'background 0.5s, filter 0.5s';
        cell.appendChild(blob);
      });

      lavaGrid.appendChild(cell);
    }
  }
}

// --- Mettre à jour les blobs avec les données ---
function updateGridWithJSON(latestDataArray) {
  const cells = document.querySelectorAll('.cell');
  cells.forEach((cell, idx) => {
    const blobs = cell.querySelectorAll('.blob');
    const dataItem = latestDataArray[idx] || {};
    blobs.forEach(blob => {
      const key = blob.dataset.sensor;
      const value = dataItem[key] ?? 0;
      blob.style.background = valueToColor(key, value);
      blob.style.filter = `blur(${valueToBlur(key, value)}px)`;
    });
  });
}

// --- Récupération du flux JSON ---
async function fetchLatestData() {
  try {
    const response = await fetch('https://server-online-1.onrender.com/sensor');
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      const text = await response.text();
      console.warn("⚠️ Réponse non JSON :", text.slice(0, 200));
      throw new Error("La réponse n'est pas du JSON");
    }

    const data = await response.json();
    const latest144 = data.slice(-144); // 12x12
    updateGridWithJSON(latest144);
  } catch (err) {
    console.error('❌ Erreur fetch JSON:', err);
  }
}

// --- Initialisation ---
setupGrid();
window.addEventListener('resize', setupGrid);
setInterval(fetchLatestData, 5000);
fetchLatestData(); // première récupération
