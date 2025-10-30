const lavaGrid = document.querySelector('.lava-grid');
const rows = 12;
const cols = 12;
const sensorKeys = ['co', 'co2', 'nh3', 'no2', 'humidity', 'bmp_temp'];

// --- Couleur de base par capteur ---
const sensorBaseColor = {
  co: '#FF0000',       // rouge
  co2: '#00FF00',      // vert
  nh3: '#0000FF',      // bleu
  no2: '#FF00FF',      // magenta
  humidity: '#00FFFF', // cyan
  bmp_temp: '#FFFF00'  // jaune
};

// --- Min / Max par capteur pour normalisation ---
const sensorMin = { co:0, co2:350, nh3:0, no2:0, humidity:0, bmp_temp:15 };
const sensorMax = { co:1, co2:500, nh3:1.5, no2:1, humidity:100, bmp_temp:30 };

// --- Création de la grille 12x12 ---
lavaGrid.style.display = 'grid';
lavaGrid.style.gridTemplateColumns = `repeat(${cols}, 12vmin)`;
lavaGrid.style.gridTemplateRows = `repeat(${rows}, 12vmin)`;
lavaGrid.style.gap = '2vmin';
lavaGrid.style.justifyItems = 'center';
lavaGrid.style.alignItems = 'center';

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

// --- Fonctions utilitaires ---
function normalize(value, min, max) {
  return Math.max(0, Math.min(1, (value - min)/(max - min)));
}

function valueToBlur(sensor, value){
  const norm = normalize(value, sensorMin[sensor], sensorMax[sensor]);
  return 5 + norm*20; // blur 5 → 25px
}

// --- Mise à jour de la grille avec le JSON ---
function updateGridWithJSON(latestDataArray) {
  const cells = document.querySelectorAll('.cell');

  cells.forEach((cell, idx) => {
    const blobs = cell.querySelectorAll('.blob');
    const dataItem = latestDataArray[idx] || {};

    blobs.forEach(blob => {
      const key = blob.dataset.sensor;
      const value = dataItem[key] ?? 0;

      const norm = normalize(value, sensorMin[key], sensorMax[key]);
      blob.style.background = sensorBaseColor[key];
      blob.style.opacity = 0.2 + 0.8 * norm; // opacité selon valeur
      blob.style.filter = `blur(${valueToBlur(key,value)}px)`;
      blob.style.transition = 'opacity 0.5s, filter 0.5s';
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
      console.warn("⚠️ Réponse non JSON, reçu :", text.slice(0,200));
      throw new Error("La réponse n'est pas du JSON");
    }

    const data = await response.json();
    const latest144 = data.slice(-144); // 12x12
    updateGridWithJSON(latest144);

    console.log("✅ Données mises à jour :", latest144[latest144.length-1]);
  } catch(err) {
    console.error('❌ Erreur fetch JSON:', err);
  }
}

// --- Rafraîchir toutes les 5 secondes ---
setInterval(fetchLatestData, 5000);
fetchLatestData(); // initial


