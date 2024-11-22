export class MazeGenerator {
  generate(width, height) {
    this.width = width;
    this.height = height;
    this.maze = this.initializeMaze();
    this.generateMazeRecursive(0, 0);
    return this.maze;
  }

  initializeMaze() {
    const maze = [];
    for (let y = 0; y < this.height; y++) {
      maze[y] = [];
      for (let x = 0; x < this.width; x++) {
        maze[y][x] = {
          visited: false,
          walls: {
            top: true,
            right: true,
            bottom: true,
            left: true
          }
        };
      }
    }
    return maze;
  }

  generateMazeRecursive(x, y) {
    this.maze[y][x].visited = true;
    
    const directions = this.shuffleDirections();
    
    for (const direction of directions) {
      const [nextX, nextY] = this.getNextCell(x, y, direction);
      
      if (this.isValidCell(nextX, nextY) && !this.maze[nextY][nextX].visited) {
        this.removeWall(x, y, direction);
        this.generateMazeRecursive(nextX, nextY);
      }
    }
  }

  shuffleDirections() {
    const directions = ['top', 'right', 'bottom', 'left'];
    for (let i = directions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [directions[i], directions[j]] = [directions[j], directions[i]];
    }
    return directions;
  }

  getNextCell(x, y, direction) {
    switch(direction) {
      case 'top': return [x, y - 1];
      case 'right': return [x + 1, y];
      case 'bottom': return [x, y + 1];
      case 'left': return [x - 1, y];
    }
  }

  isValidCell(x, y) {
    return x >= 0 && x < this.width && y >= 0 && y < this.height;
  }

  removeWall(x, y, direction) {
    const [nextX, nextY] = this.getNextCell(x, y, direction);
    
    this.maze[y][x].walls[direction] = false;
    
    const oppositeDirection = {
      top: 'bottom',
      right: 'left',
      bottom: 'top',
      left: 'right'
    };
    
    this.maze[nextY][nextX].walls[oppositeDirection[direction]] = false;
  }
}