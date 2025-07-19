// Test if vis.js is loaded
if (typeof vis === 'undefined') {
  console.error('vis.js is not loaded!');
  alert('vis.js library is missing. Please check your internet connection.');
}

let mindmapData = {
  id: '',
  title: '',
  nodes: null,
  edges: null
};

let network = null;
let selectedNode = null;
let connectMode = false;
let connectSource = null;

const colors = {
  blue: { background: '#FFFFFF', border: '#3B82F6' },
  green: { background: '#FFFFFF', border: '#22C55E' },
  red: { background: '#FFFFFF', border: '#EF4444' },
  yellow: { background: '#FFFFFF', border: '#EAB308' },
  purple: { background: '#FFFFFF', border: '#A855F7' }
};

// Initialize the mindmap visualization
function initMindmap() {
  console.log('Initializing mindmap...');
  
  const container = document.getElementById('mindmap');
  if (!container) {
    console.error('Mindmap container not found!');
    return;
  }

  // Initialize datasets if not already done
  if (!mindmapData.nodes || !mindmapData.edges) {
    console.log('Initializing new datasets');
    mindmapData.nodes = new vis.DataSet();
    mindmapData.edges = new vis.DataSet();
  }
  
  const data = {
    nodes: mindmapData.nodes,
    edges: mindmapData.edges
  };
  
  const options = {
    nodes: {
      shape: 'box',
      margin: 10,
      widthConstraint: { minimum: 150 },
      font: { size: 16 },
      color: colors.blue
    },
    edges: {
      smooth: {
        type: 'continuous',
        forceDirection: 'none'
      },
      color: '#94A3B8'
    },
    physics: {
      enabled: true,
      solver: 'forceAtlas2Based',
      forceAtlas2Based: {
        gravitationalConstant: -50,
        centralGravity: 0.01,
        springLength: 100,
        springConstant: 0.08,
        damping: 0.4
      },
      stabilization: {
        enabled: true,
        iterations: 100,
        updateInterval: 25
      }
    },
    manipulation: {
      enabled: false
    }
  };

  try {
    network = new vis.Network(container, data, options);
    console.log('Network created successfully');

    // Event handlers
    network.on('click', function(params) {
      if (params.nodes.length > 0) {
        const nodeId = params.nodes[0];
        if (connectMode) {
          if (connectSource && connectSource !== nodeId) {
            createConnection(nodeId, '#3B82F6'); // Default blue connection
          } else {
            connectSource = nodeId;
          }
        } else {
          selectedNode = nodeId;
          showNodeEditForm(nodeId);
        }
      } else {
        selectedNode = null;
        hideNodeEditForm();
      }
    });

    network.on('stabilizationIterationsDone', function() {
      console.log('Network stabilized');
      network.setOptions({ physics: { enabled: false } });
    });

  } catch (error) {
    console.error('Error creating network:', error);
  }
}

// Add node from input field
function addNodeFromInput() {
  console.log('Adding new node...');
  const input = document.getElementById('node-input');
  if (!input) {
    console.error('Node input element not found!');
    return;
  }

  const text = input.value.trim();
  if (!text) {
    console.log('No text entered');
    return;
  }

  try {
    const nodeId = uuid.v4();
    const node = {
      id: nodeId,
      label: text,
      color: colors.blue
    };
    
    console.log('Adding node:', node);
    mindmapData.nodes.add(node);
    
    // Enable physics temporarily for smooth placement
    network.setOptions({ physics: { enabled: true } });
    
    // Center on the new node
    network.focus(nodeId, {
      scale: 1,
      animation: {
        duration: 1000,
        easingFunction: 'easeInOutQuad'
      }
    });

    // Disable physics after animation
    setTimeout(() => {
      network.setOptions({ physics: { enabled: false } });
    }, 1500);

    input.value = '';
    saveMindmap();
    input.focus();

  } catch (error) {
    console.error('Error adding node:', error);
  }
}

// Load mindmap data from localStorage
function loadMindmap() {
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
    
    if (!project || project.type !== 'Mindmap') {
      window.location.href = 'index.html';
      return;
    }
    
    const content = JSON.parse(project.content);
    mindmapData = {
      id: content.id,
      title: content.title,
      nodes: new vis.DataSet(content.nodes || []),
      edges: new vis.DataSet(content.edges || [])
    };
    
    document.getElementById('mindmap-title').textContent = project.title;
    
    // Initialize the mindmap after loading data
    initMindmap();
  } catch (error) {
    console.error('Error loading mindmap:', error);
    showNotification('Fehler beim Laden der Mindmap', 'error');
  }
}

// Save mindmap data to localStorage
function saveMindmap() {
  try {
    // Get current user data from localStorage
    const userData = JSON.parse(localStorage.getItem('currentUser'));
    if (!userData || !userData.projects) {
      showNotification('Fehler: Keine Benutzerdaten gefunden', 'error');
      return;
    }

    // Find project in user's projects
    const projectIndex = userData.projects.findIndex(p => p.id === mindmapData.id);
    
    if (projectIndex !== -1) {
      const content = {
        id: mindmapData.id,
        title: mindmapData.title,
        nodes: mindmapData.nodes.get(),
        edges: mindmapData.edges.get()
      };
      
      userData.projects[projectIndex].content = JSON.stringify(content);
      localStorage.setItem('currentUser', JSON.stringify(userData));

      // Also update in users array
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      const userIndex = users.findIndex(u => u.id === userData.id);
      if (userIndex !== -1) {
        users[userIndex] = userData;
        localStorage.setItem('users', JSON.stringify(users));
      }

      showNotification('Mindmap gespeichert');
    }
  } catch (error) {
    console.error('Error saving mindmap:', error);
    showNotification('Fehler beim Speichern', 'error');
  }
}

// Show node edit form
function showNodeEditForm(nodeId) {
  const node = mindmapData.nodes.get(nodeId);
  if (!node) return;
  
  const form = document.getElementById('node-edit-form');
  if (!form) return;
  
  form.style.display = 'block';
  document.getElementById('node-text').value = node.label;
}

// Hide node edit form
function hideNodeEditForm() {
  const form = document.getElementById('node-edit-form');
  if (form) {
    form.style.display = 'none';
  }
  selectedNode = null;
}

// Save node edit
function saveNodeEdit() {
  if (!selectedNode) return;
  
  const text = document.getElementById('node-text').value;
  if (text.trim()) {
    mindmapData.nodes.update({
      id: selectedNode,
      label: text.trim()
    });
    saveMindmap();
  }
  
  hideNodeEditForm();
}

// Delete selected node
function deleteNode() {
  if (!selectedNode) return;
  
  if (confirm('Möchten Sie diesen Knoten wirklich löschen?')) {
    // Remove connected edges first
    const edges = mindmapData.edges.get().filter(edge => 
      edge.from === selectedNode || edge.to === selectedNode
    );
    mindmapData.edges.remove(edges);
    
    // Remove the node
    mindmapData.nodes.remove(selectedNode);
    hideNodeEditForm();
    saveMindmap();
  }
}

// Toggle connection mode
function toggleConnectionMode() {
  connectMode = !connectMode;
  connectSource = null;
  
  const button = document.getElementById('connect-button');
  if (button) {
    if (connectMode) {
      button.textContent = 'Verbindungsmodus (aktiv)';
      button.classList.add('bg-green-600');
      button.classList.remove('bg-blue-600');
    } else {
      button.textContent = 'Verbindungsmodus';
      button.classList.add('bg-blue-600');
      button.classList.remove('bg-green-600');
    }
  }
}

// Create connection between nodes
function createConnection(targetId, color) {
  if (!connectSource || connectSource === targetId) return;
  
  try {
    const edgeId = uuid.v4();
    mindmapData.edges.add({
      id: edgeId,
      from: connectSource,
      to: targetId,
      color: color
    });
    
    connectSource = null;
    connectMode = false;
    
    const button = document.getElementById('connect-button');
    if (button) {
      button.textContent = 'Verbindungsmodus';
      button.classList.add('bg-blue-600');
      button.classList.remove('bg-green-600');
    }
    
    saveMindmap();
  } catch (error) {
    console.error('Error creating connection:', error);
  }
}

// Initialize on page load
window.addEventListener('DOMContentLoaded', loadMindmap); 