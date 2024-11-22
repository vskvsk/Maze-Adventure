import * as PIXI from 'pixi.js';
import { MazeGenerator } from './MazeGenerator';
import { Player } from './Player';

export class Game {
  constructor(app, gameState) {
    this.app = app;
    this.gameState = gameState;
    this.currentLevel = 1;
    this.isPlaying = false;
    this.mazeGenerator = new MazeGenerator();
    this.cellSize = 25; // Reduced cell size to fit larger mazes
    this.mazeChangeInterval = null;
    
    this.setup();
  }

  setup() {
    this.container = new PIXI.Container();
    this.app.stage.addChild(this.container);
    
    this.setupControls();
  }

  setupControls() {
    window.addEventListener('keydown', (e) => {
      if (!this.isPlaying) return;
      
      switch(e.key) {
        case 'ArrowUp':
          this.movePlayer('up');
          break;
        case 'ArrowDown':
          this.movePlayer('down');
          break;
        case 'ArrowLeft':
          this.movePlayer('left');
          break;
        case 'ArrowRight':
          this.movePlayer('right');
          break;
      }
    });
  }

  startGame(level = 1) {
    this.currentLevel = level;
    this.isPlaying = true;
    this.container.removeChildren();
    this.generateMaze();
    this.startTime = Date.now();

    // Clear any existing interval
    if (this.mazeChangeInterval) {
      clearInterval(this.mazeChangeInterval);
    }

    // Set up dynamic maze changes for level 2 and above
    if (this.currentLevel >= 2) {
      this.mazeChangeInterval = setInterval(() => {
        if (this.isPlaying) {
          // Store player's relative position
          const playerRelX = this.player.x / this.cellSize;
          const playerRelY = this.player.y / this.cellSize;
          
          // Regenerate maze
          this.container.removeChildren();
          this.generateMaze();
          
          // Restore player's relative position
          this.player.x = playerRelX * this.cellSize;
          this.player.y = playerRelY * this.cellSize;
          
          // Show warning message
          this.showMazeChangeWarning();
        }
      }, 60000); // Change every minute
    }
  }

  showMazeChangeWarning() {
    const warning = new PIXI.Text('Maze is changing!', {
      fontFamily: 'Arial',
      fontSize: 32,
      fill: 0xFF0000
    });
    warning.anchor.set(0.5);
    warning.position.set(this.app.screen.width / 2, 50);
    this.container.addChild(warning);

    setTimeout(() => {
      this.container.removeChild(warning);
    }, 2000);
  }

  generateMaze() {
    const baseSize = 15; // Base size for level 1
    const size = baseSize + Math.floor(this.currentLevel * 1.5); // Increase size with level
    const maze = this.mazeGenerator.generate(size, size);
    this.maze = maze;
    
    const graphics = new PIXI.Graphics();
    this.container.addChild(graphics);
    
    // Calculate scale to fit the maze on screen
    const maxWidth = this.app.screen.width * 0.9;
    const maxHeight = this.app.screen.height * 0.9;
    const mazeWidth = size * this.cellSize;
    const mazeHeight = size * this.cellSize;
    const scale = Math.min(maxWidth / mazeWidth, maxHeight / mazeHeight);
    
    this.container.scale.set(scale);
    this.container.position.x = (this.app.screen.width - mazeWidth * scale) / 2;
    this.container.position.y = (this.app.screen.height - mazeHeight * scale) / 2;
    
    // Draw walls
    graphics.lineStyle(2, 0xFFFFFF);
    
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const cell = maze[y][x];
        const xPos = x * this.cellSize;
        const yPos = y * this.cellSize;
        
        if (cell.walls.top) {
          graphics.moveTo(xPos, yPos);
          graphics.lineTo(xPos + this.cellSize, yPos);
        }
        if (cell.walls.right) {
          graphics.moveTo(xPos + this.cellSize, yPos);
          graphics.lineTo(xPos + this.cellSize, yPos + this.cellSize);
        }
        if (cell.walls.bottom) {
          graphics.moveTo(xPos, yPos + this.cellSize);
          graphics.lineTo(xPos + this.cellSize, yPos + this.cellSize);
        }
        if (cell.walls.left) {
          graphics.moveTo(xPos, yPos);
          graphics.lineTo(xPos, yPos + this.cellSize);
        }
      }
    }

    // Draw entrance and exit markers
    const markerGraphics = new PIXI.Graphics();
    this.container.addChild(markerGraphics);

    // Entrance (green)
    markerGraphics.beginFill(0x00FF00, 0.5);
    markerGraphics.drawRect(0, 0, this.cellSize, this.cellSize);
    markerGraphics.endFill();

    // Exit (red)
    markerGraphics.beginFill(0xFF0000, 0.5);
    markerGraphics.drawRect(
      (size - 1) * this.cellSize,
      (size - 1) * this.cellSize,
      this.cellSize,
      this.cellSize
    );
    markerGraphics.endFill();
    
    // Create player
    this.player = new Player(this.cellSize / 2);
    this.player.x = this.cellSize / 2;
    this.player.y = this.cellSize / 2;
    this.container.addChild(this.player.graphics);
    
    // Add fog of war
    this.setupFogOfWar(size);

    // Add level indicator
    this.addLevelIndicator();
  }

  addLevelIndicator() {
    const levelText = new PIXI.Text(`Level ${this.currentLevel}`, {
      fontFamily: 'Arial',
      fontSize: 24,
      fill: 0xFFFFFF
    });
    levelText.position.set(10, 10);
    this.container.addChild(levelText);
  }

  setupFogOfWar(size) {
    this.fogOfWar = new PIXI.Graphics();
    this.container.addChild(this.fogOfWar);
    this.updateFogOfWar();
  }

  updateFogOfWar() {
    const visibility = this.cellSize * 3;
    this.fogOfWar.clear();
    this.fogOfWar.beginFill(0x000000, 0.8);
    this.fogOfWar.drawRect(0, 0, this.app.screen.width, this.app.screen.height);
    this.fogOfWar.beginFill(0x000000, 0);
    this.fogOfWar.drawCircle(this.player.x, this.player.y, visibility);
    this.fogOfWar.endFill();
  }

  movePlayer(direction) {
    if (!this.isPlaying) return;
    
    const currentCell = {
      x: Math.floor(this.player.x / this.cellSize),
      y: Math.floor(this.player.y / this.cellSize)
    };
    
    let newX = this.player.x;
    let newY = this.player.y;
    const speed = this.cellSize;
    
    switch(direction) {
      case 'up':
        if (!this.maze[currentCell.y][currentCell.x].walls.top) {
          newY -= speed;
        }
        break;
      case 'down':
        if (!this.maze[currentCell.y][currentCell.x].walls.bottom) {
          newY += speed;
        }
        break;
      case 'left':
        if (!this.maze[currentCell.y][currentCell.x].walls.left) {
          newX -= speed;
        }
        break;
      case 'right':
        if (!this.maze[currentCell.y][currentCell.x].walls.right) {
          newX += speed;
        }
        break;
    }
    
    this.player.x = newX;
    this.player.y = newY;
    this.updateFogOfWar();
    
    this.checkWinCondition(currentCell);
  }

  checkWinCondition(currentCell) {
    if (currentCell.x === this.maze[0].length - 1 && currentCell.y === this.maze.length - 1) {
      this.isPlaying = false;
      if (this.mazeChangeInterval) {
        clearInterval(this.mazeChangeInterval);
      }
      const completionTime = (Date.now() - this.startTime) / 1000;
      this.gameState.updateBestTime(this.currentLevel, completionTime);
      this.gameState.unlockLevel(this.currentLevel + 1);
      this.showWinScreen(completionTime);
    }
  }

  showWinScreen(completionTime) {
    const container = new PIXI.Container();
    this.container.addChild(container);

    const overlay = new PIXI.Graphics();
    overlay.beginFill(0x000000, 0.7);
    overlay.drawRect(0, 0, this.app.screen.width, this.app.screen.height);
    overlay.endFill();
    container.addChild(overlay);

    const winText = new PIXI.Text('Level Complete!', {
      fontFamily: 'Arial',
      fontSize: 48,
      fill: 0xFFFFFF
    });
    winText.anchor.set(0.5);
    winText.position.set(this.app.screen.width / 2, this.app.screen.height / 2 - 50);
    container.addChild(winText);

    const timeText = new PIXI.Text(`Time: ${completionTime.toFixed(1)}s`, {
      fontFamily: 'Arial',
      fontSize: 32,
      fill: 0xFFFFFF
    });
    timeText.anchor.set(0.5);
    timeText.position.set(this.app.screen.width / 2, this.app.screen.height / 2 + 20);
    container.addChild(timeText);
    
    setTimeout(() => {
      this.startGame(this.currentLevel + 1);
    }, 2000);
  }
}