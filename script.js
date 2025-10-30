const lavaGrid = document.querySelector('.lava-grid');
const rows = 12;
const cols = 12;

// Met à jour la grille avec taille adaptative
function setupGrid() {
  lavaGrid.style.display = 'grid';
  lavaGrid.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
  lavaGrid.style.gridTemplateRows = `repeat(${rows}, 1fr)`;
  lavaGrid.style.gap = '1%';

  // supprime anciennes cellules si nécessaire
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

// Appelle cette fonction au départ
setupGrid();

// Optionnel : recalculer si l’écran change de taille
window.addEventListener('resize', setupGrid);
