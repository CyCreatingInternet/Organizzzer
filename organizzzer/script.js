// User authentication state
let currentUser = null;
let users = [];
let folders = [];
let projects = [];
let currentFolderId = 'root';
let currentFolderPath = [];
let activeProjectId = null;

// Debug function
function debugLog(message, data) {
  console.log(`[DEBUG] ${message}`, data || '');
}

// Load stored data on script load
debugLog('Starting initial data load');
try {
  // Load users list
  const storedUsers = localStorage.getItem('users');
  debugLog('Stored users from localStorage:', storedUsers);
  if (storedUsers) {
    users = JSON.parse(storedUsers);
    debugLog('Parsed users:', users);
  }
  
  // Try to load stored user
  const storedUser = localStorage.getItem('currentUser');
  debugLog('Stored current user from localStorage:', storedUser);
  if (storedUser) {
    const parsedUser = JSON.parse(storedUser);
    debugLog('Parsed current user:', parsedUser);
    const foundUser = users.find(u => u.id === parsedUser.id);
    if (foundUser) {
      currentUser = foundUser;
      folders = foundUser.folders || [];
      projects = foundUser.projects || [];
      debugLog('Successfully restored user session:', currentUser);
    } else {
      debugLog('User not found in users array');
      localStorage.removeItem('currentUser');
    }
  }
} catch (e) {
  console.error('Error loading stored data:', e);
  localStorage.removeItem('currentUser');
  currentUser = null;
}

// Authentication functions
function initAuth() {
  // Check if user is stored in localStorage
  const storedUser = localStorage.getItem('currentUser');
  if (storedUser) {
    try {
      currentUser = JSON.parse(storedUser);
      loadUserData();
    } catch (e) {
      console.error('Error loading stored user:', e);
      localStorage.removeItem('currentUser');
      showAuthModal();
    }
  } else {
    showAuthModal();
  }
}

function showAuthModal() {
  debugLog('Showing auth modal');
  // Don't show auth modal if user is already logged in
  if (currentUser) {
    debugLog('User is logged in, not showing auth modal');
    return;
  }
  document.getElementById('auth-modal').style.display = 'flex';
}

function hideAuthModal() {
  debugLog('Hiding auth modal');
  document.getElementById('auth-modal').style.display = 'none';
}

function toggleAuthMode() {
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');
  const authTitle = document.getElementById('auth-title');
  const authSubtitle = document.getElementById('auth-subtitle');
  const toggleButton = document.getElementById('toggle-auth-mode');

  if (loginForm.classList.contains('hidden')) {
    // Switch to login
    loginForm.classList.remove('hidden');
    registerForm.classList.add('hidden');
    authTitle.textContent = 'Anmelden';
    authSubtitle.textContent = 'Melde dich an, um deine Projekte zu verwalten';
    toggleButton.textContent = 'Noch kein Konto? Jetzt registrieren';
  } else {
    // Switch to register
    loginForm.classList.add('hidden');
    registerForm.classList.remove('hidden');
    authTitle.textContent = 'Registrieren';
    authSubtitle.textContent = 'Erstelle ein Konto, um deine Projekte zu verwalten';
    toggleButton.textContent = 'Bereits registriert? Jetzt anmelden';
  }
}

function handleLogin(e) {
  e.preventDefault();
  debugLog('Login attempt');
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;
  const stayLoggedIn = document.getElementById('stay-logged-in').checked;
  debugLog('Stay logged in:', stayLoggedIn);

  const user = users.find(u => u.email === email && u.password === password);
  if (user) {
    debugLog('User found, logging in:', user);
    currentUser = user;
    folders = user.folders || [];
    projects = user.projects || [];
    
    if (stayLoggedIn) {
      debugLog('Saving user to localStorage');
      localStorage.setItem('currentUser', JSON.stringify(user));
      localStorage.setItem('users', JSON.stringify(users));
    }
    
    hideAuthModal();
    renderCurrentFolder();
    showNotification('Erfolgreich angemeldet!', 'success');
  } else {
    debugLog('Login failed - user not found');
    showNotification('Ungültige E-Mail oder Passwort', 'error');
  }
}

function handleRegister(e) {
  e.preventDefault();
  const name = document.getElementById('register-name').value;
  const email = document.getElementById('register-email').value;
  const password = document.getElementById('register-password').value;

  if (users.some(u => u.email === email)) {
    showNotification('Diese E-Mail ist bereits registriert', 'error');
    return;
  }

  const newUser = {
    id: uuid.v4(),
    name,
    email,
    password,
    folders: [],
    projects: []
  };

  users.push(newUser);
  localStorage.setItem('users', JSON.stringify(users));
  
  // Auto-login after registration
  currentUser = newUser;
  folders = [];
  projects = [];
  localStorage.setItem('currentUser', JSON.stringify(newUser));
  
  hideAuthModal();
  renderCurrentFolder();
  showNotification('Registrierung erfolgreich!', 'success');
}

function logout() {
  debugLog('Logging out');
  currentUser = null;
  localStorage.removeItem('currentUser');
  folders = [];
  projects = [];
  showAuthModal();
  renderCurrentFolder();
}

function loadUserData() {
  if (currentUser) {
    // Get the most up-to-date user data from users array
    const updatedUser = users.find(u => u.id === currentUser.id);
    if (updatedUser) {
      currentUser = updatedUser;
      folders = currentUser.folders || [];
      projects = currentUser.projects || [];
      renderCurrentFolder();
    } else {
      // If user no longer exists in users array, log them out
      logout();
    }
  }
}

function saveUserData() {
  if (currentUser) {
    debugLog('Saving user data');
    // Update the current user's data
    currentUser.folders = folders;
    currentUser.projects = projects;
    
    // Update user in users array
    const userIndex = users.findIndex(u => u.id === currentUser.id);
    if (userIndex !== -1) {
      users[userIndex] = currentUser;
      debugLog('Updated user in users array');
    }
    
    // Save everything to localStorage
    localStorage.setItem('users', JSON.stringify(users));
    const hasStoredUser = localStorage.getItem('currentUser');
    if (hasStoredUser) {
      debugLog('Updating stored user data');
      localStorage.setItem('currentUser', JSON.stringify(currentUser));
    }
  }
}

// Project type specific templates
const projectTemplates = {
  Kanban: {
    content: JSON.stringify({
      id: '',
      title: '',
      columns: [
        { 
          id: uuid.v4(), 
          title: 'To Do', 
          cards: []
        },
        { 
          id: uuid.v4(), 
          title: 'In Progress', 
          cards: []
        },
        { 
          id: uuid.v4(), 
          title: 'Done', 
          cards: []
        }
      ]
    })
  },
  Mindmap: {
    content: JSON.stringify({
      id: '',
      title: '',
      nodes: [{
        id: uuid.v4(),
        label: 'Hauptthema',
        color: { background: '#DBEAFE', border: '#3B82F6' }
      }],
      edges: []
    })
  },
  Checkliste: {
    content: JSON.stringify({
      id: '',
      title: '',
      categories: [
        { id: uuid.v4(), name: 'Allgemein' }
      ],
      items: []
    })
  },
  Notizen: {
    content: JSON.stringify({
      ops: [
        { insert: 'Beginne hier mit dem Schreiben...\n' }
      ]
    })
  }
};

// Initialize page
window.addEventListener('DOMContentLoaded', () => {
  debugLog('Page initialized');
  // Set up auth event listeners
  document.getElementById('login-form').addEventListener('submit', handleLogin);
  document.getElementById('register-form').addEventListener('submit', handleRegister);
  document.getElementById('toggle-auth-mode').addEventListener('click', toggleAuthMode);
  
  // Check login state and initialize UI
  if (currentUser) {
    debugLog('User already logged in, initializing UI');
    hideAuthModal();
    renderCurrentFolder();
  } else {
    debugLog('No user logged in, showing auth modal');
    showAuthModal();
  }
  
  // Existing event listener
  document.addEventListener('click', (e) => {
    if (!e.target.closest('#new-project-dropdown')) {
      hideNewProjectMenu();
    }
  });
});

// Navigation functions
function navigateToFolder(folderId) {
  currentFolderId = folderId;
  updateBreadcrumb();
  renderCurrentFolder();
}

function updateBreadcrumb() {
  const path = [];
  let currentFolder = folders.find(f => f.id === currentFolderId);
  
  while (currentFolder) {
    path.unshift(currentFolder);
    currentFolder = folders.find(f => f.id === currentFolder.parentId);
  }
  
  currentFolderPath = path;
  
  const breadcrumb = document.getElementById('breadcrumb-path');
  breadcrumb.innerHTML = path.map(folder => `
    <div class="breadcrumb-item">
      <span class="breadcrumb-separator">/</span>
      <button onclick="navigateToFolder('${folder.id}')" class="text-indigo-600 hover:text-indigo-800">
        ${folder.name}
      </button>
    </div>
  `).join('');
}

// Folder functions
function showCreateFolderDialog() {
  document.getElementById('create-folder-dialog').classList.remove('hidden');
  document.getElementById('folder-name-input').focus();
}

function hideCreateFolderDialog() {
  document.getElementById('create-folder-dialog').classList.add('hidden');
  document.getElementById('folder-name-input').value = '';
}

function createFolder() {
  const nameInput = document.getElementById('folder-name-input');
  const name = nameInput.value.trim();
  
  if (!name) return;
  
  const newFolder = {
    id: uuid.v4(),
    name: name,
    parentId: currentFolderId,
    createdAt: new Date().toISOString()
  };
  
  folders.push(newFolder);
  saveFolders();
  hideCreateFolderDialog();
  renderCurrentFolder();
}

// Project functions
function toggleNewProjectMenu() {
  const menu = document.getElementById('project-type-menu');
  menu.classList.toggle('hidden');
}

function hideNewProjectMenu() {
  document.getElementById('project-type-menu').classList.add('hidden');
}

function createProject(type) {
  const title = prompt(`Name für dein neues ${type}-Projekt:`);
  if (!title || !title.trim()) return;
  
  const id = uuid.v4();
  const content = JSON.parse(projectTemplates[type].content);
  content.id = id;
  content.title = title.trim();
  
  const project = {
    id,
    title: title.trim(),
    type,
    folderId: currentFolderId,
    content: JSON.stringify(content),
    createdAt: new Date().toISOString()
  };
  
  projects.push(project);
  saveProjects();
  hideNewProjectMenu();
  renderCurrentFolder();
}

function renderCurrentFolder() {
  const foldersContainer = document.getElementById('folders-container');
  const projectsContainer = document.getElementById('projects-container');
  
  // Render subfolders
  const subfolders = folders.filter(f => f.parentId === currentFolderId);
  foldersContainer.innerHTML = subfolders.map(folder => `
    <div class="folder-card bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
      <div class="flex justify-between items-start mb-4">
        <div>
          <h3 class="text-2xl font-bold mb-2 text-indigo-800">📁 ${folder.name}</h3>
          <p class="text-sm text-gray-600">Ordner</p>
        </div>
        <button onclick="deleteFolder('${folder.id}')" class="text-red-500 hover:text-red-700 p-1" title="Ordner löschen">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
      <button onclick="navigateToFolder('${folder.id}')" class="w-full bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors">
        Öffnen
      </button>
    </div>
  `).join('');
  
  // Render projects
  const folderProjects = projects.filter(p => p.folderId === currentFolderId);
  projectsContainer.innerHTML = folderProjects.map(project => `
    <div class="project-card bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
      <div class="flex justify-between items-start mb-4">
        <div>
          <h3 class="text-2xl font-bold mb-2 text-indigo-800">${project.title}</h3>
          <p class="text-sm text-gray-600">Typ: ${project.type}</p>
        </div>
        <button onclick="deleteProject('${project.id}')" class="text-red-500 hover:text-red-700 p-1" title="Projekt löschen">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
      <button onclick="openProject('${project.id}')" class="w-full bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors">
        Öffnen
      </button>
    </div>
  `).join('');
}

function openProject(id) {
  const project = projects.find(p => p.id === id);
  if (!project) return;
  
  // Parse and update content if needed
  let content;
  try {
    content = JSON.parse(project.content);
    if (!content.id) {
      content.id = project.id;
      content.title = project.title;
      project.content = JSON.stringify(content);
      saveProjects();
    }
  } catch (e) {
    console.error('Error parsing project content:', e);
    return;
  }
  
  const pages = {
    Kanban: 'kanban.html',
    Mindmap: 'mindmap.html',
    Checkliste: 'checklist.html',
    Notizen: 'notes.html'
  };
  
  // Einfach nur die Projekt-ID übergeben
  window.location.href = `${pages[project.type]}?id=${id}`;
}

function renderKanbanBoard(project, container) {
  const data = JSON.parse(project.content);
  const board = document.createElement('div');
  board.className = 'flex gap-4 overflow-x-auto p-4';
  
  data.columns.forEach(column => {
    const columnEl = document.createElement('div');
    columnEl.className = 'kanban-column bg-gray-200 rounded-xl p-4';
    columnEl.innerHTML = `
      <div class="flex justify-between items-center mb-4">
        <h3 class="font-bold">${column.title}</h3>
        <div class="flex gap-2">
          <button onclick="editColumnTitle('${column.id}')" class="text-gray-500 hover:text-gray-700">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button onclick="deleteColumn(this)" class="text-red-500 hover:text-red-700">✕</button>
        </div>
      </div>
      <div class="kanban-cards space-y-3" data-column-id="${column.id}">
        ${column.cards.map(card => `
          <div class="card bg-white rounded-lg shadow p-3 group" draggable="true" data-card-id="${card.id}">
            <div class="card-image-container ${card.image ? '' : 'hidden'} mb-2">
              <img src="${card.image || ''}" alt="Card image" class="card-image w-full rounded-lg max-h-48 object-cover">
            </div>
            <div class="card-labels flex flex-wrap gap-1 mb-2"></div>
            <div class="flex justify-between items-start">
              <div class="card-text flex-1 break-words">${card.text}</div>
              <div class="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button class="card-menu text-gray-500 hover:text-gray-700">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                  </svg>
                </button>
              </div>
            </div>
            <div class="due-date text-sm text-gray-500 mt-2"></div>
          </div>
        `).join('')}
      </div>
      <button onclick="addCard('${column.id}')" class="mt-4 w-full bg-white hover:bg-gray-50 text-gray-700 px-3 py-2 rounded shadow-sm">
        + Karte hinzufügen
      </button>
    `;
    board.appendChild(columnEl);
  });
  
  container.appendChild(board);
  setupKanbanDragAndDrop();
}

function renderMindmap(project, container) {
  const data = JSON.parse(project.content);
  container.innerHTML = `
    <div class="mindmap-container p-4">
      ${renderMindmapNode(data.nodes[0])}
    </div>
  `;
}

function renderMindmapNode(node) {
  return `
    <div class="mindmap-node" data-node-id="${node.id}">
      <div class="flex justify-between items-center group">
        <div class="flex items-center gap-2">
          <span class="break-words">${node.text}</span>
          <div class="opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
            <button onclick="editMindmapNode('${node.id}')" class="text-gray-500 hover:text-gray-700" title="Bearbeiten">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            ${node.children?.length === 0 ? `
              <button onclick="deleteMindmapNode('${node.id}')" class="text-red-500 hover:text-red-700" title="Löschen">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            ` : ''}
          </div>
        </div>
        <button onclick="addMindmapChild('${node.id}')" class="text-blue-600 hover:text-blue-800 flex items-center gap-1" title="Kind hinzufügen">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>
      <div class="ml-8 border-l-2 border-gray-200 pl-4 mt-2">
        ${(node.children || []).map(child => renderMindmapNode(child)).join('')}
      </div>
    </div>
  `;
}

function renderChecklist(project, container) {
  const data = JSON.parse(project.content);
  container.innerHTML = `
    <div class="checklist-container p-4">
      <div class="mb-4">
        <input type="text" id="new-item" placeholder="Neue Aufgabe..." 
               class="w-full p-2 border rounded">
        <button onclick="addChecklistItem()" class="mt-2 bg-blue-600 text-white px-4 py-2 rounded">
          Hinzufügen
        </button>
      </div>
      <div class="checklist-items">
        ${data.items.map(item => `
          <div class="checklist-item flex items-center p-2" data-item-id="${item.id}">
            <input type="checkbox" ${item.done ? 'checked' : ''} 
                   onchange="toggleChecklistItem('${item.id}')"
                   class="mr-3">
            <span class="${item.done ? 'line-through text-gray-500' : ''}">${item.text}</span>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function renderNotes(project, container) {
  container.innerHTML = `
    <div class="notes-container p-4">
      <div class="notes-editor" contenteditable="true">
        ${project.content || 'Beginne hier mit dem Schreiben...'}
      </div>
    </div>
  `;
  
  const editor = container.querySelector('.notes-editor');
  editor.addEventListener('input', () => {
    const project = projects.find(p => p.id === activeProjectId);
    if (project) {
      project.content = editor.innerHTML;
      saveProjects();
    }
  });
}

function addCard(columnId) {
  const text = prompt('Kartentext eingeben:');
  if (!text) return;
  
  const project = projects.find(p => p.id === activeProjectId);
  if (!project) return;
  
  const data = JSON.parse(project.content);
  const column = data.columns.find(col => col.id === columnId);
  if (column) {
    column.cards.push({ 
      id: uuid.v4(), 
      text,
      image: null
    });
    project.content = JSON.stringify(data);
    saveProjects();
    openProject(activeProjectId);
  }
}

function editCard(cardId) {
  const project = projects.find(p => p.id === activeProjectId);
  if (!project) return;
  
  const data = JSON.parse(project.content);
  let cardFound = false;
  
  data.columns.forEach(column => {
    const card = column.cards.find(c => c.id === cardId);
    if (card) {
      const newText = prompt('Kartentext bearbeiten:', card.text);
      if (newText && newText.trim()) {
        card.text = newText.trim();
        cardFound = true;
      }
    }
  });
  
  if (cardFound) {
    project.content = JSON.stringify(data);
    saveProjects();
    openProject(activeProjectId);
  }
}

function addCardImage(cardId) {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  
  input.onchange = function() {
    const file = this.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function(e) {
        const project = projects.find(p => p.id === activeProjectId);
        if (!project) return;
        
        const data = JSON.parse(project.content);
        data.columns.forEach(column => {
          const card = column.cards.find(c => c.id === cardId);
          if (card) {
            card.image = e.target.result;
            project.content = JSON.stringify(data);
            saveProjects();
            openProject(activeProjectId);
          }
        });
      };
      reader.readAsDataURL(file);
    }
  };
  
  input.click();
}

function deleteCard(cardId) {
  if (!confirm('Möchtest du diese Karte wirklich löschen?')) return;
  
  const project = projects.find(p => p.id === activeProjectId);
  if (!project) return;
  
  const data = JSON.parse(project.content);
  let cardDeleted = false;
  
  data.columns.forEach(column => {
    const cardIndex = column.cards.findIndex(c => c.id === cardId);
    if (cardIndex !== -1) {
      column.cards.splice(cardIndex, 1);
      cardDeleted = true;
    }
  });
  
  if (cardDeleted) {
    project.content = JSON.stringify(data);
    saveProjects();
    openProject(activeProjectId);
  }
}

function editColumnTitle(columnId) {
  const project = projects.find(p => p.id === activeProjectId);
  if (!project) return;
  
  const data = JSON.parse(project.content);
  const column = data.columns.find(col => col.id === columnId);
  
  if (column) {
    const newTitle = prompt('Spaltentitel bearbeiten:', column.title);
    if (newTitle && newTitle.trim()) {
      column.title = newTitle.trim();
      project.content = JSON.stringify(data);
      saveProjects();
      openProject(activeProjectId);
    }
  }
}

function setupKanbanDragAndDrop() {
  const cards = document.querySelectorAll('.kanban-card');
  const columns = document.querySelectorAll('.kanban-cards');
  
  cards.forEach(card => {
    card.addEventListener('dragstart', () => {
      card.classList.add('dragging');
    });
    
    card.addEventListener('dragend', () => {
      card.classList.remove('dragging');
      updateKanbanState();
    });
  });
  
  columns.forEach(column => {
    column.addEventListener('dragover', e => {
      e.preventDefault();
      const draggingCard = document.querySelector('.dragging');
      if (draggingCard) {
        const afterElement = getDragAfterElement(column, e.clientY);
        if (afterElement) {
          column.insertBefore(draggingCard, afterElement);
        } else {
          column.appendChild(draggingCard);
        }
      }
    });
  });
}

function getDragAfterElement(container, y) {
  const draggableElements = [...container.querySelectorAll('.kanban-card:not(.dragging)')];
  
  return draggableElements.reduce((closest, child) => {
    const box = child.getBoundingClientRect();
    const offset = y - box.top - box.height / 2;
    
    if (offset < 0 && offset > closest.offset) {
      return { offset: offset, element: child };
    } else {
      return closest;
    }
  }, { offset: Number.NEGATIVE_INFINITY }).element;
}

function updateKanbanState() {
  const project = projects.find(p => p.id === activeProjectId);
  if (!project) return;
  
  const data = JSON.parse(project.content);
  const columns = document.querySelectorAll('.kanban-cards');
  
  data.columns.forEach((column, i) => {
    const columnEl = columns[i];
    column.cards = [...columnEl.querySelectorAll('.kanban-card')].map(card => ({
      id: card.dataset.cardId,
      text: card.querySelector('.flex-1').textContent.trim(),
      image: card.querySelector('.card-image')?.src || null
    }));
  });
  
  project.content = JSON.stringify(data);
  saveProjects();
}

function addMindmapChild(parentId) {
  const text = prompt('Text für neuen Knoten:');
  if (!text) return;
  
  const project = projects.find(p => p.id === activeProjectId);
  if (!project) return;
  
  const data = JSON.parse(project.content);
  
  function addChild(node) {
    if (node.id === parentId) {
      if (!node.children) node.children = [];
      node.children.push({ id: uuid.v4(), text, children: [] });
      return true;
    }
    return node.children?.some(addChild) || false;
  }
  
  addChild(data.nodes[0]);
  project.content = JSON.stringify(data);
  saveProjects();
  openProject(activeProjectId);
}

function editMindmapNode(nodeId) {
  const project = projects.find(p => p.id === activeProjectId);
  if (!project) return;
  
  const data = JSON.parse(project.content);
  let nodeFound = false;
  
  function editNode(node) {
    if (node.id === nodeId) {
      const newText = prompt('Text bearbeiten:', node.text);
      if (newText && newText.trim()) {
        node.text = newText.trim();
        nodeFound = true;
      }
      return true;
    }
    return node.children?.some(editNode) || false;
  }
  
  editNode(data.nodes[0]);
  
  if (nodeFound) {
    project.content = JSON.stringify(data);
    saveProjects();
    openProject(activeProjectId);
  }
}

function deleteMindmapNode(nodeId) {
  if (!confirm('Möchtest du diesen Knoten wirklich löschen?')) return;
  
  const project = projects.find(p => p.id === activeProjectId);
  if (!project) return;
  
  const data = JSON.parse(project.content);
  let nodeDeleted = false;
  
  function deleteNode(parentNode) {
    if (!parentNode.children) return false;
    
    const index = parentNode.children.findIndex(child => child.id === nodeId);
    if (index !== -1) {
      if (parentNode.children[index].children?.length === 0) {
        parentNode.children.splice(index, 1);
        nodeDeleted = true;
        return true;
      } else {
        alert('Dieser Knoten hat noch Unterknoten und kann nicht gelöscht werden.');
        return true;
      }
    }
    
    return parentNode.children.some(deleteNode);
  }
  
  deleteNode(data.nodes[0]);
  
  if (nodeDeleted) {
    project.content = JSON.stringify(data);
    saveProjects();
    openProject(activeProjectId);
  }
}

function addChecklistItem() {
  const input = document.getElementById('new-item');
  const text = input.value.trim();
  if (!text) return;
  
  const project = projects.find(p => p.id === activeProjectId);
  if (!project) return;
  
  const data = JSON.parse(project.content);
  data.items.push({ id: uuid.v4(), text, done: false });
  project.content = JSON.stringify(data);
  saveProjects();
  input.value = '';
  openProject(activeProjectId);
}

function toggleChecklistItem(itemId) {
  const project = projects.find(p => p.id === activeProjectId);
  if (!project) return;
  
  const data = JSON.parse(project.content);
  const item = data.items.find(item => item.id === itemId);
  if (item) {
    item.done = !item.done;
    project.content = JSON.stringify(data);
    saveProjects();
  }
}

function deleteProject(id) {
  if (!confirm('Möchtest du dieses Projekt wirklich löschen?')) return;
  
  const index = projects.findIndex(p => p.id === id);
  if (index !== -1) {
    projects.splice(index, 1);
    saveProjects();
    renderCurrentFolder();
  }
}

function editProjectTitle() {
  const project = projects.find(p => p.id === activeProjectId);
  if (!project) return;
  
  const newTitle = prompt('Neuer Projekttitel:', project.title);
  if (newTitle && newTitle.trim()) {
    project.title = newTitle.trim();
    saveProjects();
    document.getElementById('modal-title').textContent = `${project.title} (${project.type})`;
    renderCurrentFolder();
  }
}

function closeModal() {
  document.getElementById('project-modal').classList.remove('flex');
  document.getElementById('project-modal').classList.add('hidden');
  activeProjectId = null;
}

function saveFolders() {
  saveUserData();
}

function saveProjects() {
  saveUserData();
}

function deleteFolder(folderId) {
  if (!confirm('Möchten Sie diesen Ordner wirklich löschen? Alle enthaltenen Projekte und Unterordner werden ebenfalls gelöscht.')) {
    return;
  }

  try {
    // Get all subfolders recursively
    const subFolders = getAllSubfolders(folderId);
    const allFolderIds = [folderId, ...subFolders.map(f => f.id)];

    // Remove all projects in these folders
    projects = projects.filter(project => !allFolderIds.includes(project.folderId));
    saveProjects();

    // Remove all folders
    folders = folders.filter(folder => !allFolderIds.includes(folder.id));
    saveFolders();

    // If we're currently in the deleted folder or one of its subfolders,
    // navigate to the parent folder
    if (allFolderIds.includes(currentFolderId)) {
      const deletedFolder = folders.find(f => f.id === folderId);
      currentFolderId = deletedFolder?.parentId || 'root';
    }

    renderCurrentFolder();
    showNotification('Ordner wurde gelöscht');
  } catch (error) {
    console.error('Error deleting folder:', error);
    showNotification('Fehler beim Löschen des Ordners', 'error');
  }
}

function getAllSubfolders(folderId) {
  const subFolders = [];
  
  function collectSubfolders(parentId) {
    const children = folders.filter(f => f.parentId === parentId);
    children.forEach(child => {
      subFolders.push(child);
      collectSubfolders(child.id);
    });
  }
  
  collectSubfolders(folderId);
  return subFolders;
}

function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 transform transition-transform duration-300 translate-x-full
    ${type === 'warning' ? 'bg-yellow-100 text-yellow-800 border-l-4 border-yellow-500' : 
      type === 'error' ? 'bg-red-100 text-red-800 border-l-4 border-red-500' : 
      'bg-blue-100 text-blue-800 border-l-4 border-blue-500'}`;
  notification.textContent = message;
  
  document.body.appendChild(notification);
  setTimeout(() => notification.classList.remove('translate-x-full'), 100);
  setTimeout(() => {
    notification.classList.add('translate-x-full');
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// Load initial data
function initializeData() {
  // Load users first
  const storedUsers = localStorage.getItem('users');
  if (storedUsers) {
    try {
      users = JSON.parse(storedUsers);
    } catch (e) {
      console.error('Error loading users:', e);
      users = [];
    }
  }

  // Then try to load stored user
  const storedUser = localStorage.getItem('currentUser');
  if (storedUser) {
    try {
      const parsedUser = JSON.parse(storedUser);
      // Find the user in our users array to get the most up-to-date data
      const updatedUser = users.find(u => u.id === parsedUser.id);
      if (updatedUser) {
        currentUser = updatedUser;
        folders = currentUser.folders || [];
        projects = currentUser.projects || [];
        renderCurrentFolder();
      } else {
        throw new Error('User not found in users array');
      }
    } catch (e) {
      console.error('Error loading stored user:', e);
      localStorage.removeItem('currentUser');
      currentUser = null;
      showAuthModal();
    }
  } else {
    showAuthModal();
  }
}

// Initialize on page load
window.onload = () => {
  renderCurrentFolder();
}; 