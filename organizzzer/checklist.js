let checklistData = {
  id: '',
  title: '',
  categories: [],
  items: []
};

// Load checklist data from localStorage
function loadChecklist() {
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
    
    if (!project || project.type !== 'Checkliste') {
      window.location.href = 'index.html';
      return;
    }
    
    checklistData = JSON.parse(project.content);
    document.getElementById('checklist-title').textContent = project.title;
    
    // Make sure categories are initialized
    if (!checklistData.categories) {
      checklistData.categories = [
        { id: uuid.v4(), name: 'Allgemein' }
      ];
    }
    
    // Render both categories and items
    renderCategories();
    renderItems();
  } catch (error) {
    console.error('Error loading checklist:', error);
    showNotification('Fehler beim Laden der Checkliste', 'error');
  }
}

// Save checklist data to localStorage
function saveChecklist() {
  try {
    // Get current user data from localStorage
    const userData = JSON.parse(localStorage.getItem('currentUser'));
    if (!userData || !userData.projects) {
      showNotification('Fehler: Keine Benutzerdaten gefunden', 'error');
      return;
    }

    // Find project in user's projects
    const projectIndex = userData.projects.findIndex(p => p.id === checklistData.id);
    
    if (projectIndex !== -1) {
      userData.projects[projectIndex].content = JSON.stringify(checklistData);
      localStorage.setItem('currentUser', JSON.stringify(userData));

      // Also update in users array
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      const userIndex = users.findIndex(u => u.id === userData.id);
      if (userIndex !== -1) {
        users[userIndex] = userData;
        localStorage.setItem('users', JSON.stringify(users));
      }

      showNotification('Checkliste gespeichert');
    }
  } catch (error) {
    console.error('Error saving checklist:', error);
    showNotification('Fehler beim Speichern', 'error');
  }
}

// Render categories
function renderCategories() {
  console.log('Rendering categories:', checklistData.categories); // Debug log
  
  const container = document.getElementById('categories-container');
  const select = document.getElementById('category-select');
  
  if (!container || !select) {
    console.error('Category container or select not found');
    return;
  }
  
  container.innerHTML = '';
  select.innerHTML = '<option value="">Kategorie auswählen...</option>';
  
  if (checklistData.categories && checklistData.categories.length > 0) {
    checklistData.categories.forEach(category => {
      // Add category tag
      const tag = document.createElement('span');
      tag.className = 'category-tag px-4 py-2 rounded-full text-sm font-medium bg-indigo-100 text-indigo-700 hover:bg-indigo-200 transition-colors duration-200';
      tag.textContent = category.name;
      container.appendChild(tag);
      
      // Add category to select
      const option = document.createElement('option');
      option.value = category.id;
      option.textContent = category.name;
      select.appendChild(option);
    });
  } else {
    console.log('No categories found');
  }
}

// Render checklist items
function renderItems() {
  const container = document.getElementById('checklist-items');
  container.innerHTML = '';
  
  checklistData.items.forEach(item => {
    const itemElement = createItemElement(item);
    container.appendChild(itemElement);
  });
}

// Create a checklist item element
function createItemElement(item) {
  const div = document.createElement('div');
  div.className = `checklist-item flex items-center gap-4 p-3 bg-gray-50 rounded-lg ${item.completed ? 'completed' : ''} ${item.new ? 'new' : ''}`;
  div.dataset.itemId = item.id;
  
  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.checked = item.completed;
  checkbox.className = 'w-5 h-5 text-blue-600 rounded focus:ring-blue-500';
  checkbox.onchange = () => toggleItem(item.id);
  
  const textDiv = document.createElement('div');
  textDiv.className = 'flex-1';
  
  const text = document.createElement('span');
  text.className = 'text';
  text.textContent = item.text;
  
  const metadata = document.createElement('div');
  metadata.className = 'flex items-center gap-2 mt-1';
  
  if (item.category) {
    const category = checklistData.categories.find(c => c.id === item.category);
    if (category) {
      const categoryTag = document.createElement('span');
      categoryTag.className = 'text-xs text-gray-500';
      categoryTag.textContent = category.name;
      metadata.appendChild(categoryTag);
    }
  }
  
  const priorityBadge = document.createElement('span');
  priorityBadge.className = `priority-badge text-xs px-2 py-0.5 rounded-full priority-${item.priority || 'low'}`;
  priorityBadge.textContent = {
    high: 'Hoch',
    medium: 'Mittel',
    low: 'Niedrig'
  }[item.priority || 'low'];
  metadata.appendChild(priorityBadge);
  
  textDiv.appendChild(text);
  textDiv.appendChild(metadata);
  
  const deleteButton = document.createElement('button');
  deleteButton.className = 'text-red-500 hover:text-red-700';
  deleteButton.innerHTML = '✕';
  deleteButton.onclick = () => deleteItem(item.id);
  
  div.appendChild(checkbox);
  div.appendChild(textDiv);
  div.appendChild(deleteButton);
  
  return div;
}

// Add a new category
function addCategory() {
  const name = prompt('Name der neuen Kategorie:');
  if (!name || !name.trim()) return;
  
  // Initialize categories array if it doesn't exist
  if (!checklistData.categories) {
    checklistData.categories = [];
  }
  
  const category = {
    id: uuid.v4(),
    name: name.trim()
  };
  
  // Add the new category
  checklistData.categories.push(category);
  
  // Save changes
  saveChecklist();
  
  // Re-render categories
  renderCategories();
  
  // Show confirmation
  showNotification(`Kategorie "${category.name}" wurde erstellt`);
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

// Add a new item
function addItem() {
  const input = document.getElementById('new-item');
  const text = input.value.trim();
  if (!text) return;
  
  const priority = document.getElementById('priority-select').value;
  const category = document.getElementById('category-select').value;
  
  const item = {
    id: uuid.v4(),
    text,
    completed: false,
    priority,
    category: category || null,
    new: true
  };
  
  checklistData.items.push(item);
  saveChecklist();
  
  const itemElement = createItemElement(item);
  document.getElementById('checklist-items').appendChild(itemElement);
  
  input.value = '';
  
  // Remove new animation class after animation completes
  setTimeout(() => {
    item.new = false;
    saveChecklist();
  }, 500);
}

// Toggle item completion
function toggleItem(id) {
  const item = checklistData.items.find(i => i.id === id);
  if (!item) return;
  
  item.completed = !item.completed;
  saveChecklist();
  
  const itemElement = document.querySelector(`[data-item-id="${id}"]`);
  if (item.completed) {
    itemElement.classList.add('completed');
    // Move completed items to the bottom after animation
    setTimeout(() => {
      const container = document.getElementById('checklist-items');
      container.appendChild(itemElement);
    }, 500);
  } else {
    itemElement.classList.remove('completed');
  }
}

// Delete an item
function deleteItem(id) {
  if (!confirm('Möchten Sie diese Aufgabe wirklich löschen?')) return;
  
  const itemElement = document.querySelector(`[data-item-id="${id}"]`);
  if (itemElement) {
    itemElement.style.animation = 'fadeOut 0.3s ease forwards';
    setTimeout(() => {
      checklistData.items = checklistData.items.filter(i => i.id !== id);
      saveChecklist();
      itemElement.remove();
    }, 300);
  }
}

// Handle enter key in new item input
document.getElementById('new-item').addEventListener('keypress', function(e) {
  if (e.key === 'Enter') {
    addItem();
  }
});

// Initialize on page load
window.onload = loadChecklist; 