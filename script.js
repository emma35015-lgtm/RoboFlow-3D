/**
 * RoboFlow - Juego de Optimización Industrial
 * Sistema completo de juego con niveles, puntuación y mecánicas interactivas
 */

class RoboFlowGame {
  constructor() {
    console.log('🎮 Iniciando RoboFlow...');
    
    // Verificar dependencias
    this.checkDependencies();
    
    // Estado del juego
    this.gameState = 'loading'; // loading, menu, playing, paused, levelComplete, gameOver
    this.currentLevel = 1;
    this.score = 0;
    this.timeRemaining = 180; // 3 minutos por defecto
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
    
    // Inicializar
    this.init();
  }

  checkDependencies() {
    if (typeof THREE === 'undefined') {
      console.error('❌ Three.js no está cargado');
      alert('Error: Three.js no está disponible');
      return false;
    }
    if (typeof CANNON === 'undefined') {
      console.error('❌ Cannon.js no está cargado');
      alert('Error: Cannon.js no está disponible');
      return false;
    }
    console.log('✅ Dependencias verificadas');
    return true;
  }

  init() {
    console.log('🚀 Inicializando RoboFlow...');
    
    try {
      this.setupScene();
      this.setupPhysics();
      this.setupLighting();
      this.setupProductionGrid();
      this.setupEventListeners();
      this.setupGameUI();
      this.startGameLoop();
      
      // Mostrar pantalla de inicio
      this.showStartScreen();
      
      console.log('✅ RoboFlow inicializado correctamente');
    } catch (error) {
      console.error('❌ Error durante inicialización:', error);
      alert('Error inicializando RoboFlow: ' + error.message);
    }
  }

  setupScene() {
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
    // Crear mundo de física
    this.world = new CANNON.World();
    this.world.gravity.set(0, -9.82, 0);
    this.world.broadphase = new CANNON.NaiveBroadphase();
    this.world.solver.iterations = 10;

    // Materiales para colisiones
    const defaultMaterial = new CANNON.Material('default');
    const defaultContactMaterial = new CANNON.ContactMaterial(
      defaultMaterial,
      defaultMaterial,
      {
        friction: 0.4,
        restitution: 0.3
      }
    );
    this.world.addContactMaterial(defaultContactMaterial);
  }

  setupLighting() {
    // Luz ambiental
    const ambientLight = new THREE.AmbientLight(0x404040, 0.3);
    this.scene.add(ambientLight);

    // Luz direccional (sol)
    const directionalLight = new THREE.DirectionalLight(0x00FFFF, 0.8);
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

    // Luces de acento
    const accentLight1 = new THREE.PointLight(0xFF00FF, 0.5, 30);
    accentLight1.position.set(-10, 10, -10);
    this.scene.add(accentLight1);

    const accentLight2 = new THREE.PointLight(0x00FFFF, 0.5, 30);
    accentLight2.position.set(10, 10, 10);
    this.scene.add(accentLight2);
  }

  setupProductionGrid() {
    // Crear cuadrícula de producción (10x10)
    const gridSize = 10;
    const cellSize = 1;
    
    // Plano base
    const groundGeometry = new THREE.PlaneGeometry(gridSize * cellSize, gridSize * cellSize);
    const groundMaterial = new THREE.MeshPhongMaterial({ 
      color: 0x0F172A,
      transparent: true,
      opacity: 0.8
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);

    // Líneas de cuadrícula
    const gridHelper = new THREE.GridHelper(gridSize * cellSize, gridSize, 0x334155, 0x334155);
    gridHelper.material.opacity = 0.3;
    gridHelper.material.transparent = true;
    this.scene.add(gridHelper);

    // Crear array de posiciones para la cuadrícula
    for (let x = 0; x < gridSize; x++) {
      this.productionGrid[x] = [];
      for (let z = 0; z < gridSize; z++) {
        this.productionGrid[x][z] = {
          position: new THREE.Vector3(
            (x - gridSize/2) * cellSize + cellSize/2,
            0,
            (z - gridSize/2) * cellSize + cellSize/2
          ),
          occupied: false,
          robot: null
        };
      }
    }

    // Crear punto de inicio (esquina inferior izquierda)
    this.createStartPoint(1, 1);
    
    // Crear punto final (esquina superior derecha)
    this.createEndPoint(gridSize - 2, gridSize - 2);
  }

  createStartPoint(x, z) {
    const geometry = new THREE.BoxGeometry(1.5, 0.1, 1.5);
    const material = new THREE.MeshPhongMaterial({ color: 0x34D399 });
    const startPoint = new THREE.Mesh(geometry, material);
    startPoint.position.copy(this.productionGrid[x][z].position);
    startPoint.position.y = 0.05;
    startPoint.receiveShadow = true;
    this.scene.add(startPoint);
    this.startPoint = { x, z, mesh: startPoint, type: 'start' };

    // Añadir texto
    const sprite = this.createTextSprite('INICIO', '#34D399');
    sprite.position.copy(startPoint.position);
    sprite.position.y = 1;
    this.scene.add(sprite);
  }

  createEndPoint(x, z) {
    const geometry = new THREE.BoxGeometry(1.5, 0.1, 1.5);
    const material = new THREE.MeshPhongMaterial({ color: 0xFBBF24 });
    const endPoint = new THREE.Mesh(geometry, material);
    endPoint.position.copy(this.productionGrid[x][z].position);
    endPoint.position.y = 0.05;
    endPoint.receiveShadow = true;
    this.scene.add(endPoint);
    this.endPoint = { x, z, mesh: endPoint, type: 'end' };

    // Añadir texto
    const sprite = this.createTextSprite('FINAL', '#FBBF24');
    sprite.position.copy(endPoint.position);
    sprite.position.y = 1;
    this.scene.add(sprite);
  }

  createTextSprite(text, color = '#FFFFFF') {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = 256;
    canvas.height = 64;
    
    context.fillStyle = 'rgba(0, 0, 0, 0)';
    context.fillRect(0, 0, canvas.width, canvas.height);
    
    context.font = 'bold 24px Poppins';
    context.fillStyle = color;
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(text, canvas.width / 2, canvas.height / 2);
    
    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({ map: texture });
    const sprite = new THREE.Sprite(material);
    sprite.scale.set(2, 0.5, 1);
    
    return sprite;
  }

  setupGameUI() {
    // Event listeners para botones principales
    document.getElementById('startGameBtn').addEventListener('click', () => {
      this.startLevel();
    });

    document.getElementById('playBtn').addEventListener('click', () => {
      this.togglePlayPause();
    });

    document.getElementById('pauseBtn').addEventListener('click', () => {
      this.pauseGame();
    });

    document.getElementById('resetBtn').addEventListener('click', () => {
      this.resetLevel();
    });

    document.getElementById('nextLevelBtn').addEventListener('click', () => {
      this.nextLevel();
    });

    // Event listeners para herramientas
    document.getElementById('rotateTool').addEventListener('click', (e) => {
      this.toggleTool('rotate', e.target.closest('.tool-btn'));
    });

    document.getElementById('deleteTool').addEventListener('click', (e) => {
      this.toggleTool('delete', e.target.closest('.tool-btn'));
    });

    document.getElementById('gridTool').addEventListener('click', (e) => {
      this.toggleGrid();
    });

    // Setup drag and drop para robots
    this.setupDragAndDrop();

    // Event listeners para modales
    document.getElementById('nextLevelFromModal').addEventListener('click', () => {
      this.hideModal('levelCompleteModal');
      this.nextLevel();
    });

    document.getElementById('retryLevelFromModal').addEventListener('click', () => {
      this.hideModal('levelCompleteModal');
      this.resetLevel();
    });

    document.getElementById('restartGameBtn').addEventListener('click', () => {
      this.hideModal('gameOverModal');
      this.restartGame();
    });

    document.getElementById('exitToMenuBtn').addEventListener('click', () => {
      this.hideModal('gameOverModal');
      this.showStartScreen();
    });

    // Panel toggle
    document.getElementById('toggleRobotPanel').addEventListener('click', () => {
      const panel = document.getElementById('robotPanel');
      panel.classList.toggle('collapsed');
    });
  }

  setupDragAndDrop() {
    const robotCards = document.querySelectorAll('.robot-card');
    
    robotCards.forEach(card => {
      card.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/plain', card.dataset.robotType);
        card.classList.add('dragging');
      });

      card.addEventListener('dragend', (e) => {
        card.classList.remove('dragging');
      });
    });

    // Permitir drop en el canvas 3D
    const canvas3d = document.getElementById('canvas3d');
    canvas3d.addEventListener('dragover', (e) => {
      e.preventDefault();
    });

    canvas3d.addEventListener('drop', (e) => {
      e.preventDefault();
      const robotType = e.dataTransfer.getData('text/plain');
      if (robotType && this.canPlaceRobot(robotType)) {
        this.placeRobot(robotType, e.clientX, e.clientY);
      }
    });
  }

  setupEventListeners() {
    // Timer del juego
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

  showStartScreen() {
    this.gameState = 'menu';
    document.getElementById('gameStartScreen').style.display = 'flex';
    document.getElementById('gameHud').style.display = 'none';
    document.getElementById('robotPanel').style.display = 'none';
    document.getElementById('gameplayPanel').style.display = 'none';
  }

  startLevel() {
    this.gameState = 'playing';
    this.currentLevel = 1;
    this.score = 0;
    this.collisionCount = 0;
    
    // Configurar nivel actual
    const level = this.levels[this.currentLevel];
    this.timeRemaining = level.timeLimit;
    this.maxCollisions = level.maxCollisions;
    
    // Mostrar UI del juego
    document.getElementById('gameStartScreen').style.display = 'none';
    document.getElementById('gameHud').style.display = 'flex';
    document.getElementById('robotPanel').style.display = 'block';
    document.getElementById('gameplayPanel').style.display = 'block';
    
    // Actualizar UI
    this.updateHUD();
    this.updateGameplayStats();
    
    // Generar primer producto
    this.spawnProduct();
    
    console.log(`🎯 Iniciando Nivel ${this.currentLevel}: ${level.name}`);
  }

  updateHUD() {
    document.getElementById('currentLevel').textContent = this.currentLevel;
    document.getElementById('currentScore').textContent = this.score.toLocaleString();
    
    const level = this.levels[this.currentLevel];
    document.getElementById('productsTarget').textContent = level.productsTarget;
    document.getElementById('collisionLimit').textContent = this.maxCollisions - this.collisionCount;
    
    this.updateTimerDisplay();
  }

  updateTimerDisplay() {
    const minutes = Math.floor(this.timeRemaining / 60);
    const seconds = this.timeRemaining % 60;
    const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    const timerElement = document.getElementById('gameTimer');
    timerElement.textContent = timeString;
    
    // Cambiar color si el tiempo está bajo
    if (this.timeRemaining <= 30) {
      timerElement.classList.add('warning');
    } else {
      timerElement.classList.remove('warning');
    }
  }

  updateGameplayStats() {
    const deliveredProducts = this.products.filter(p => p.delivered).length;
    document.getElementById('deliveredCount').textContent = deliveredProducts;
    document.getElementById('collisionCount').textContent = this.collisionCount;
    
    const level = this.levels[this.currentLevel];
    const efficiency = deliveredProducts > 0 ? Math.round((deliveredProducts / level.productsTarget) * 100) : 0;
    document.getElementById('efficiencyScore').textContent = `${efficiency}%`;
  }

  canPlaceRobot(robotType) {
    const level = this.levels[this.currentLevel];
    return level.robotsAvailable.includes(robotType);
  }

  placeRobot(robotType, x, y) {
    const robotData = this.robotTypes[robotType];
    
    if (this.score < robotData.cost) {
      this.showMessage('Puntos insuficientes para este robot');
      return false;
    }

    // Buscar posición libre en la cuadrícula más cercana
    const gridPosition = this.getGridPositionFromScreen(x, y);
    if (!gridPosition || this.productionGrid[gridPosition.x][gridPosition.z].occupied) {
      this.showMessage('Posición no válida o ya ocupada');
      return false;
    }

    // Crear robot 3D
    const robotMesh = this.createRobotMesh(robotType);
    robotMesh.position.copy(this.productionGrid[gridPosition.x][gridPosition.z].position);
    robotMesh.position.y = 0.5;
    this.scene.add(robotMesh);

    // Marcar posición como ocupada
    this.productionGrid[gridPosition.x][gridPosition.z].occupied = true;
    this.productionGrid[gridPosition.x][gridPosition.z].robot = {
      type: robotType,
      mesh: robotMesh,
      rotation: 0
    };

    // Añadir a lista de robots colocados
    this.placedRobots.push({
      type: robotType,
      position: { x: gridPosition.x, z: gridPosition.z },
      mesh: robotMesh,
      rotation: 0,
      active: true
    });

    // Descontar puntos
    this.score -= robotData.cost;
    this.updateHUD();

    // Efecto visual
    this.createPlacementEffect(robotMesh.position);

    console.log(`🤖 Robot ${robotData.name} placed at (${gridPosition.x}, ${gridPosition.z})`);
    return true;
  }

  createRobotMesh(robotType) {
    const robotData = this.robotTypes[robotType];
    let geometry, material;

    switch (robotType) {
      case 'conveyor':
        geometry = new THREE.BoxGeometry(0.8, 0.2, 1.5);
        break;
      case 'arm':
        geometry = new THREE.CylinderGeometry(0.1, 0.2, 1, 8);
        break;
      case 'forklift':
        geometry = new THREE.BoxGeometry(1, 0.8, 1.5);
        break;
      default:
        geometry = new THREE.BoxGeometry(0.8, 0.2, 0.8);
    }

    material = new THREE.MeshPhongMaterial({ 
      color: robotData.color,
      transparent: true,
      opacity: 0.9
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    // Añadir resplandor
    const glowGeometry = geometry.clone();
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: robotData.color,
      transparent: true,
      opacity: 0.2
    });
    const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
    glowMesh.scale.multiplyScalar(1.1);
    mesh.add(glowMesh);

    return mesh;
  }

  getGridPositionFromScreen(x, y) {
    // Convertir coordenadas de pantalla a coordenadas del mundo 3D
    const mouse = new THREE.Vector2();
    mouse.x = (x / window.innerWidth) * 2 - 1;
    mouse.y = -(y / window.innerHeight) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, this.camera);

    // Intersectar con el plano del suelo
    const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const intersection = new THREE.Vector3();
    raycaster.ray.intersectPlane(groundPlane, intersection);

    if (!intersection) return null;

    // Convertir a coordenadas de cuadrícula
    const gridSize = 10;
    const cellSize = 1;
    
    const gridX = Math.round((intersection.x + (gridSize * cellSize) / 2) / cellSize) - 1;
    const gridZ = Math.round((intersection.z + (gridSize * cellSize) / 2) / cellSize) - 1;

    if (gridX >= 0 && gridX < gridSize && gridZ >= 0 && gridZ < gridSize) {
      return { x: gridX, z: gridZ };
    }

    return null;
  }

  spawnProduct() {
    if (this.products.length >= 1) return; // Solo un producto a la vez por simplicidad

    const geometry = new THREE.SphereGeometry(0.2, 16, 16);
    const material = new THREE.MeshPhongMaterial({ 
      color: 0x34D399,
      emissive: 0x001100
    });
    const product = new THREE.Mesh(geometry, material);
    
    product.position.copy(this.startPoint.mesh.position);
    product.position.y = 0.5;
    product.castShadow = true;
    
    this.scene.add(product);
    
    this.products.push({
      mesh: product,
      delivered: false,
      path: [],
      currentTarget: 0
    });

    console.log('📦 Producto generado en punto de inicio');
  }

  createPlacementEffect(position) {
    for (let i = 0; i < 15; i++) {
      setTimeout(() => {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = position.x * 100 + '%';
        particle.style.top = position.z * 100 + '%';
        particle.style.background = `hsl(${Math.random() * 60 + 180}, 100%, 50%)`;
        
        document.getElementById('particlesContainer').appendChild(particle);
        
        setTimeout(() => {
          particle.remove();
        }, 1000);
      }, i * 50);
    }
  }

  showMessage(message) {
    // Crear mensaje temporal
    const messageDiv = document.createElement('div');
    messageDiv.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(248, 113, 113, 0.9);
      color: white;
      padding: 16px 24px;
      border-radius: 8px;
      font-family: Poppins;
      font-weight: 600;
      z-index: 2000;
      animation: messageSlide 2s ease-out forwards;
    `;
    messageDiv.textContent = message;
    
    // Añadir keyframes de animación
    if (!document.querySelector('#messageStyles')) {
      const style = document.createElement('style');
      style.id = 'messageStyles';
      style.textContent = `
        @keyframes messageSlide {
          0% { transform: translate(-50%, -50%) scale(0.5); opacity: 0; }
          20% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
          80% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
          100% { transform: translate(-50%, -50%) scale(0.5); opacity: 0; }
        }
      `;
      document.head.appendChild(style);
    }
    
    document.body.appendChild(messageDiv);
    
    setTimeout(() => {
      messageDiv.remove();
    }, 2000);
  }

  togglePlayPause() {
    if (this.gameState === 'playing') {
      this.pauseGame();
    } else if (this.gameState === 'paused') {
      this.resumeGame();
    }
  }

  pauseGame() {
    this.gameState = 'paused';
    console.log('⏸️ Juego pausado');
  }

  resumeGame() {
    this.gameState = 'playing';
    console.log('▶️ Juego reanudado');
  }

  resetLevel() {
    // Limpiar robots colocados
    this.placedRobots.forEach(robot => {
      this.scene.remove(robot.mesh);
    });
    this.placedRobots = [];

    // Limpiar cuadrícula
    for (let x = 0; x < this.productionGrid.length; x++) {
      for (let z = 0; z < this.productionGrid[x].length; z++) {
        this.productionGrid[x][z].occupied = false;
        this.productionGrid[x][z].robot = null;
      }
    }

    // Limpiar productos
    this.products.forEach(product => {
      this.scene.remove(product.mesh);
    });
    this.products = [];

    // Resetear estado
    this.collisionCount = 0;
    const level = this.levels[this.currentLevel];
    this.timeRemaining = level.timeLimit;
    this.maxCollisions = level.maxCollisions;

    // Regenerar producto
    this.spawnProduct();
    
    // Actualizar UI
    this.updateHUD();
    this.updateGameplayStats();

    console.log('🔄 Nivel reiniciado');
  }

  nextLevel() {
    this.currentLevel++;
    
    if (this.currentLevel > 5) {
      this.gameComplete();
      return;
    }

    // Configurar nuevo nivel
    const level = this.levels[this.currentLevel];
    this.timeRemaining = level.timeLimit;
    this.maxCollisions = level.maxCollisions;
    
    // Resetear nivel
    this.resetLevel();
    
    // Actualizar UI
    this.updateHUD();
    
    console.log(`🎯 Nivel ${this.currentLevel}: ${level.name}`);
  }

  levelComplete() {
    this.gameState = 'levelComplete';
    
    const level = this.levels[this.currentLevel];
    const deliveredProducts = this.products.filter(p => p.delivered).length;
    
    // Calcular puntuación bonus
    const timeBonus = Math.floor(this.timeRemaining * 10);
    const collisionBonus = this.collisionCount === 0 ? 500 : 0;
    const efficiencyBonus = deliveredProducts >= level.productsTarget ? 300 : 0;
    
    const totalBonus = timeBonus + collisionBonus + efficiencyBonus;
    this.score += totalBonus;
    
    // Mostrar modal
    document.getElementById('finalScore').textContent = this.score.toLocaleString();
    document.getElementById('timeBonus').textContent = `+${timeBonus}`;
    document.getElementById('collisionBonus').textContent = `+${collisionBonus}`;
    document.getElementById('efficiencyBonus').textContent = `+${efficiencyBonus}`;
    
    this.showModal('levelCompleteModal');
    
    // Mostrar botón siguiente nivel
    document.getElementById('nextLevelBtn').style.display = 'inline-flex';
    
    console.log(`🎉 Nivel ${this.currentLevel} completado! Puntuación: ${this.score}`);
  }

  gameOver(reason) {
    this.gameState = 'gameOver';
    
    document.getElementById('gameOverReason').textContent = reason;
    document.getElementById('reachedLevel').textContent = this.currentLevel;
    document.getElementById('finalGameScore').textContent = this.score.toLocaleString();
    
    this.showModal('gameOverModal');
    
    console.log(`💥 Game Over: ${reason}. Nivel alcanzado: ${this.currentLevel}, Puntuación: ${this.score}`);
  }

  gameComplete() {
    this.gameState = 'gameComplete';
    
    document.getElementById('gameOverReason').textContent = '¡Felicidades! Has completado todos los niveles';
    document.getElementById('reachedLevel').textContent = '5 (Máximo)';
    document.getElementById('finalGameScore').textContent = this.score.toLocaleString();
    
    this.showModal('gameOverModal');
    
    console.log(`🏆 ¡Juego completado! Puntuación final: ${this.score}`);
  }

  restartGame() {
    this.currentLevel = 1;
    this.score = 0;
    this.collisionCount = 0;
    
    this.resetLevel();
    this.showStartScreen();
    
    console.log('🔄 Juego reiniciado');
  }

  showModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.classList.add('show');
  }

  hideModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.classList.remove('show');
  }

  toggleTool(toolName, button) {
    // Remover tool active de todos los botones
    document.querySelectorAll('.tool-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    
    // Activar tool seleccionado
    if (button) {
      button.classList.add('active');
    }
    
    console.log(`🔧 Tool activado: ${toolName}`);
  }

  toggleGrid() {
    const gridHelper = this.scene.children.find(child => child instanceof THREE.GridHelper);
    if (gridHelper) {
      gridHelper.visible = !gridHelper.visible;
    }
  }

  startGameLoop() {
    this.animate();
  }

  animate() {
    this.animationId = requestAnimationFrame(() => this.animate());
    
    const deltaTime = this.clock.getDelta();
    
    if (this.gameState === 'playing') {
      this.updateProducts(deltaTime);
      this.world.step(deltaTime);
    }
    
    this.renderer.render(this.scene, this.camera);
  }

  updateProducts(deltaTime) {
    this.products.forEach(product => {
      if (!product.delivered && product.path.length > 0) {
        const target = product.path[product.currentTarget];
        const distance = product.mesh.position.distanceTo(target);
        
        if (distance < 0.1) {
          // Llegó al punto objetivo
          product.currentTarget++;
          
          if (product.currentTarget >= product.path.length) {
            // Producto entregado
            product.delivered = true;
            this.onProductDelivered(product);
          }
        } else {
          // Mover hacia el objetivo
          const direction = new THREE.Vector3()
            .subVectors(target, product.mesh.position)
            .normalize();
          product.mesh.position.add(direction.multiplyScalar(0.02));
        }
      }
    });
    
    // Actualizar estadísticas de juego
    this.updateGameplayStats();
  }

  onProductDelivered(product) {
    // Remover producto de la escena
    this.scene.remove(product.mesh);
    
    // Puntuación por entrega exitosa
    this.score += 100;
    this.updateHUD();
    
    // Efecto de partículas
    this.createDeliveryEffect(this.endPoint.mesh.position);
    
    // Verificar si se completó el objetivo del nivel
    const level = this.levels[this.currentLevel];
    const deliveredProducts = this.products.filter(p => p.delivered).length;
    
    if (deliveredProducts >= level.productsTarget) {
      this.levelComplete();
    } else {
      // Generar nuevo producto
      setTimeout(() => {
        this.spawnProduct();
      }, 1000);
    }
  }

  createDeliveryEffect(position) {
    for (let i = 0; i < 30; i++) {
      setTimeout(() => {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = (position.x * 20 + 50) + '%';
        particle.style.top = (position.z * 20 + 50) + '%';
        particle.style.background = '#34D399';
        
        document.getElementById('particlesContainer').appendChild(particle);
        
        setTimeout(() => {
          particle.remove();
        }, 1000);
      }, i * 30);
    }
  }

  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  destroy() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    if (this.gameTimer) {
      clearInterval(this.gameTimer);
    }
    console.log('🗑️ RoboFlow destruido');
  }
}

// Inicializar el juego cuando el DOM esté listo
let game;
document.addEventListener('DOMContentLoaded', function() {
  console.log('🎮 DOM cargado, iniciando RoboFlow...');
  
  game = new RoboFlowGame();
  
  // Manejar visibilidad de la página
  document.addEventListener('visibilitychange', function() {
    if (document.hidden && game && game.gameState === 'playing') {
      game.pauseGame();
    }
  });
});

// Limpiar al cerrar la página
window.addEventListener('beforeunload', function() {
  if (game) {
    game.destroy();
  }
});
