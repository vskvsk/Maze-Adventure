<template>
  <div class="settings-container">
    <h1>设置</h1>
    <div class="settings-content">
      <div class="setting-item">
        <label>音效</label>
        <input 
          type="checkbox" 
          v-model="soundEnabled"
          @change="toggleSound"
        >
      </div>
      <div class="setting-item">
        <label>背景音乐</label>
        <input 
          type="checkbox" 
          v-model="musicEnabled"
          @change="toggleMusic"
        >
      </div>
        <div class="setting-item">
          <label>背景音乐</label>
          <el-switch
            v-model="musicEnabled"
            active-color="#13ce66"
            inactive-color="#ff4949"
            @change="handleMusicChange">
          </el-switch>
          <el-slider
            v-model="musicVolume"
            :min="0"
            :max="1"
            :step="0.1"
            :disabled="!musicEnabled"
            @change="handleVolumeChange"
            style="width: 200px; margin-left: 20px;">
          </el-slider>
        </div>
      <div class="setting-item">
        <label>难度</label>
        <select v-model="difficulty">
          <option value="easy">简单</option>
          <option value="normal">普通</option>
          <option value="hard">困难</option>
        </select>
      </div>
    </div>
    <button @click="saveSettings">保存设置</button>
    <button @click="closeSettings">返回</button>
  </div>
</template>

<script>
import { Switch, Slider } from 'element-ui'

export default {
  name: 'Settings',
  components: {
    'el-switch': Switch,
    'el-slider': Slider
  },
  data() {
    return {
      soundEnabled: true,
      musicEnabled: true,
      musicVolume: 0.5,
      initialTime: 300,
      difficulty: 'normal'
    }
  },
  methods: {
    toggleSound() {
      this.$store.commit('SET_SOUND', this.soundEnabled)
      if (this.soundEnabled) {
        this.playSound('click')
      } else {
        // 立即停止所有音效
        this.stopAllSounds()
      }
    },
    stopAllSounds() {
      const sounds = document.querySelectorAll('audio')
      sounds.forEach(sound => {
        sound.pause()
        sound.currentTime = 0
      })
    },
    toggleMusic() {
      this.$store.commit('SET_MUSIC', this.musicEnabled)
      // 通知Game组件音乐设置变化
      this.$bus.$emit('music-setting-changed', this.musicEnabled)
      if (this.musicEnabled) {
        this.playMusic('background')
      } else {
        this.fadeOutMusic()
      }
    },
    fadeOutMusic() {
      if (this.music) {
        const fadeOutInterval = setInterval(() => {
          if (this.music.volume > 0.1) {
            this.music.volume -= 0.1
          } else {
            clearInterval(fadeOutInterval)
            this.stopMusic()
          }
        }, 100)
      }
    },
    playSound(type) {
      const audio = new Audio(`/sounds/${type}.mp3`)
      audio.play()
    },
    playMusic(type) {
      this.music = new Audio(`/music/${type}.mp3`)
      this.music.loop = true
      this.music.play()
    },
    stopMusic() {
      if (this.music) {
        this.music.pause()
        this.music.currentTime = 0
      }
    },
    saveSettings() {
      const settings = {
        soundEnabled: this.soundEnabled,
        musicEnabled: this.musicEnabled,
        initialTime: this.initialTime,
        difficulty: this.difficulty
      }
      this.$store.commit('SAVE_SETTINGS', settings)
      alert('设置已保存')
    },
    closeSettings() {
      this.$router.go(-1)
    },
    handleMusicChange(value) {
      this.$store.commit('SET_MUSIC', value)
      this.$bus.$emit('music-setting-changed', value)
    },
    handleVolumeChange(value) {
      this.$store.commit('SET_MUSIC_VOLUME', value)
      this.$bus.$emit('music-volume-changed', value)
    }
  }
}
</script>

<style scoped>
.settings-container {
  padding: 20px;
  color: #00ff00;
}

.settings-content {
  max-width: 500px;
  margin: 0 auto;
}

.setting-item {
  margin: 20px 0;
  display: flex;
  align-items: center;
}

.setting-item label {
  flex: 1;
  margin-right: 20px;
}

.setting-item input,
.setting-item select {
  flex: 2;
  padding: 5px;
  background-color: #333;
  color: #00ff00;
  border: 1px solid #00ff00;
}

button {
  background-color: #00ff00;
  color: #1a1a1a;
  border: none;
  padding: 10px 20px;
  margin: 10px;
  cursor: pointer;
}

button:hover {
  opacity: 0.8;
}
</style>
