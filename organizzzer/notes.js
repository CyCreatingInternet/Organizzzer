let notesData = {
  id: '',
  title: '',
  content: ''
};

let quill = null;
let saveTimeout = null;

// Initialize Quill editor
function initEditor() {
  const toolbarOptions = [
    ['bold', 'italic', 'underline', 'strike'],
    ['blockquote', 'code-block'],
    [{ 'header': 1 }, { 'header': 2 }],
    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
    [{ 'script': 'sub'}, { 'script': 'super' }],
    [{ 'indent': '-1'}, { 'indent': '+1' }],
    [{ 'direction': 'rtl' }],
    [{ 'size': ['small', false, 'large', 'huge'] }],
    [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
    [{ 'color': [] }, { 'background': [] }],
    [{ 'font': [] }],
    [{ 'align': [] }],
    ['clean']
  ];

  quill = new Quill('#editor', {
    modules: {
      toolbar: toolbarOptions
    },
    theme: 'snow'
  });

  // Auto-save on change
  quill.on('text-change', function() {
    if (saveTimeout) {
      clearTimeout(saveTimeout);
    }
    saveTimeout = setTimeout(saveNotes, 1000);
  });
}

// Load notes data from localStorage
function loadNotes() {
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
    
    if (!project || project.type !== 'Notizen') {
      window.location.href = 'index.html';
      return;
    }
    
    notesData = JSON.parse(project.content);
    document.getElementById('notes-title').textContent = project.title;
    
    // Initialize Quill editor
    const quill = new Quill('#editor', {
      theme: 'snow',
      placeholder: 'Beginne hier mit dem Schreiben...',
      modules: {
        toolbar: [
          [{ 'header': [1, 2, 3, false] }],
          ['bold', 'italic', 'underline', 'strike'],
          [{ 'color': [] }, { 'background': [] }],
          [{ 'list': 'ordered'}, { 'list': 'bullet' }],
          ['link', 'image'],
          ['clean']
        ]
      }
    });
    
    // Set initial content
    quill.setContents(notesData);
    
    // Save on changes
    quill.on('text-change', function() {
      notesData = quill.getContents();
      saveNotes();
    });
  } catch (error) {
    console.error('Error loading notes:', error);
    showNotification('Fehler beim Laden der Notizen', 'error');
  }
}

// Save notes data to localStorage
function saveNotes() {
  try {
    // Get current user data from localStorage
    const userData = JSON.parse(localStorage.getItem('currentUser'));
    if (!userData || !userData.projects) {
      showNotification('Fehler: Keine Benutzerdaten gefunden', 'error');
      return;
    }

    // Find project in user's projects
    const projectIndex = userData.projects.findIndex(p => p.id === notesData.id);
    
    if (projectIndex !== -1) {
      userData.projects[projectIndex].content = JSON.stringify(notesData);
      localStorage.setItem('currentUser', JSON.stringify(userData));

      // Also update in users array
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      const userIndex = users.findIndex(u => u.id === userData.id);
      if (userIndex !== -1) {
        users[userIndex] = userData;
        localStorage.setItem('users', JSON.stringify(users));
      }

      showNotification('Notizen gespeichert');
    }
  } catch (error) {
    console.error('Error saving notes:', error);
    showNotification('Fehler beim Speichern', 'error');
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

// Initialize on page load
window.addEventListener('DOMContentLoaded', loadNotes); 