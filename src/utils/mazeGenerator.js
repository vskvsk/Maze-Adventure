// 基于Prim算法的迷宫生成器
export class MazeGenerator {
  constructor(width, height, options = {}) {
    this.width = width
    this.height = height
    this.grid = this.createGrid()
    this.entry = null
    this.exit = null
    this.options = {
      complexity: 0.75 + (options.level || 1) * 0.05, // 复杂度随关卡增加
      randomness: 0.7 + (options.level || 1) * 0.02,  // 随机性随关卡增加
      minPathLength: Math.floor((width + height) * (1.5 + (options.level || 1) * 0.1)), // 路径长度随关卡增加
      deadEnds: Math.floor((width * height) / (3 - (options.level || 1) * 0.1)), // 死胡同数量随关卡增加
      ...options
    }
  }

  createGrid() {
    return Array.from({ length: this.height }, () => 
      Array.from({ length: this.width }, () => ({
        top: true,
        right: true,
        bottom: true,
        left: true,
        visited: false,
        isExit: false,
        isEntry: false,
        hasItem: false,
        isTrap: false,
        isMazeTransformer: false
      }))
    )
  }

  generate() {
    // 随机选择起始点
    const startX = Math.floor(Math.random() * this.width)
    const startY = Math.floor(Math.random() * this.height)
    this.grid[startY][startX].visited = true
    
    // 初始化边界列表
    const walls = this.getCellWalls(startX, startY)
    
    while (walls.length > 0) {
      // 随机选择一面墙
      const randomIndex = Math.floor(Math.random() * walls.length)
      const { x, y, direction } = walls[randomIndex]
      
      // 获取相邻单元格
      const [nx, ny] = this.getNeighbor(x, y, direction)
      
      if (this.isInBounds(nx, ny) && !this.grid[ny][nx].visited) {
        // 打通当前墙
        this.removeWall(x, y, direction)
        this.grid[ny][nx].visited = true
        
        // 添加新边界
        walls.push(...this.getCellWalls(nx, ny))
      }
      
      // 移除已处理的墙
      walls.splice(randomIndex, 1)
    }

    // 添加入口和出口
    this.addEntryAndExit()
    
    // 添加道具和陷阱
    this.addItemsAndTraps()
    
    return this.grid
  }

  getCellWalls(x, y) {
    const walls = []
    if (x > 0) walls.push({ x, y, direction: 'left' })
    if (x < this.width - 1) walls.push({ x, y, direction: 'right' })
    if (y > 0) walls.push({ x, y, direction: 'top' })
    if (y < this.height - 1) walls.push({ x, y, direction: 'bottom' })
    return walls
  }

  getNeighbor(x, y, direction) {
    switch (direction) {
      case 'left': return [x - 1, y]
      case 'right': return [x + 1, y]
      case 'top': return [x, y - 1]
      case 'bottom': return [x, y + 1]
    }
  }

  isInBounds(x, y) {
    return x >= 0 && x < this.width && y >= 0 && y < this.height
  }

  removeWall(x, y, direction) {
    const [nx, ny] = this.getNeighbor(x, y, direction)
    switch (direction) {
      case 'left':
        this.grid[y][x].left = false
        this.grid[ny][nx].right = false
        break
      case 'right':
        this.grid[y][x].right = false
        this.grid[ny][nx].left = false
        break
      case 'top':
        this.grid[y][x].top = false
        this.grid[ny][nx].bottom = false
        break
      case 'bottom':
        this.grid[y][x].bottom = false
        this.grid[ny][nx].top = false
        break
    }
  }

  addEntryAndExit() {
    // 随机选择入口和出口
    const entrySide = Math.floor(Math.random() * 4)
    const exitSide = (entrySide + 2) % 4 // 出口在对边
    
    this.entry = this.createOpening(entrySide)
    this.exit = this.createOpening(exitSide)
    
    this.grid[this.entry.y][this.entry.x].isEntry = true
    this.grid[this.exit.y][this.exit.x].isExit = true
  }

  createOpening(side) {
    let x, y
    switch (side) {
      case 0: // 上边
        x = Math.floor(Math.random() * this.width)
        y = 0
        this.grid[y][x].top = false
        break
      case 1: // 右边
        x = this.width - 1
        y = Math.floor(Math.random() * this.height)
        this.grid[y][x].right = false
        break
      case 2: // 下边
        x = Math.floor(Math.random() * this.width)
        y = this.height - 1
        this.grid[y][x].bottom = false
        break
      case 3: // 左边
        x = 0
        y = Math.floor(Math.random() * this.height)
        this.grid[y][x].left = false
        break
    }
    return { x, y }
  }

    addItemsAndTraps() {
      // 添加道具
      const itemCount = Math.floor((this.width * this.height) / 10)
      for (let i = 0; i < itemCount; i++) {
        const x = Math.floor(Math.random() * this.width)
        const y = Math.floor(Math.random() * this.height)
        if (!this.grid[y][x].isExit && !this.grid[y][x].isEntry) {
          this.grid[y][x].hasItem = true
        }
      }

      // 添加陷阱
      const trapCount = Math.floor((this.width * this.height) / 20)
      for (let i = 0; i < trapCount; i++) {
        const x = Math.floor(Math.random() * this.width)
        const y = Math.floor(Math.random() * this.height)
        if (!this.grid[y][x].isExit && !this.grid[y][x].isEntry && !this.grid[y][x].hasItem) {
          this.grid[y][x].isTrap = true
        }
      }

      // 添加一个机关
      let transformerAdded = false
      while (!transformerAdded) {
        const x = Math.floor(Math.random() * this.width)
        const y = Math.floor(Math.random() * this.height)
        if (!this.grid[y][x].isExit && !this.grid[y][x].isEntry && 
            !this.grid[y][x].hasItem && !this.grid[y][x].isTrap) {
          this.grid[y][x].isMazeTransformer = true
          transformerAdded = true
        }
      }
  }
}
