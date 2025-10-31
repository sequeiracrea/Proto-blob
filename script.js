const lavaGrid = document.querySelector('.lava-grid');
const modeSelector = document.getElementById('modeSelector');
const legend = document.getElementById('legend');
const tooltip = document.getElementById('tooltip');

const rows = 12;
const cols = 12;
let currentCellIndex = 0;

const sensorKeys = ['co', 'co2', 'nh3', 'no2', 'humidity', 'bmp_temp'];
const sensorMin = { co: 0, co2: 350, nh3: 0, no2: 0, humidity: 0, bmp_temp: 15 };
const sensorMax = { co: 1, co2: 500, nh3: 1.5, no2: 1, humidity: 100, bmp_temp: 30 };

function normalize(value, min, max) {
  return Math.max(0, Math.min(1, (value - min) / (max - min)));
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
  const norm = normalize(value, sensorMin[sensor], sensorMax[sensor]);
  return 0.3 + 0.7 * norm;
}

function valueToBlur(sensor, value, blobSize) {
  const norm = normalize(value, sensorMin[sensor], sensorMax[sensor]);
  return blobSize * 0.05 + norm * blobSize * 0.15;
}

/* ----- Tooltip ----- */
function showTooltip(event, content) {
  tooltip.innerHTML = content;
  tooltip.style.left = event.pageX + 12 + 'px';
  tooltip.style.top = event.pageY + 12 + 'px';
  tooltip.style.opacity = 1;
}
function moveTooltip(event) {
  tooltip.style.left = event.pageX + 12 + 'px';
  tooltip.style.top = event.pageY + 12 + 'px';
}
function hideTooltip() {
  tooltip.style.opacity = 0;
}

/* ----- Légendes dynamiques ----- */
const legends = {
  A: `
    <strong>Mode A — AQI Global</strong><br>
    <div class="legend-item"><div class="legend-color" style="background:#00E400"></div>Air bon</div>
    <div class="legend-item"><div class="legend-color" style="background:#FFFF00"></div>Modéré</div>
    <div class="legend-item"><div class="legend-color" style="background:#FF7E00"></div>Mauvais sensible</div>
    <div class="legend-item"><div class="legend-color" style="background:#FF0000"></div>Mauvais</div>
    <div class="legend-item"><div class="legend-color" style="background:#8F3F97"></div>Très mauvais</div>
  `,
  B: `
    <strong>Mode B — Capteurs</strong><br>
    <div class="legend-item"><div class="legend-color" style="background:#FF4400"></div>CO</div>
    <div class="legend-item"><div class="legend-color" style="background:#23E6F7"></div>CO₂</div>
    <div class="legend-item"><div class="legend-color" style="background:#FFDD00"></div>NH₃</div>
    <div class="legend-item"><div class="legend-color" style="background:#00FF80"></div>NO₂</div>
    <div class="legend-item"><div class="legend-color" style="background:#FF00FF"></div>Humidité</div>
    <div class="legend-item"><div class="legend-color" style="background:#0080FF"></div>Température</div>
  `,
  C: `
    <strong>Mode C — Fusion pondérée</strong><br>
    Couleur = mélange dynamique pondéré des 6 capteurs.<br>
    Intensité ↗️ = concentration moyenne ↗️
  `
};
function updateLegend() {
  legend.innerHTML = legends[modeSelector.value];
}

/* ----- Création de la grille ----- */
function setupGrid() {
  lavaGrid.innerHTML = '';
  for (let i = 0; i < rows * cols; i++) {
    const cell = document.createElement('div');
    cell.classList.add('cell');
    lavaGrid.appendChild(cell);
  }
}

/* ----- Mode A ----- */
function getAQIColor(aqi) {
  if (aqi <= 50) return '#00E400';
  if (aqi <= 100) return '#FFFF00';
  if (aqi <= 150) return '#FF7E00';
  if (aqi <= 200) return '#FF0000';
  if (aqi <= 300) return '#8F3F97';
  return '#7E0023';
}
function computeAQIFromData(dataItem) {
  const values = sensorKeys.map(k => normalize(dataItem[k] ?? 0, sensorMin[k], sensorMax[k]));
  return values.reduce((a,b)=>a+b,0)/values.length*300;
}

/* ----- Mode C ----- */
function computeMixedColor(dataItem) {
  let r=0,g=0,b=0;
  sensorKeys.forEach(k=>{
    const norm = normalize(dataItem[k] ?? 0, sensorMin[k], sensorMax[k]);
    const hex=valueToColor(k);
    const [cr,cg,cb] = [parseInt(hex.substr(1,2),16),parseInt(hex.substr(3,2),16),parseInt(hex.substr(5,2),16)];
    r+=cr*norm; g+=cg*norm; b+=cb*norm;
  });
  const count=sensorKeys.length;
  return `rgb(${Math.min(255,r/count)},${Math.min(255,g/count)},${Math.min(255,b/count)})`;
}

/* ----- Mise à jour d'une cellule ----- */
function updateCell(cell, dataItem){
  const mode = modeSelector.value;
  const cellSize = cell.getBoundingClientRect().width;
  cell.innerHTML='';

  if(mode==='A'||mode==='C'){
    const blob=document.createElement('div');
    blob.classList.add('blob');
    blob.style.width=`${cellSize}px`;
    blob.style.height=`${cellSize}px`;
    if(mode==='A'){
      const aqi = computeAQIFromData(dataItem);
      blob.style.background = getAQIColor(aqi);
      blob.style.opacity = 0.4 + 0.6*(aqi/300);
    } else {
      blob.style.background = computeMixedColor(dataItem);
      blob.style.opacity = 0.5;
    }
    blob.style.filter = `blur(${cellSize*0.1}px)`;
    blob.addEventListener('mouseenter', e=>{
      const content = sensorKeys.map(k=>`${k.toUpperCase()}: ${dataItem[k] ?? '–'}`).join('<br>');
      showTooltip(e, content);
    });
    blob.addEventListener('mousemove', moveTooltip);
    blob.addEventListener('mouseleave', hideTooltip);
    cell.appendChild(blob);
  }

  if(mode==='B'){
    const subGrid = document.createElement('div');
    subGrid.classList.add('sub-grid');

    sensorKeys.forEach(k=>{
      const blob=document.createElement('div');
      blob.classList.add('blob');
      const value = dataItem[k] ?? 0;
      blob.style.background = valueToColor(k);
      blob.style.opacity = valueToOpacity(k,value);
      // Flou proportionnel à la taille de la sous-cellule
      blob.style.filter = `blur(${cellSize/3*0.15 + valueToBlur(k,value,0)}px)`;
      // Retirer absolute pour mode B, laisse la grille gérer la taille
      blob.style.position = 'relative';
      blob.style.width = '100%';
      blob.style.height = '100%';

      blob.addEventListener('mouseenter', e=>{
        showTooltip(e, `${k.toUpperCase()}: ${value}`);
      });
      blob.addEventListener('mousemove', moveTooltip);
      blob.addEventListener('mouseleave', hideTooltip);

      subGrid.appendChild(blob);
    });

    cell.appendChild(subGrid);
  }
}

/* ----- Données réelles ----- */
async function fetchLatestData(){
  try{
    const response = await fetch('https://server-online-1.onrender.com/sensor');
    const data = await response.json();
    const nextData = data[currentCellIndex % data.length];
    const cell = lavaGrid.children[currentCellIndex % (rows*cols)];
    updateCell(cell,nextData);
    currentCellIndex++;
  }catch(err){
    console.error('Erreur fetch JSON:',err);
  }
}

/* ----- Initialisation ----- */
setupGrid();
updateLegend();
fetchLatestData();
setInterval(fetchLatestData,5000);

/* ----- Réactivité ----- */
modeSelector.addEventListener('change',()=>{
  setupGrid();
  updateLegend();
  currentCellIndex=0;
});
