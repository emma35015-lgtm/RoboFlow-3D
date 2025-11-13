/**
 * RoboFlow - Juego de Optimización Industrial
 * Versión corregida con mejor manejo de eventos
 */

class RoboFlowGame {
  constructor() {
    console.log('🎮 RoboFlow constructor iniciado...');
    
    // Verificar dependencias inmediatamente
    this.verifyDependencies();
    
    // Estado del juego
    this.gameState = 'loading';
    this.currentLevel = 1;
    this.score = 0;
    this.timeRemaining = 180;
    this.maxCollisions = 3;
    this.collisionCount = 0;
    
    // Configuración de Three.js y Cannon.js
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.world = null;
    this.animationId = null;
    this.clock = new THREE.Clock();
    
    // Elementos del juego
    this.productionGrid = [];
    this.placedRobots = [];
    this.products = [];
    this.startPoint = null;
    this.endPoint = null;
    
    // Configuraciones por nivel
    this.levels = {
      1: {
        name: "Primer Día en la Fábrica",
        productsTarget: 5,
        timeLimit: 180,
        maxCollisions: 3,
        robotsAvailable: ['conveyor'],
        description: "Aprende lo básico: coloca una cinta transportadora"
      },
      2: {
        name: "Aumentando la Producción",
        productsTarget: 8,
        timeLimit: 150,
        maxCollisions: 3,
        robotsAvailable: ['conveyor', 'arm'],
        description: "Usa un brazo robótico para mayor precisión"
      },
      3: {
        name: "Optimización Avanzada",
        productsTarget: 10,
        timeLimit: 120,
        maxCollisions: 2,
        robotsAvailable: ['conveyor', 'arm', 'forklift'],
        description: "Maneja objetos pesados con la carretilla"
      },
      4: {
        name: "Línea de Ensamblaje",
        productsTarget: 12,
        timeLimit: 100,
        maxCollisions: 2,
        robotsAvailable: ['conveyor', 'arm', 'forklift'],
        description: "Múltiples robots trabajando en coordinación"
      },
      5: {
        name: "Maestro de la Producción",
        productsTarget: 15,
        timeLimit: 90,
        maxCollisions: 1,
        robotsAvailable: ['conveyor', 'arm', 'forklift'],
        description: "El desafío final: máxima eficiencia sin errores"
      }
    };
    
    // Robots disponibles
    this.robotTypes = {
      conveyor: {
        name: 'Cinta Transportadora',
        cost: 100,
        speed: 0.02,
        capacity: 1,
        color: 0x00FFFF,
        description: 'Mueve productos en línea recta'
      },
      arm: {
        name: 'Brazo Robótico',
        cost: 150,
        speed: 0.03,
        capacity: 1,
        color: 0xFF00FF,
        description: 'Preciso para objetos complejos'
      },
      forklift: {
        name: 'Carretilla Elevadora',
        cost: 200,
        speed: 0.015,
        capacity: 3,
        color: 0xFFFF00,
        description: 'Para objetos pesados y voluminosos'
      }
    };
    
    // Referencia global para debug
    window.game = this;
    
    console.log('✅ RoboFlow constructor completado');
    this.init();
  }

  verifyDependencies() {
    console.log('🔍 Verificando dependencias...');
    
    // Verificar Three.js
    if (typeof THREE === 'undefined') {
      console.error('❌ Three.js no disponible');
      throw new Error('Three.js no está disponible. Verifica tu conexión a internet.');
    }
    
    // Verificar Cannon.js
    if (typeof CANNON === 'undefined') {
      console.error('❌ Cannon.js no disponible');
      throw new Error('Cannon.js no está disponible. Verifica tu conexión a internet.');
    }
    
    console.log('✅ Dependencias verificadas correctamente');
  }

  async init() {
    console.log('🚀 Inicializando RoboFlow...');
    
    try {
      // Verificar que el DOM esté listo
      if (document.readyState === 'loading') {
        console.log('⏳ Esperando que el DOM esté listo...');
        await new Promise(resolve => {
          document.addEventListener('DOMContentLoaded', resolve);
        });
      }
      
      // Setup inicial
      this.setupScene();
      this.setupPhysics();
      this.setupLighting();
      this.setupProductionGrid();
      
      // Setup UI con delay para asegurar que el DOM esté completamente renderizado
      setTimeout(() => {
        this.setupGameUI();
        this.showStartScreen();
        this.startGameLoop();
        console.log('✅ RoboFlow inicializado correctamente');
      }, 100);
      
    } catch (error) {
      console.error('❌ Error durante inicialización:', error);
      this.showError(error.message);
    }
  }

  showError(message) {
    const errorHtml = `
      <div style="
        position: fixed; 
        top: 0; 
        left: 0; 
        width: 100%; 
        height: 100%; 
        background: #05080D; 
        color: #E2E8F0; 
        display: flex; 
        justify-content: center; 
        align-items: center; 
        font-family: 'Poppins', sans-serif;
        z-index: 9999;
      ">
        <div style="text-align: center; max-width: 600px; padding: 20px;">
          <h1 style="color: #FF4444; margin-bottom: 20px;">Error en RoboFlow</h1>
          <p style="margin-bottom: 20px;">${message}</p>
          <button onclick="window.location.reload()" style="
            background: #00FFFF; 
            color: #05080D; 
            border: none; 
            padding: 12px 24px; 
            border-radius: 8px; 
            font-weight: bold;
            cursor: pointer;
          ">Recargar Página</button>
        </div>
      </div>
    `;
    document.body.innerHTML = errorHtml;
  }

  setupScene() {
    console.log('🎨 Configurando escena 3D...');
    
    // Crear escena
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x05080D);

    // Configurar cámara
    const aspect = window.innerWidth / window.innerHeight;
    this.camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 1000);
    this.camera.position.set(10, 15, 10);
    this.camera.lookAt(0, 0, 0);

    // Configurar renderer
    this.renderer = new THREE.WebGLRenderer({ 
      canvas: document.getElementById('canvas3d'),
      antialias: true 
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Resize handler
    window.addEventListener('resize', () => this.onWindowResize());
  }

  setupPhysics() {
    console.log('⚙️ Configurando motor de física...');
    
    // Crear mundo de física
    this.world = new CANNON.World();
    this.world.gravity.set(0, -9.82, 0);
    this.world.broadphase = new CANNON.NaiveBroadphase();
    this.world.solver.iterations = 10;
  }

  setupLighting() {
    console.log('💡 Configurando iluminación...');
    
    // Luz ambiental
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    this.scene.add(ambientLight);

    // Luz direccional principal
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 20, 10);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 50;
    directionalLight.shadow.camera.left = -20;
    directionalLight.shadow.camera.right = 20;
    directionalLight.shadow.camera.top = 20;
    directionalLight.shadow.camera.bottom = -20;
    this.scene.add(directionalLight);

    // Luz puntual para efectos
    const pointLight = new THREE.PointLight(0x00FFFF, 0.3, 30);
    pointLight.position.set(0, 10, 0);
    this.scene.add(pointLight);
  }

  setupProductionGrid() {
    console.log('🏭 Configurando cuadrícula de producción...');
    
    const gridSize = 20;
    const gridSpacing = 2;
    
    // Crear cuadrícula visual
    const gridHelper = new THREE.GridHelper(gridSize, gridSize / gridSpacing, 0x00FFFF, 0x333333);
    this.scene.add(gridHelper);
    
    // Crear piso
    const floorGeometry = new THREE.PlaneGeometry(gridSize, gridSize);
    const floorMaterial = new THREE.MeshLambertMaterial({ 
      color: 0x222222,
      transparent: true,
      opacity: 0.8
    });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    this.scene.add(floor);
    
    // Punto de inicio
    this.startPoint = this.createMarker(-8, 0, -8, 0x00FF00, 'START');
    
    // Punto de fin
    this.endPoint = this.createMarker(8, 0, 8, 0xFF0000, 'FINISH');
  }

  createMarker(x, y, z, color, label) {
    const geometry = new THREE.CylinderGeometry(0.5, 0.5, 1, 16);
    const material = new THREE.MeshLambertMaterial({ color: color });
    const marker = new THREE.Mesh(geometry, material);
    marker.position.set(x, y, z);
    marker.castShadow = true;
    this.scene.add(marker);
    
    return marker;
  }

  setupGameUI() {
    console.log('🎛️ Configurando eventos de UI...');
    
    // Verificar elementos críticos del DOM
    const startBtn = document.getElementById('startGameBtn');
    if (!startBtn) {
      console.error('❌ startGameBtn no encontrado en el DOM');
      return;
    }
    
    console.log('✅ startGameBtn encontrado:', startBtn);
    
    // Event listener para botón principal con múltiples verificaciones
    startBtn.addEventListener('click', (event) => {
      console.log('🚀 ¡START GAME CLICKED!');
      console.log('🎯 Event details:', event);
      
      // Prevenir comportamientos por defecto
      event.preventDefault();
      event.stopPropagation();
      
      // Llamar startLevel con verificación adicional
      setTimeout(() => {
        this.safeStartLevel();
      }, 50);
    });

    // Otros event listeners
    const playBtn = document.getElementById('playBtn');
    const pauseBtn = document.getElementById('pauseBtn');
    const resetBtn = document.getElementById('resetBtn');
    const nextLevelBtn = document.getElementById('nextLevelBtn');

    if (playBtn) {
      playBtn.addEventListener('click', () => this.togglePlayPause());
    }

    if (pauseBtn) {
      pauseBtn.addEventListener('click', () => this.pauseGame());
    }

    if (resetBtn) {
      resetBtn.addEventListener('click', () => this.resetLevel());
    }

    if (nextLevelBtn) {
      nextLevelBtn.addEventListener('click', () => this.nextLevel());
    }

    // Setup drag and drop
    this.setupDragAndDrop();
    
    console.log('✅ Event listeners configurados');
  }

  safeStartLevel() {
    console.log('🎮 Iniciando nivel de forma segura...');
    
    try {
      // Verificar estado actual
      if (this.gameState === 'playing') {
        console.log('⚠️ El juego ya está en modo playing');
        return;
      }
      
      // Cambiar estado
      this.gameState = 'playing';
      this.currentLevel = 1;
      this.score = 0;
      this.collisionCount = 0;
      
      // Configurar nivel
      const level = this.levels[this.currentLevel];
      this.timeRemaining = level.timeLimit;
      this.maxCollisions = level.maxCollisions;
      
      console.log(`✅ Nivel ${this.currentLevel} configurado: ${level.name}`);
      console.log('⏰ Tiempo disponible:', this.timeRemaining, 'segundos');
      console.log('💥 Límite de colisiones:', this.maxCollisions);
      
      // Ocultar/mostrar elementos de UI
      this.hideElement('gameStartScreen');
      this.showElement('gameHud');
      this.showElement('robotPanel');
      this.showElement('gameplayPanel');
      
      // Actualizar displays
      this.updateScoreDisplay();
      this.updateTimerDisplay();
      this.updateCollisionDisplay();
      this.updateLevelDisplay();
      this.updateProductsDisplay();
      
      // Iniciar timer
      this.startGameTimer();
      
      console.log('🎉 ¡Nivel iniciado exitosamente!');
      
      // Mostrar notificación de éxito
      this.showNotification('¡Nivel iniciado! Coloca robots y produce productos', 'success');
      
    } catch (error) {
      console.error('❌ Error en safeStartLevel:', error);
      this.showError('Error iniciando el nivel: ' + error.message);
    }
  }

  hideElement(id) {
    const element = document.getElementById(id);
    if (element) {
      element.style.display = 'none';
      console.log(`✅ Elemento ${id} ocultado`);
    } else {
      console.error(`❌ Elemento ${id} no encontrado`);
    }
  }

  showElement(id) {
    const element = document.getElementById(id);
    if (element) {
      element.style.display = id === 'gameHud' ? 'flex' : 'block';
      console.log(`✅ Elemento ${id} mostrado`);
    } else {
      console.error(`❌ Elemento ${id} no encontrado`);
    }
  }

  startGameTimer() {
    // Limpiar timer anterior si existe
    if (this.gameTimer) {
      clearInterval(this.gameTimer);
    }
    
    this.gameTimer = setInterval(() => {
      if (this.gameState === 'playing') {
        this.timeRemaining--;
        this.updateTimerDisplay();
        
        if (this.timeRemaining <= 0) {
          this.gameOver('Se acabó el tiempo');
        }
      }
    }, 1000);
  }

  updateScoreDisplay() {
    const scoreElement = document.getElementById('currentScore');
    if (scoreElement) {
      scoreElement.textContent = this.score;
    }
  }

  updateTimerDisplay() {
    const timerElement = document.getElementById('gameTimer');
    if (timerElement) {
      const minutes = Math.floor(this.timeRemaining / 60);
      const seconds = this.timeRemaining % 60;
      timerElement.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
  }

  updateCollisionDisplay() {
    const collisionElement = document.getElementById('collisionLimit');
    if (collisionElement) {
      const remaining = Math.max(0, this.maxCollisions - this.collisionCount);
      collisionElement.textContent = remaining;
      collisionElement.style.color = remaining <= 1 ? '#FF4444' : '#E2E8F0';
    }
  }

  updateLevelDisplay() {
    const levelElement = document.getElementById('currentLevel');
    if (levelElement) {
      levelElement.textContent = this.currentLevel;
    }
  }

  updateProductsDisplay() {
    const productsElement = document.getElementById('productsTarget');
    if (productsElement) {
      productsElement.textContent = this.levels[this.currentLevel].productsTarget;
    }
  }

  showStartScreen() {
    console.log('🖼️ Mostrando pantalla de inicio...');
    
    this.gameState = 'menu';
    this.showElement('gameStartScreen');
    this.hideElement('gameHud');
    this.hideElement('robotPanel');
    this.hideElement('gameplayPanel');
    
    console.log('✅ Pantalla de inicio mostrada');
  }

  setupDragAndDrop() {
    console.log('🖱️ Configurando drag and drop...');
    
    const robotCards = document.querySelectorAll('.robot-card');
    robotCards.forEach(card => {
      card.addEventListener('dragstart', (e) => {
        console.log('🤖 Drag iniciado:', card.dataset.robotType);
        e.dataTransfer.setData('text/plain', card.dataset.robotType);
      });
    });

    // Configurar drop zone (canvas)
    const canvas = document.getElementById('canvas3d');
    if (canvas) {
      canvas.addEventListener('dragover', (e) => {
        e.preventDefault();
      });
      
      canvas.addEventListener('drop', (e) => {
        e.preventDefault();
        const robotType = e.dataTransfer.getData('text/plain');
        console.log('🎯 Robot droppeado:', robotType);
        this.placeRobot(robotType, e.clientX, e.clientY);
      });
    }
  }

  placeRobot(robotType, x, y) {
    // Implementar colocación de robot
    console.log(`🤖 Colocando robot ${robotType} en posición ${x}, ${y}`);
    
    // Por ahora solo mostrar mensaje
    this.showNotification(`${this.robotTypes[robotType].name} colocado`, 'info');
  }

  showNotification(message, type = 'info') {
    console.log(`📢 Notificación [${type}]: ${message}`);
    
    // Crear elemento de notificación
    const notification = document.createElement('div');
    notification.className = 'game-notification';
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 15px 20px;
      background: ${type === 'success' ? '#00FF00' : type === 'error' ? '#FF4444' : '#00FFFF'};
      color: #05080D;
      border-radius: 8px;
      font-weight: bold;
      z-index: 10000;
      animation: slideIn 0.3s ease-out;
    `;
    
    document.body.appendChild(notification);
    
    // Remover después de 3 segundos
    setTimeout(() => {
      notification.remove();
    }, 3000);
  }

  onWindowResize() {
    const aspect = window.innerWidth / window.innerHeight;
    this.camera.aspect = aspect;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  startGameLoop() {
    console.log('🎬 Iniciando bucle de juego...');
    
    const animate = () => {
      if (this.gameState === 'playing') {
        this.updateGame();
      }
      
      if (this.renderer && this.scene && this.camera) {
        this.renderer.render(this.scene, this.camera);
      }
      
      this.animationId = requestAnimationFrame(animate);
    };
    
    animate();
  }

  updateGame() {
    // Actualizar mundo de física
    if (this.world) {
      this.world.step(1/60);
    }
    
    // Actualizar productos y robots
    this.updateProducts();
    this.updateRobots();
  }

  updateProducts() {
    // Actualizar posiciones de productos
    // Implementar lógica de movimiento de productos
  }

  updateRobots() {
    // Actualizar posiciones y estados de robots
    // Implementar lógica de robots
  }

  // Métodos adicionales para completar el juego
  togglePlayPause() { console.log('⏯️ Toggle play/pause'); }
  pauseGame() { console.log('⏸️ Pause game'); }
  resetLevel() { console.log('🔄 Reset level'); }
  nextLevel() { console.log('➡️ Next level'); }
  gameOver(reason) { console.log('💥 Game over:', reason); }

  destroy() {
    console.log('🗑️ Destruyendo RoboFlow...');
    
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    
    if (this.gameTimer) {
      clearInterval(this.gameTimer);
    }
    
    if (this.renderer) {
      this.renderer.dispose();
    }
    
    console.log('🗑️ RoboFlow destruido');
  }
}

// Estilos adicionales para notificaciones
const notificationStyles = `
  @keyframes slideIn {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
`;

// Agregar estilos
const style = document.createElement('style');
style.textContent = notificationStyles;
document.head.appendChild(style);

// Inicializar el juego cuando el DOM esté listo
let game;
document.addEventListener('DOMContentLoaded', function() {
  console.log('🎮 DOM cargado, iniciando RoboFlow...');
  
  try {
    game = new RoboFlowGame();
    console.log('🎉 ¡RoboFlow iniciado exitosamente!');
    
    // Agregar estilos adicionales a elementos críticos
    const startBtn = document.getElementById('startGameBtn');
    if (startBtn) {
      startBtn.style.cursor = 'pointer';
      startBtn.style.userSelect = 'none';
      startBtn.style.pointerEvents = 'auto';
      startBtn.style.zIndex = '1000';
    }
    
  } catch (error) {
    console.error('❌ Error crítico inicializando RoboFlow:', error);
    alert('Error crítico: ' + error.message + '\nPor favor, recarga la página.');
  }
});

// Debug global
window.addEventListener('error', function(e) {
  console.error('❌ Error global:', e.error);
});

window.debugRoboFlow = function() {
  console.log('🐛 Debug info:', {
    game: game,
    gameState: game?.gameState,
    threejs: typeof THREE !== 'undefined',
    cannon: typeof CANNON !== 'undefined',
    startBtn: document.getElementById('startGameBtn')
  });
};
