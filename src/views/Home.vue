<template>
  <div class="home">
    <h1 class="title">移动迷宫</h1>
    <div class="menu">
      <router-link to="/game" class="menu-item">开始游戏</router-link>
      <router-link to="/leaderboard" class="menu-item">排行榜</router-link>
      <div class="menu-item" @click="showInstructions">游戏说明</div>
      <router-link to="/settings" class="menu-item">设置</router-link>
    </div>

    <!-- 游戏说明弹窗 -->
    <div class="modal-overlay" v-if="showInstructionsModal">
      <div class="modal">
        <h2>游戏说明</h2>
        <div class="instructions-content">
          <p>1. 使用方向键或WASD控制角色移动</p>
          <p>2. 在限定时间内找到出口</p>
          <p>3. 收集道具可以获得特殊能力</p>
          <p>4. 小心陷阱，它们会减少你的时间</p>
          <p>5. 每通过一关，难度会增加</p>
        </div>
        <button @click="closeInstructions">关闭</button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Home',
  data() {
    return {
      showInstructionsModal: false
    }
  },
  methods: {
    showInstructions() {
      this.showInstructionsModal = true
    },
    closeInstructions() {
      this.showInstructionsModal = false
    },
    showSettings() {
      // TODO: 实现设置功能
      alert('设置功能开发中...')
    }
  }
}
</script>

<style scoped>
.home {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  background-color: #1a1a1a;
}

.title {
  color: #00ff00;
  font-size: 3rem;
  margin-bottom: 2rem;
  text-shadow: 0 0 10px #00ff00;
}

.menu {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.menu-item {
  color: #00ff00;
  font-size: 1.5rem;
  padding: 1rem 2rem;
  border: 2px solid #00ff00;
  border-radius: 5px;
  cursor: pointer;
  transition: all 0.3s ease;
  text-decoration: none;
  text-align: center;
}

.menu-item:hover {
  background-color: #00ff00;
  color: #1a1a1a;
  box-shadow: 0 0 10px #00ff00;
}

.modal-overlay {
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

.modal {
  background-color: #1a1a1a;
  padding: 2rem;
  border-radius: 10px;
  border: 2px solid #00ff00;
  max-width: 500px;
  width: 90%;
}

.instructions-content {
  color: #00ff00;
  margin: 1rem 0;
  line-height: 1.6;
}

.modal button {
  background-color: #00ff00;
  color: #1a1a1a;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 5px;
  cursor: pointer;
  margin-top: 1rem;
}

.modal button:hover {
  opacity: 0.8;
}
</style>
