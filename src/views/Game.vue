<template>
  <div class="game-container">
    <div class="maze-area">
      <canvas ref="mazeCanvas"></canvas>
    </div>
    
    <div class="mini-map">
      <canvas ref="miniMapCanvas"></canvas>
    </div>

    <div class="controls">
      <button @click="pauseGame">
        {{ isPaused ? '继续' : '暂停' }}
      </button>
      <button @click="restartGame">重新开始</button>
    </div>

    <!-- 胜利弹窗 -->
    <div v-if="showWinModal" class="modal">
      <div class="modal-content">
        <h2>恭喜通关！</h2>
        <p>用时：{{ 300 - timeLeft }}秒</p>
        <p>收集道具：{{ collectedItems.length }}个</p>
        <button @click="nextLevel">下一关</button>
        <button @click="restartGame">重新开始</button>
        <button @click="shareResult">分享成绩</button>
      </div>
    </div>

    <!-- 失败弹窗 -->
    <div v-if="showLoseModal" class="modal">
      <div class="modal-content">
        <h2>游戏结束</h2>
        <p>很遗憾，时间到了</p>
        <button @click="restartGame">重新开始</button>
      </div>
    </div>
  </div>
</template>

<script>
import { mapState, mapActions } from 'vuex'

export default {
  name: 'Game',
  data() {
    return {
      showWinModal: false,
      showLoseModal: false,
      music: null,
      hasUserInteracted: false,
      canvas: null,
      ctx: null,
      miniMapCanvas: null,
      miniMapCtx: null,
      cellSize: 40,
      miniMapCellSize: 8,
      animationFrame: null,
      lastRenderTime: 0,
      renderInterval: 1000 / 60, // 60 FPS
      transformationActive: false,
      transformationInterval: null
    }
  },
  computed: {
    ...mapState({
      maze: state => state.maze,
      playerPosition: state => state.playerPosition,
      isPaused: state => state.isPaused,
      gameStatus: state => state.gameStatus,
      collectedItems: state => state.collectedItems,
      currentLevel: state => state.currentLevel,
      activeEffects: state => state.activeEffects,
      showFullMap: state => state.showFullMap,
      settings: state => state.settings,
      timeLeft: state => state.timeLeft,
      achievements: state => state.achievements
    }),
    unlockedAchievements() {
      return this.achievements.filter(a => a.unlocked)
    },
    musicVolume() {
      return this.settings.musicVolume
    }
  },
  watch: {
    gameStatus(newStatus) {
      if (newStatus === 'win') {
        this.showWinModal = true
        if (this.settings.soundEnabled) {
          this.playSound('win')
        }
        this.submitScore()
      } else if (newStatus === 'lose') {
        this.showLoseModal = true
        if (this.settings.soundEnabled) {
          this.playSound('lose')
        }
        this.submitScore()
      }
    },
    musicEnabled(newVal) {
      if (newVal) {
        this.playMusic()
      } else {
        this.stopMusic()
      }
    },
    musicVolume(newVal) {
      if (this.music) {
        this.music.volume = newVal
      }
    },
    maze() {
      this.drawMaze() // 监听maze变化并重绘
    }
  },
  methods: {
    ...mapActions(['generateMaze', 'movePlayer', 'startTimer', 'stopTimer', 'startMazeModification']),
    restartGame() {
      this.showWinModal = false
      this.showLoseModal = false
      this.$store.commit('RESET_GAME')
      this.$store.state.timeLeft = this.$store.state.settings.initialTime
      this.generateMaze()
      this.startTimer()
    },
    
    initCanvas() {
      // 主地图canvas
      this.canvas = this.$refs.mazeCanvas
      this.ctx = this.canvas.getContext('2d')
      
      // 小地图canvas
      this.miniMapCanvas = this.$refs.miniMapCanvas
      this.miniMapCtx = this.miniMapCanvas.getContext('2d')
      
      // 确保canvas尺寸正确
      this.canvas.width = this.$el.querySelector('.maze-area').clientWidth
      this.canvas.height = this.$el.querySelector('.maze-area').clientHeight
      this.miniMapCanvas.width = this.$el.querySelector('.mini-map').clientWidth
      this.miniMapCanvas.height = this.$el.querySelector('.mini-map').clientHeight
      
      // 添加防抖处理
      this.resizeCanvas = this.debounce(() => {
        const container = this.$el.querySelector('.maze-area')
        if (!container) return
        
        // 主地图尺寸
        this.canvas.width = container.clientWidth
        this.canvas.height = container.clientHeight
        
        // 小地图尺寸
        const miniMapContainer = this.$el.querySelector('.mini-map')
        if (miniMapContainer) {
          this.miniMapCanvas.width = miniMapContainer.clientWidth
          this.miniMapCanvas.height = miniMapContainer.clientHeight
          this.miniMapCellSize = Math.min(
            this.miniMapCanvas.width / this.maze.length,
            this.miniMapCanvas.height / this.maze.length
          )
        }
        
        if (this.maze.length > 0) {
          this.cellSize = Math.min(
            this.canvas.width / this.maze.length,
            this.canvas.height / this.maze.length
          )
          this.drawMaze() // 立即重绘
        }
      }, 100)
      
      // 初始设置
      this.resizeCanvas()
    },
    
    debounce(func, wait) {
      let timeout
      return function(...args) {
        clearTimeout(timeout)
        timeout = setTimeout(() => {
          func.apply(this, args)
        }, wait)
      }
    },
    
    startAnimation() {
      const animate = (timestamp) => {
        if (timestamp - this.lastRenderTime > this.renderInterval) {
          this.drawMaze()
          this.lastRenderTime = timestamp
        }
        this.animationFrame = requestAnimationFrame(animate)
      }
      animate()
    },
    
    drawMaze() {
      if (!this.ctx || !this.maze.length || !this.miniMapCtx) return
      
      // 清空画布
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
      this.miniMapCtx.clearRect(0, 0, this.miniMapCanvas.width, this.miniMapCanvas.height)
      
      // 绘制迷宫背景
      this.ctx.fillStyle = '#222'
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)
      
      // 绘制迷宫
      this.ctx.strokeStyle = '#00ff00'
      this.ctx.lineWidth = 2
      
      for (let y = 0; y < this.maze.length; y++) {
        for (let x = 0; x < this.maze[y].length; x++) {
          const cell = this.maze[y][x]
          const xPos = x * this.cellSize
          const yPos = y * this.cellSize
          
          // 绘制墙壁
          if (cell.top) {
            this.ctx.beginPath()
            this.ctx.moveTo(xPos, yPos)
            this.ctx.lineTo(xPos + this.cellSize, yPos)
            this.ctx.stroke()
          }
          if (cell.right) {
            this.ctx.beginPath()
            this.ctx.moveTo(xPos + this.cellSize, yPos)
            this.ctx.lineTo(xPos + this.cellSize, yPos + this.cellSize)
            this.ctx.stroke()
          }
          if (cell.bottom) {
            this.ctx.beginPath()
            this.ctx.moveTo(xPos, yPos + this.cellSize)
            this.ctx.lineTo(xPos + this.cellSize, yPos + this.cellSize)
            this.ctx.stroke()
          }
          if (cell.left) {
            this.ctx.beginPath()
            this.ctx.moveTo(xPos, yPos)
            this.ctx.lineTo(xPos, yPos + this.cellSize)
            this.ctx.stroke()
          }
          
          // 绘制出口
          if (cell.isExit) {
            this.ctx.fillStyle = '#ff9800'
            this.ctx.fillRect(xPos + 5, yPos + 5, this.cellSize - 10, this.cellSize - 10)
          }
          
          // 绘制道具
          if (cell.hasItem) {
            this.ctx.fillStyle = '#ffeb3b'
            this.ctx.beginPath()
            this.ctx.arc(
              xPos + this.cellSize / 2,
              yPos + this.cellSize / 2,
              this.cellSize * 0.25,
              0,
              Math.PI * 2
            )
            this.ctx.fill()
          }
          
          // 绘制机关
          if (cell.isMazeTransformer) {
            this.ctx.fillStyle = '#800080' // 紫色
            this.ctx.beginPath()
            this.ctx.arc(
              xPos + this.cellSize / 2,
              yPos + this.cellSize / 2,
              this.cellSize * 0.25,
              0,
              Math.PI * 2
            )
            this.ctx.fill()
          }

          // 绘制陷阱
          if (cell.isTrap) {
            this.ctx.fillStyle = '#f44336'
            this.ctx.beginPath()
            this.ctx.moveTo(xPos + 5, yPos + 5)
            this.ctx.lineTo(xPos + this.cellSize - 5, yPos + this.cellSize - 5)
            this.ctx.moveTo(xPos + this.cellSize - 5, yPos + 5)
            this.ctx.lineTo(xPos + 5, yPos + this.cellSize - 5)
            this.ctx.stroke()
          }
        }
      }
      
      // 绘制玩家
      const playerX = this.playerPosition.x * this.cellSize
      const playerY = this.playerPosition.y * this.cellSize
      this.ctx.fillStyle = '#4caf50'
      this.ctx.beginPath()
      this.ctx.arc(
        playerX + this.cellSize / 2,
        playerY + this.cellSize / 2,
        this.cellSize / 3,
        0,
        Math.PI * 2
      )
      this.ctx.fill()

      // 绘制小地图
      this.miniMapCtx.strokeStyle = '#00ff00'
      this.miniMapCtx.lineWidth = 1
      
      for (let y = 0; y < this.maze.length; y++) {
        for (let x = 0; x < this.maze[y].length; x++) {
          const cell = this.maze[y][x]
          const xPos = x * this.miniMapCellSize
          const yPos = y * this.miniMapCellSize
          
          // 绘制墙壁
          if (cell.top) {
            this.miniMapCtx.beginPath()
            this.miniMapCtx.moveTo(xPos, yPos)
            this.miniMapCtx.lineTo(xPos + this.miniMapCellSize, yPos)
            this.miniMapCtx.stroke()
          }
          if (cell.right) {
            this.miniMapCtx.beginPath()
            this.miniMapCtx.moveTo(xPos + this.miniMapCellSize, yPos)
            this.miniMapCtx.lineTo(xPos + this.miniMapCellSize, yPos + this.miniMapCellSize)
            this.miniMapCtx.stroke()
          }
          if (cell.bottom) {
            this.miniMapCtx.beginPath()
            this.miniMapCtx.moveTo(xPos, yPos + this.miniMapCellSize)
            this.miniMapCtx.lineTo(xPos + this.miniMapCellSize, yPos + this.miniMapCellSize)
            this.miniMapCtx.stroke()
          }
          if (cell.left) {
            this.miniMapCtx.beginPath()
            this.miniMapCtx.moveTo(xPos, yPos)
            this.miniMapCtx.lineTo(xPos, yPos + this.miniMapCellSize)
            this.miniMapCtx.stroke()
          }
          
          // 绘制出口
          if (cell.isExit) {
            this.miniMapCtx.fillStyle = '#ff9800'
            this.miniMapCtx.fillRect(xPos + 1, yPos + 1, this.miniMapCellSize - 2, this.miniMapCellSize - 2)
          }
          
          // 绘制道具
          if (cell.hasItem) {
            this.miniMapCtx.fillStyle = '#ffeb3b'
            this.miniMapCtx.beginPath()
            this.miniMapCtx.arc(
              xPos + this.miniMapCellSize / 2,
              yPos + this.miniMapCellSize / 2,
              this.miniMapCellSize * 0.4,
              0,
              Math.PI * 2
            )
            this.miniMapCtx.fill()
          }
          
          // 绘制机关
          if (cell.isMazeTransformer) {
            this.miniMapCtx.fillStyle = '#800080'
            this.miniMapCtx.beginPath()
            this.miniMapCtx.arc(
              xPos + this.miniMapCellSize / 2,
              yPos + this.miniMapCellSize / 2,
              this.miniMapCellSize * 0.4,
              0,
              Math.PI * 2
            )
            this.miniMapCtx.fill()
          }

          // 绘制陷阱
          if (cell.isTrap) {
            this.miniMapCtx.fillStyle = '#f44336'
            this.miniMapCtx.fillRect(xPos + 2, yPos + 2, this.miniMapCellSize - 4, this.miniMapCellSize - 4)
          }
        }
      }
      
      // 绘制小地图玩家
      const miniPlayerX = this.playerPosition.x * this.miniMapCellSize
      const miniPlayerY = this.playerPosition.y * this.miniMapCellSize
      this.miniMapCtx.fillStyle = '#4caf50'
      this.miniMapCtx.fillRect(miniPlayerX, miniPlayerY, this.miniMapCellSize, this.miniMapCellSize)
    },
    pauseGame() {
      if (this.isPaused) {
        this.$store.commit('RESUME_GAME')
        this.startTimer()
        if (this.settings.musicEnabled && this.music) {
          this.music.play()
        }
      } else {
        this.$store.commit('PAUSE_GAME')
        this.stopTimer()
        if (this.music) {
          this.music.pause()
        }
      }
    },
    handleKeydown(event) {
      // 标记用户已交互
      if (!this.hasUserInteracted) {
        this.hasUserInteracted = true
        if (this.settings.musicEnabled) {
          this.playMusic('background')
        }
      }

      const keyMap = {
        ArrowUp: 'up',
        ArrowDown: 'down',
        ArrowLeft: 'left',
        ArrowRight: 'right',
        w: 'up',
        s: 'down',
        a: 'left',
        d: 'right',
        // 添加备用方向键映射
        'W': 'up',
        'S': 'down',
        'A': 'left',
        'D': 'right'
      }
      
      const direction = keyMap[event.key]
      if (direction) {
        // 阻止默认行为（页面滚动）
        event.preventDefault()
        
        // 检查移动是否合法
        const newPos = this.calculateNewPosition(direction)
          if (this.isValidMove(newPos)) {
            this.$store.commit('SET_PLAYER_POSITION', newPos)
            
            // 检查是否吃到金币
            const currentCell = this.maze[newPos.y][newPos.x]
            if (currentCell.hasItem) {
              this.$store.commit('COLLECT_ITEM', { x: newPos.x, y: newPos.y })
              // 更新当前单元格状态
              this.$set(this.maze[newPos.y][newPos.x], 'hasItem', false)
              if (this.settings.soundEnabled) {
                this.playSound('item')
              }
            }
            
            // 检查是否触发机关
            if (currentCell.isMazeTransformer) {
              this.startMazeTransformation()
            }
            
            // 检查是否到达终点
            if (currentCell.isExit) {
              this.$store.commit('WIN_GAME')
              return
            }
            
            this.drawMaze() // 立即重绘
            
            // 播放移动音效
            if (this.settings.soundEnabled) {
              this.playSound('click')
            }
          }
      }
    },

    startMazeTransformation() {
      if (this.transformationActive) return
      
      this.transformationActive = true
      
      // 播放变形音效
      if (this.settings.soundEnabled) {
        this.playSound('trap')
      }
      
      // 首次立即变形
      this.transformMaze()
      
      // 设置10秒间隔的变形
      this.transformationInterval = setInterval(() => {
        this.transformMaze()
      }, 10000)
    },

    stopMazeTransformation() {
      this.transformationActive = false
      clearInterval(this.transformationInterval)
    },

    transformMaze() {
      // 获取当前迷宫
      const maze = this.$store.state.maze
      
      // 计算1/8区域的大小
      const regionWidth = Math.ceil(maze[0].length / 4)
      const regionHeight = Math.ceil(maze.length / 2)
      
      // 固定选择右下角1/8区域
      const startX = maze[0].length - regionWidth
      const startY = maze.length - regionHeight
      
      // 修改该区域内的所有墙壁
      for (let y = startY; y < maze.length; y++) {
        for (let x = startX; x < maze[0].length; x++) {
          // 随机修改一个方向的墙壁
          const directions = ['top', 'right', 'bottom', 'left']
          const randomDir = directions[Math.floor(Math.random() * directions.length)]
          
          // 确保修改后迷宫仍然可解
          const originalState = maze[y][x][randomDir]
          maze[y][x][randomDir] = !originalState
        }
      }
      
      // 更新迷宫状态
      this.$store.commit('UPDATE_MAZE', maze)
      
      // 重绘迷宫
      this.drawMaze()
      
      // 播放整个区域的变形动画
      this.playTransformationAnimation(startX, startY)
    },

    playTransformationAnimation(x, y) {
      // 在变形区域添加视觉效果
      const xPos = x * this.cellSize
      const yPos = y * this.cellSize
      
      this.ctx.fillStyle = 'rgba(128, 0, 128, 0.3)'
      this.ctx.fillRect(xPos, yPos, this.cellSize, this.cellSize)
      
      setTimeout(() => {
        this.drawMaze() // 恢复原状
      }, 500)
    },

    calculateNewPosition(direction) {
      const { x, y } = this.playerPosition
      switch (direction) {
        case 'up': return { x, y: y - 1 }
        case 'down': return { x, y: y + 1 }
        case 'left': return { x: x - 1, y }
        case 'right': return { x: x + 1, y }
        default: return { x, y }
      }
    },

    isValidMove(newPos) {
      const { x, y } = newPos
      // 检查边界
      if (x < 0 || x >= this.maze[0].length || y < 0 || y >= this.maze.length) {
        return false
      }
      
      // 检查墙壁
      const currentCell = this.maze[this.playerPosition.y][this.playerPosition.x]
      const targetCell = this.maze[y][x]
      
      // 检查移动方向是否有墙
      if (newPos.x > this.playerPosition.x && currentCell.right) {
        return false
      }
      if (newPos.x < this.playerPosition.x && currentCell.left) {
        return false
      }
      if (newPos.y > this.playerPosition.y && currentCell.bottom) {
        return false
      }
      if (newPos.y < this.playerPosition.y && currentCell.top) {
        return false
      }
      
      return true
    },
    playSound(type) {
      if (!this.hasUserInteracted) return
      
      // 如果已经有音效在播放，先停止
      if (this.currentSound) {
        this.currentSound.pause()
        this.currentSound.currentTime = 0
      }
      
      // 创建新的音效实例
      const audioSrc = `/sounds/${type}.mp3`
      try {
        const testAudio = new Audio(audioSrc)
        testAudio.load()
      } catch (e) {
        console.error(`无法加载音频文件: ${audioSrc}`, e)
        return
      }
      
      this.currentSound = new Audio(audioSrc)
      this.currentSound.play()
      
      // 音效播放结束后清理
      this.currentSound.addEventListener('ended', () => {
        this.currentSound = null
      })
    },

    playMusic(type = 'background') {
      if (!this.music) {
        const audioSrc = `/music/${type}.mp3`
        try {
          const testAudio = new Audio(audioSrc)
          testAudio.load()
        } catch (e) {
          console.error(`无法加载背景音乐: ${audioSrc}`, e)
          return
        }
        
        this.music = new Audio(audioSrc)
        this.music.loop = true
        this.music.volume = this.musicVolume
      }
      if (this.hasUserInteracted) {
        this.music.play()
      }
    },

    stopMusic() {
      if (this.music) {
        this.music.pause()
        this.music.currentTime = 0
      }
    },

    restartGame() {
      this.showWinModal = false
      this.showLoseModal = false
      this.$store.commit('RESET_GAME')
      this.$store.state.timeLeft = this.$store.state.settings.initialTime
      this.generateMaze()
      this.startTimer()
    },

    async nextLevel() {
      this.showWinModal = false
      this.showLoseModal = false
      this.$store.commit('NEXT_LEVEL')
      await this.generateMaze()
      this.startTimer()
      this.initCanvas() // 重新初始化canvas
      this.drawMaze() // 立即绘制新关卡
      this.$store.commit('SET_GAME_STATUS', 'playing') // 重置游戏状态
    },

    submitScore() {
      const name = prompt('请输入你的名字：')
      if (name) {
        const time = 300 - this.timeLeft
        const level = this.currentLevel
        this.$store.dispatch('submitScore', { name, time, level })
        
        // 检查成就
        if (this.gameStatus === 'win') {
          // 初次胜利
          if (!this.$store.state.achievements.find(a => a.id === 'first_win').unlocked) {
            this.$store.commit('UNLOCK_ACHIEVEMENT', 'first_win')
          }
          
          // 速通玩家
          if (time <= 60) {
            this.$store.commit('UNLOCK_ACHIEVEMENT', 'speed_runner')
          }
          
          // 收藏家
          if (this.collectedItems.length === this.$store.state.maze.flat().filter(cell => cell.hasItem).length) {
            this.$store.commit('UNLOCK_ACHIEVEMENT', 'collector')
          }
        }
      }
    },
    shareResult() {
      const result = {
        time: 300 - this.timeLeft,
        level: this.currentLevel,
        items: this.collectedItems.length
      }
      const text = `我在迷宫游戏中取得了以下成绩：
🎮 关卡：${result.level}
⏱️ 用时：${result.time}秒
📦 收集道具：${result.items}个
快来挑战吧！`
      if (navigator.share) {
        navigator.share({
          title: '迷宫游戏成绩分享',
          text: text
        })
      } else {
        prompt('复制以下内容分享：', text)
      }
    }
  },
  mounted() {
    this.initCanvas()
    this.generateMaze().then(() => {
      this.startAnimation()
    })
    window.addEventListener('keydown', this.handleKeydown)
    window.addEventListener('resize', this.resizeCanvas.bind(this))
    
    // 监听音乐设置变化
    this.$bus.$on('music-setting-changed', (enabled) => {
      if (enabled) {
        this.playMusic('background')
      } else if (this.music) {
        this.music.pause()
      }
    })
  },
  beforeDestroy() {
    window.removeEventListener('keydown', this.handleKeydown)
  }
}

</script>

<style scoped>
.game-container {
  position: relative;
  width: 100%;
  height: 100vh;
  background-color: #111;
}

.maze-area {
  width: 80%;
  height: 80%;
  margin: 0 auto;
  position: relative;
}

.mini-map {
  position: absolute;
  right: 20px;
  top: 20px;
  width: 200px;
  height: 200px;
  border: 2px solid #00ff00;
  background-color: rgba(0, 0, 0, 0.8);
}

.controls {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 10px;
}

button {
  padding: 10px 20px;
  background-color: #4caf50;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
}

.modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
}

.modal-content {
  background-color: #222;
  padding: 20px;
  border-radius: 10px;
  text-align: center;
}

.modal-content h2 {
  color: #4caf50;
  margin-bottom: 20px;
}

.modal-content p {
  color: white;
  margin: 10px 0;
}
</style>
