let boardData = {
  id: '',
  title: '',
  columns: []
};

let drake;

// Initialize dragula for drag and drop
function initDragula() {
  if (drake) {
    drake.destroy();
  }
  const containers = Array.from(document.querySelectorAll('.cards-container'));
  if (containers.length > 0) {
    drake = dragula(containers);
    drake.on('drop', saveBoard);
  }
}

// Show notification
function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 transform transition-transform duration-300 translate-x-full
    ${type === 'warning' ? 'bg-yellow-100 text-yellow-800 border-l-4 border-yellow-500' : 
      type === 'error' ? 'bg-red-100 text-red-800 border-l-4 border-red-500' : 
      'bg-blue-100 text-blue-800 border-l-4 border-blue-500'}`;
  notification.textContent = message;
  
  document.body.appendChild(notification);
  
  // Animate in
  setTimeout(() => notification.classList.remove('translate-x-full'), 100);
  
  // Remove after 3 seconds
  setTimeout(() => {
    notification.classList.add('translate-x-full');
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// Load board data from localStorage
function loadBoard() {
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const projectId = urlParams.get('id');
    
    if (!projectId) {
      window.location.href = 'index.html';
      return;
    }
    
    // Get user data first
    const userData = JSON.parse(localStorage.getItem('currentUser') || sessionStorage.getItem('currentUser'));
    if (!userData || !userData.projects) {
      window.location.href = 'index.html';
      return;
    }
    
    // Find project in user's projects
    const project = userData.projects.find(p => p.id === projectId);
    
    if (!project || project.type !== 'Kanban') {
      window.location.href = 'index.html';
      return;
    }
    
    boardData = JSON.parse(project.content);
    boardData.id = project.id;
    document.getElementById('board-title').textContent = project.title;
    
    // Ensure columns exist
    if (!boardData.columns || !Array.isArray(boardData.columns)) {
      boardData.columns = [
        { id: uuid.v4(), title: 'To Do', cards: [] },
        { id: uuid.v4(), title: 'In Progress', cards: [] },
        { id: uuid.v4(), title: 'Done', cards: [] }
      ];
    }
    
    renderBoard();
    initDragula();
  } catch (error) {
    console.error('Error loading board:', error);
    showNotification('Fehler beim Laden des Boards', 'error');
  }
}

// Save board data to localStorage
function saveBoard() {
  try {
    // Get current user data from localStorage
    const userData = JSON.parse(localStorage.getItem('currentUser'));
    if (!userData || !userData.projects) {
      showNotification('Fehler: Keine Benutzerdaten gefunden', 'error');
      return;
    }

    // Find project in user's projects
    const projectIndex = userData.projects.findIndex(p => p.id === boardData.id);
    
    if (projectIndex !== -1) {
      boardData.columns = Array.from(document.querySelectorAll('.kanban-column')).map(column => ({
        id: column.dataset.columnId,
        title: column.querySelector('h3').textContent,
        cards: Array.from(column.querySelector('.cards-container').querySelectorAll('.card')).map(card => ({
          id: card.dataset.cardId,
          text: card.querySelector('.card-text').textContent,
          image: card.querySelector('.card-image')?.src || null,
          priority: card.dataset.priority || null
        }))
      }));
      
      userData.projects[projectIndex].content = JSON.stringify(boardData);
      localStorage.setItem('currentUser', JSON.stringify(userData));

      // Also update in users array
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      const userIndex = users.findIndex(u => u.id === userData.id);
      if (userIndex !== -1) {
        users[userIndex] = userData;
        localStorage.setItem('users', JSON.stringify(users));
      }

      showNotification('Board gespeichert');
    }
  } catch (error) {
    console.error('Error saving board:', error);
    showNotification('Fehler beim Speichern', 'error');
  }
}

// Render the entire board
function renderBoard() {
  const board = document.getElementById('board');
  board.innerHTML = '';
  
  boardData.columns.forEach(column => {
    const columnEl = createColumn(column);
    board.appendChild(columnEl);
  });
}

// Create a new column
function createColumn(columnData = null) {
  const template = document.getElementById('column-template');
  const column = template.content.cloneNode(true).children[0];
  
  const columnId = columnData?.id || uuid.v4();
  column.dataset.columnId = columnId;
  
  const title = column.querySelector('h3');
  title.textContent = columnData?.title || 'Neue Spalte';
  title.addEventListener('blur', saveBoard);
  
  const container = column.querySelector('.cards-container');
  if (columnData?.cards) {
    columnData.cards.forEach(cardData => {
      container.appendChild(createCard(cardData));
    });
  }
  
  // Add column settings button
  const settingsBtn = column.querySelector('.column-settings');
  settingsBtn.addEventListener('click', () => showColumnSettings(column));
  
  return column;
}

// Show column settings
function showColumnSettings(column) {
  const dialog = document.createElement('div');
  dialog.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
  dialog.innerHTML = `
    <div class="bg-white rounded-lg p-6 w-96">
      <h3 class="text-lg font-bold mb-4">Spalteneinstellungen</h3>
      <div class="mb-4">
        <label class="block text-sm font-medium text-gray-700 mb-1">Spaltenfarbe</label>
        <div class="grid grid-cols-6 gap-2" id="color-options">
          ${['bg-gray-200', 'bg-blue-100', 'bg-green-100', 'bg-yellow-100', 'bg-red-100', 'bg-purple-100']
            .map(color => `
              <div class="w-8 h-8 rounded cursor-pointer ${color} ${column.dataset.color === color ? 'ring-2 ring-offset-2 ring-blue-500' : ''}"
                   onclick="editColumnColor('${column.dataset.columnId}', '${color}')"></div>
            `).join('')}
        </div>
      </div>
      <div class="flex justify-end gap-2">
        <button class="px-4 py-2 text-gray-600 hover:text-gray-800" onclick="this.closest('.fixed').remove()">
          Abbrechen
        </button>
        <button class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700" 
                onclick="saveColumnSettings('${column.dataset.columnId}', this)">
          Speichern
        </button>
      </div>
    </div>
  `;
  
  document.body.appendChild(dialog);
}

// Edit column color
function editColumnColor(columnId, color) {
  const column = document.querySelector(`[data-column-id="${columnId}"]`);
  const oldColor = column.dataset.color || 'bg-gray-200';
  column.className = column.className.replace(oldColor, color);
  column.dataset.color = color;
  
  // Update color picker selection
  const colorOptions = document.querySelectorAll('#color-options > div');
  colorOptions.forEach(option => {
    option.classList.remove('ring-2', 'ring-offset-2', 'ring-blue-500');
    if (option.classList.contains(color)) {
      option.classList.add('ring-2', 'ring-offset-2', 'ring-blue-500');
    }
  });
}

// Save column settings
function saveColumnSettings(columnId, button) {
  const column = document.querySelector(`[data-column-id="${columnId}"]`);
  
  saveBoard();
  button.closest('.fixed').remove();
  showNotification('Spalteneinstellungen gespeichert');
}

// Create a new card
function createCard(cardData = null) {
  const template = document.getElementById('card-template');
  const card = template.content.cloneNode(true).children[0];
  
  const cardId = cardData?.id || uuid.v4();
  card.dataset.cardId = cardId;
  
  const textEl = card.querySelector('.card-text');
  textEl.textContent = cardData?.text || 'Neue Karte';
  
  if (cardData?.image) {
    const imageContainer = card.querySelector('.card-image-container');
    const image = card.querySelector('.card-image');
    imageContainer.classList.remove('hidden');
    image.src = cardData.image;
  }

  // Set priority if exists
  if (cardData?.priority) {
    setPriority(card, cardData.priority, false);
  }
  
  // Add card menu event listener
  const menuBtn = card.querySelector('.card-menu');
  menuBtn.addEventListener('click', (e) => showCardMenu(e, card));
  
  return card;
}

// Show card menu
function showCardMenu(event, card) {
  event.stopPropagation();
  
  const menu = document.createElement('div');
  menu.className = 'absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50';
  menu.innerHTML = `
    <div class="py-1">
      <button onclick="editCard('${card.dataset.cardId}')" class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
        Bearbeiten
      </button>
      <button onclick="addCardImage('${card.dataset.cardId}')" class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
        Bild hinzufügen
      </button>
      <hr class="my-1">
      <div class="px-4 py-2 text-sm text-gray-700">
        Priorität:
        <div class="ml-2 mt-1 space-y-1">
          <button onclick="setPriorityById('${card.dataset.cardId}', 'high')" class="w-full text-left px-2 py-1 hover:bg-gray-100 rounded flex items-center">
            <span class="w-3 h-3 rounded-full bg-red-500 mr-2"></span>
            Hoch
          </button>
          <button onclick="setPriorityById('${card.dataset.cardId}', 'medium')" class="w-full text-left px-2 py-1 hover:bg-gray-100 rounded flex items-center">
            <span class="w-3 h-3 rounded-full bg-yellow-500 mr-2"></span>
            Mittel
          </button>
          <button onclick="setPriorityById('${card.dataset.cardId}', 'low')" class="w-full text-left px-2 py-1 hover:bg-gray-100 rounded flex items-center">
            <span class="w-3 h-3 rounded-full bg-green-500 mr-2"></span>
            Niedrig
          </button>
          <button onclick="setPriorityById('${card.dataset.cardId}', '')" class="w-full text-left px-2 py-1 hover:bg-gray-100 rounded flex items-center">
            <span class="w-3 h-3 rounded-full bg-gray-200 mr-2"></span>
            Keine
          </button>
        </div>
      </div>
      <hr class="my-1">
      <button onclick="deleteCard('${card.dataset.cardId}')" class="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50">
        Löschen
      </button>
    </div>
  `;
  
  // Position the menu
  const rect = event.target.getBoundingClientRect();
  menu.style.position = 'fixed';
  menu.style.top = `${rect.bottom + 5}px`;
  menu.style.left = `${rect.left}px`;
  
  // Close menu when clicking outside
  const closeMenu = (e) => {
    if (!menu.contains(e.target)) {
      menu.remove();
      document.removeEventListener('click', closeMenu);
    }
  };
  document.addEventListener('click', closeMenu);
  
  document.body.appendChild(menu);
}

// Edit a card
function editCard(cardId) {
  const card = document.querySelector(`[data-card-id="${cardId}"]`);
  if (!card) return;
  
  const textEl = card.querySelector('.card-text');
  const newText = prompt('Kartentext bearbeiten:', textEl.textContent);
  if (newText && newText.trim()) {
    textEl.textContent = newText.trim();
    saveBoard();
  }
}

// Add image to card
function addCardImage(cardId) {
  const card = document.querySelector(`[data-card-id="${cardId}"]`);
  if (!card) return;
  
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  
  input.onchange = function() {
    const file = this.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function(e) {
        const imageContainer = card.querySelector('.card-image-container');
        const image = card.querySelector('.card-image');
        imageContainer.classList.remove('hidden');
        image.src = e.target.result;
        saveBoard();
      };
      reader.readAsDataURL(file);
    }
  };
  
  input.click();
}

// Delete a card
function deleteCard(cardId) {
  const card = document.querySelector(`[data-card-id="${cardId}"]`);
  if (!card || !confirm('Möchten Sie diese Karte wirklich löschen?')) return;
  
  card.remove();
  saveBoard();
}

// Add a new column
function addColumn() {
  const column = createColumn();
  document.getElementById('board').appendChild(column);
  initDragula(); // Reinitialize dragula with new container
  saveBoard();
}

// Add a new card
function addCard(button) {
  const text = prompt('Kartentext eingeben:');
  if (!text || !text.trim()) return;
  
  const column = button.closest('.kanban-column');
  const container = column.querySelector('.cards-container');
  const card = createCard({ text: text.trim() });
  container.appendChild(card);
  saveBoard();
}

// Delete a column
function deleteColumn(button) {
  if (!confirm('Möchten Sie diese Spalte wirklich löschen?')) return;
  
  const column = button.closest('.kanban-column');
  column.remove();
  saveBoard();
}

// Create a label element
function createLabel(text, color) {
  const label = document.createElement('span');
  label.className = `card-label ${color} px-2 py-0.5 rounded-full text-sm inline-block mr-1 mb-1`;
  label.textContent = text;
  label.dataset.color = color;
  return label;
}

// Set priority by card ID
function setPriorityById(cardId, priority) {
  const card = document.querySelector(`[data-card-id="${cardId}"]`);
  if (!card) return;
  setPriority(card, priority);
}

// Set priority for a card
function setPriority(card, priority, save = true) {
  // Remove existing priority classes
  card.classList.remove('priority-high', 'priority-medium', 'priority-low');
  
  // Add new priority class if priority is set
  if (priority) {
    card.classList.add(`priority-${priority}`);
  }
  
  // Store priority in dataset
  card.dataset.priority = priority;

  if (save) {
    saveBoard();
    showNotification(`Priorität auf ${priority || 'keine'} gesetzt`);
  }
}

// Initialize on page load
window.addEventListener('DOMContentLoaded', loadBoard); 