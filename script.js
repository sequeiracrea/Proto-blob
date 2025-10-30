const lavaGrid = document.querySelector('.lava-grid');
const rows = 12;
const cols = 12;
const sensorKeys = ['co','co2','nh3','no2','humidity','bmp_temp'];

const sensorBaseColor = {
  co: '#FF0000',
  co2: '#00FF00',
  nh3: '#0000FF',
  no2: '#FF00FF',
  humidity: '#00FFFF',
  bmp_temp: '#FFFF00'
};

const sensorMin = { co:0, co2:350, nh3:0, no2:0, humidity:0, bmp_temp:15 };
const sensorMax = { co:1, co2:500, nh3:1.5, no2:1, humidity:100, bmp_temp:30 };

lavaGrid.style.display = 'grid';
lavaGrid.style.gridTemplateColumns = `repeat(${cols}, 12vmin)`;
lavaGrid.style.gridTemplateRows = `repeat(${rows}, 12vmin)`;
lavaGrid.style.gap = '2vmin';
lavaGrid.style.justifyItems = 'center';
lavaGrid.style.alignItems = 'center';

// --- Créer des cellules vides ---
for (let i = 0; i < rows*cols; i++) {
  const cell = document.createElement('div');
  cell.classList.add('cell');
  lavaGrid.appendChild(cell);
}

function normalize(value, min, max) {
  return Math.max(0, Math.min(1, (value - min)/(max - min)));
}

function valueToBlur(sensor, value) {
  const norm = normalize(value, sensorMin[sensor], sensorMax[sensor]);
  return 5 + norm*20;
}

// --- Ajouter un nouveau blob par cellule avec les nouvelles données ---
function addNewBlobs(latestDataArray) {
  const cells = document.querySelectorAll('.cell');

  latestDataArray.forEach((dataItem, idx) => {
    const cell = cells[idx];
    if (!cell) return;

    sensorKeys.forEach(key => {
      if (cell.querySelectorAll(`.blob[data-sensor="${key}"]`).length === 0) {
        // créer blob uniquement si pas déjà présent
        const value = dataItem[key] ?? 0;
        const blob = document.createElement('div');
        blob.classList.add('blob');
        blob.dataset.sensor = key;
        blob.style.position = 'absolute';
        blob.style.top = '50%';
        blob.style.left = '50%';
        blob.style.transform = 'translate(-50%, -50%)';
        blob.style.width = '12vmin';
        blob.style.height = '12vmin';
        blob.style.borderRadius = '50%';
        blob.style.background = sensorBaseColor[key];
        blob.style.opacity = 0.2 + 0.8 * normalize(value, sensorMin[key], sensorMax[key]);
        blob.style.filter = `blur(${valueToBlur(key,value)}px)`;
        blob.style.mixBlendMode = 'screen';
        blob.style.transition = 'opacity 0.5s, filter 0.5s';
        cell.appendChild(blob);
      }
    });
  });
}

// --- Fetch ---
async function fetchLatestData() {
  try {
    const response = await fetch('https://server-online-1.onrender.com/sensor');
    const data = await response.json();

    const latestData = data.slice(-12); // exemple : les 12 dernières mesures
    addNewBlobs(latestData);

  } catch(err) {
    console.error('Erreur fetch JSON:', err);
  }
}

setInterval(fetchLatestData, 5000);
fetchLatestData();

