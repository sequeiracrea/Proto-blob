const lavaGrid = document.querySelector('.lava-grid');
const rows = 12;
const cols = 12;
const sensorKeys = ['co', 'co2', 'nh3', 'no2', 'humidity', 'bmp_temp'];
let currentCellIndex = 0;

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

// --- Valeurs min/max par capteur ---
const sensorMin = { co: 0, co2: 350, nh3: 0, no2: 0, humidity: 0, bmp_temp: 15 };
const sensorMax = { co: 1, co2: 500, nh3: 1.5, no2: 1, humidity: 100, bmp_temp: 30 };

function normalize(v, min, max) {
  return Math.max(0, Math.min(1, (v - min) / (max - min)));
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
  const n = normalize(value, sensorMin[sensor], sensorMax[sensor]);
  return 0.5 + 0.7 * n; // boost luminosity
}

function valueToBlur(sensor, value, size) {
  const n = normalize(value, sensorMin[sensor], sensorMax[sensor]);
  return size * (0.03 + n * 0.1); // plus net
}

function updateCell(cell, dataItem) {
  const blobs = cell.querySelectorAll('.blob');
  const cellSize = cell.getBoundingClientRect().width;
  blobs.forEach(blob => {
    const key = blob.dataset.sensor;
    const value = dataItem[key] ?? 0;
    blob.style.background = valueToColor(key);
    blob.style.opacity = valueToOpacity(key, value);
    blob.style.width = `${cellSize}px`;
    blob.style.height = `${cellSize}px`;
    blob.style.filter = `blur(${valueToBlur(key, value, cellSize)}px)`;
  });
}

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

setupGrid();
fetchLatestData();
setInterval(fetchLatestData, 5000);

window.addEventListener('resize', () => {
  const cells = document.querySelectorAll('.cell');
  cells.forEach(cell => updateCell(cell, {}));
});
