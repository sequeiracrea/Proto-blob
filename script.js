const lavaGrid = document.querySelector('.lava-grid');
const rows = 12;
const cols = 12;
const sensorKeys = ['co', 'co2', 'nh3', 'no2', 'humidity', 'bmp_temp'];
let currentCellIndex = 0;
let latestData = [];

// --- Création du damier 12x12 ---
function setupGrid() {
  lavaGrid.innerHTML = '';
  lavaGrid.style.display = 'grid';
  lavaGrid.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
  lavaGrid.style.gridTemplateRows = `repeat(${rows}, 1fr)`;
  lavaGrid.style.gap = '0.5vmin';

  for (let i = 0; i < rows * cols; i++) {
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

// --- Mettre à jour une cellule ---
function updateCell(cell, dataItem) {
  const blobs = cell.querySelectorAll('.blob');
  const cellSize = lavaGrid.getBoundingClientRect().width / cols;

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

// --- Récupération et application progressive ---
async function fetchLatestData() {
  try {
    const response = await fetch('https://server-online-1.onrender.com/sensor');
    const data = await response.json();
    latestData = data;

    // remplir progressivement les cellules
    for (; currentCellIndex < rows * cols && currentCellIndex < data.length; currentCellIndex++) {
      const cell = lavaGrid.children[currentCellIndex];
      const dataItem = data[currentCellIndex];
      updateCell(cell, dataItem);
    }
  } catch (err) {
    console.error('Erreur fetch JSON:', err);
  }
}

// --- Initialisation ---
setupGrid();
fetchLatestData();
setInterval(fetchLatestData, 5000);

// --- Responsive ---
window.addEventListener('resize', () => {
  for (let i = 0; i < currentCellIndex; i++) {
    updateCell(lavaGrid.children[i], latestData[i]);
  }
});
