import Vue from 'vue'
import Vuex from 'vuex'
import { MazeGenerator } from '../utils/mazeGenerator'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    currentLevel: 1,
    timeLeft: 300,
    isPaused: false,
    playerPosition: { x: 0, y: 0 },
    maze: [],
    collectedItems: [],
    achievements: [
      {
        id: 'first_win',
        title: '初次胜利',
        description: '首次通关游戏',
        icon: '🏆',
        unlocked: false
      },
      {
        id: 'speed_runner',
        title: '速通玩家',
        description: '在60秒内通关',
        icon: '⏱️',
        unlocked: false
      },
      {
        id: 'collector',
        title: '收藏家',
        description: '收集所有道具',
        icon: '📦',
        unlocked: false
      },
      {
        id: 'survivor',
        title: '生存专家',
        description: '连续通关3次',
        icon: '🛡️',
        unlocked: false
      }
    ],
    timerInterval: null,
    gameStatus: 'playing', // playing | win | lose
    activeEffects: [], // 当前生效的道具效果
    leaderboard: [], // 排行榜数据
    settings: {
      soundEnabled: true,
      musicEnabled: true,
      initialTime: 300,
      difficulty: 'normal',
      musicVolume: 0.5
    }
  },
  mutations: {
    SET_MAZE(state, maze) {
      state.maze = maze
    },
    SET_PLAYER_POSITION(state, position) {
      state.playerPosition = position
    },
    COLLECT_ITEM(state, position) {
      const cell = state.maze[position.y][position.x]
      if (cell.hasItem) {
        cell.hasItem = false
        state.collectedItems.push(position)
      }
    },
    PAUSE_GAME(state) {
      state.isPaused = true
    },
    RESUME_GAME(state) {
      state.isPaused = false
    },
    DECREASE_TIME(state, amount = 1) {
      state.timeLeft = Math.max(0, state.timeLeft - amount)
    },
    INCREASE_TIME(state, amount) {
      state.timeLeft += amount
    },
    COLLECT_ITEM(state, item) {
      state.collectedItems.push(item)
    },
    ADD_ACHIEVEMENT(state, achievement) {
      state.achievements.push(achievement)
    },
    SET_GAME_STATUS(state, status) {
      state.gameStatus = status
    },
    WIN_GAME(state) {
      state.gameStatus = 'win'
      clearInterval(state.timerInterval)
      // 触发弹窗显示
      this._vm.$root.$emit('show-win-modal')
    },
    NEXT_LEVEL(state) {
      state.currentLevel++
      const baseTime = state.settings.initialTime
      const timeBonus = state.currentLevel * 30
      const difficultyMultiplier = {
        easy: 1.2,
        normal: 1,
        hard: 0.8
      }[state.settings.difficulty]
      state.timeLeft = Math.round((baseTime + timeBonus) * difficultyMultiplier)
      state.maze = []
      state.collectedItems = []
      state.activeEffects = []
      state.playerPosition = { x: 0, y: 0 }
    },
    RESET_GAME(state) {
      state.currentLevel = 1
      state.timeLeft = 300
      state.isPaused = false
      state.playerPosition = { x: 0, y: 0 }
      state.maze = []
      state.collectedItems = []
      state.achievements = []
      state.activeEffects = []
      if (state.timerInterval) {
        clearInterval(state.timerInterval)
        state.timerInterval = null
      }
      state.gameStatus = 'playing'
    },
    ADD_EFFECT(state, effect) {
      state.activeEffects.push(effect)
    },
    REMOVE_EFFECT(state, effectType) {
      state.activeEffects = state.activeEffects.filter(e => e.type !== effectType)
    },
    UNLOCK_ACHIEVEMENT(state, achievementId) {
      const achievement = state.achievements.find(a => a.id === achievementId)
      if (achievement) {
        achievement.unlocked = true
      }
    }
  },
  actions: {
    generateMaze({ commit, state }) {
      const baseSize = 15
      const mazeSize = baseSize + Math.floor(state.currentLevel * 1.5)
      const generator = new MazeGenerator(mazeSize, mazeSize, {
        level: state.currentLevel
      })
      const maze = generator.generate()
      commit('SET_MAZE', maze)

      // 添加道具
      const items = [
        {
          type: 'time',
          icon: '⏳',
          description: '增加30秒时间',
          effect: {
            type: 'time',
            amount: 30,
            icon: '⏳',
            description: '时间增加30秒'
          }
        },
        {
          type: 'speed',
          icon: '⚡',
          description: '加速移动2倍',
          effect: {
            type: 'speed',
            multiplier: 2,
            duration: 10000,
            icon: '⚡',
            description: '移动速度提升2倍'
          }
        },
        {
          type: 'map',
          icon: '🗺️',
          description: '显示完整地图10秒',
          effect: {
            type: 'map',
            duration: 10000,
            icon: '🗺️',
            description: '显示完整地图'
          }
        }
      ]

      // 随机放置道具
      const itemCount = Math.floor(mazeSize / 2)
      for (let i = 0; i < itemCount; i++) {
        const x = Math.floor(Math.random() * mazeSize)
        const y = Math.floor(Math.random() * mazeSize)
        if (!maze[y][x].isExit && !maze[y][x].isTrap) {
          const item = items[Math.floor(Math.random() * items.length)]
          maze[y][x].hasItem = true
          maze[y][x].itemEffect = item.effect
        }
      }
      
      // 设置玩家初始位置在左上角
      commit('SET_PLAYER_POSITION', { x: 0, y: 0 })
      
      // 设置迷宫
      commit('SET_MAZE', maze)
    },
    movePlayer({ commit, state }, direction) {
      const { x, y } = state.playerPosition
      const cell = state.maze[y][x]
      let newX = x
      let newY = y

      switch (direction) {
        case 'up':
          if (!cell.top) newY = y - 1
          break
        case 'down':
          if (!cell.bottom) newY = y + 1
          break
        case 'left':
          if (!cell.left) newX = x - 1
          break
        case 'right':
          if (!cell.right) newX = x + 1
          break
      }

      // 检查边界
      if (newX >= 0 && newX < state.maze.length && 
          newY >= 0 && newY < state.maze.length) {
        
        const newCell = state.maze[newY][newX]
        
        // 处理道具收集
        if (newCell.hasItem) {
          commit('COLLECT_ITEM', { x: newX, y: newY })
          newCell.hasItem = false
          
          // 播放收集音效
          if (state.settings.soundEnabled) {
            const audio = new Audio('/sounds/item.mp3')
            audio.play()
          }
          
          // 根据道具类型应用效果
          const effect = newCell.itemEffect
          if (effect) {
            commit('ADD_EFFECT', effect)
            
            // 处理时间道具
            if (effect.type === 'time') {
              commit('INCREASE_TIME', effect.amount)
            }
            
            // 处理速度道具
            if (effect.type === 'speed') {
              // 更新移动速度
              state.moveSpeed = effect.multiplier
              setTimeout(() => {
                state.moveSpeed = 1
                commit('REMOVE_EFFECT', effect.type)
              }, effect.duration)
            }
            
            // 处理地图道具
            if (effect.type === 'map') {
              state.showFullMap = true
              setTimeout(() => {
                state.showFullMap = false
                commit('REMOVE_EFFECT', effect.type)
              }, effect.duration)
            }
          }
        }

        // 处理陷阱
        if (newCell.isTrap) {
          commit('DECREASE_TIME', 10) // 陷阱减少10秒
          newCell.isTrap = false
        }

        // 更新玩家位置
        commit('SET_PLAYER_POSITION', { x: newX, y: newY })

        // 检查是否到达出口
        if (newCell.isExit) {
          commit('SET_GAME_STATUS', 'win')
          clearInterval(state.timerInterval)
        }
      }
    },
    startTimer({ commit, state, dispatch }) {
      if (state.timerInterval) return
      
      state.timerInterval = setInterval(() => {
        if (state.isPaused) return
        
        // 检查是否有减速效果
        const slowEffect = state.activeEffects.find(e => e.type === 'slow')
        const interval = slowEffect ? 2000 : 1000
        
        commit('DECREASE_TIME')
        
        if (state.timeLeft <= 0) {
          clearInterval(state.timerInterval)
          commit('SET_GAME_STATUS', 'lose')
        }
      }, 1000)
    },
    stopTimer({ state }) {
      if (state.timerInterval) {
        clearInterval(state.timerInterval)
        state.timerInterval = null
      }
    },
    fetchLeaderboard({ commit }) {
      // 模拟从API获取排行榜数据
      const mockData = [
        { id: 1, name: '玩家1', time: 120, level: 3 },
        { id: 2, name: '玩家2', time: 150, level: 2 },
        { id: 3, name: '玩家3', time: 180, level: 1 }
      ]
      commit('SET_LEADERBOARD', mockData)
    },
    submitScore({ commit }, { name, time, level }) {
      const newScore = {
        id: Date.now(),
        name,
        time,
        level
      }
      commit('ADD_SCORE', newScore)
    }
  }
})
