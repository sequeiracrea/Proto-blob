// --- Variables globales ---
const lavaGrid = document.querySelector('.lava-grid');
const sensorKeys = ['co', 'co2', 'nh3', 'no2', 'humidity', 'bmp_temp'];
const rows = 12;
const cols = 12;

// Taille max des blobs en px (sera recalculée)
let blobSize = 60;

// --- Fonction pour créer et mettre en place la grille ---
function setupGrid() {
  // Calculer la taille des blobs selon largeur de l'écran
  const gridWidth = window.innerWidth * 0.9; // 90% de la largeur
  blobSize = Math.min(12 * 8, gridWidth / cols); // max 12vmin ou adapté à largeur
  lavaGrid.style.display = 'grid';
  lavaGrid.style.gridTemplateColumns = `repeat(${cols}, ${blobSize}px)`;
  lavaGrid.style.gridTemplateRows = `repeat(${rows}, ${blobSize}px)`;
  lavaGrid.style.gap = `${blobSize * 0.1}px`; // 10% d'espace

  // Nettoyer l'ancienne grille
  lavaGrid.innerHTML = '';

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cell = document.createElement('div');
      cell.classList.add('cell');
      cell.style.position = 'relative';
      cell.style.width = `${blobSize}px`;
      cell.style.height = `${blobSize}px`;

      sensorKeys.forEach(key => {
        const blob = document.createElement('div');
        blob.classList.add('blob');
        blob.dataset.sensor = key;
        blob.style.position = 'absolute';
        blob.style.top = '50%';
        blob.style.left = '50%';
        blob.style.transform = 'translate(-50%, -50%)';
        blob.style.width = `${blobSize}px`;
        blob.style.height = `${blobSize}px`;
        blob.style.borderRadius = '50%';
        blob.style.opacity = '0.7';
        blob.style.mixBlendMode = 'screen';
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

function valueToBlur(sensor, value) {
  const norm = normalize(value, sensorMin[sensor], sensorMax[sensor]);
  return 5 + norm * 20; // 5px → 25px
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

    blobs.forEach(blob => {
      const key = blob.dataset.sensor;
      const value = dataItem[key] ?? 0;
      blob.style.background = valueToColor(key, value);
      blob.style.filter = `blur(${valueToBlur(key, value)}px)`;
      blob.style.transition = 'background 0.5s, filter 0.5s';
    });
  });
}

// --- Récupération du flux JSON ---
async function fetchLatestData() {
  try {
    const response = await fetch('https://server-online-1.onrender.com/sensor'); // ton endpoint Render
    const contentType = response.headers.get("content-type");

    if (!contentType || !contentType.includes("application/json")) {
      const text = await response.text();
      console.warn("⚠️ Réponse non JSON, reçu :", text.slice(0, 200));
      throw new Error("La réponse n'est pas du JSON");
    }

    const data = await response.json();
    const latest144 = data.slice(-144); // pour 12x12
    updateGridWithJSON(latest144);

    console.log("✅ Données mises à jour :", latest144[latest144.length - 1]);
  } catch (err) {
    console.error('❌ Erreur fetch JSON:', err);
  }
}

// --- Initialisation ---
setupGrid();
window.addEventListener('resize', setupGrid);
setInterval(fetchLatestData, 5000);
fetchLatestData(); // initial

