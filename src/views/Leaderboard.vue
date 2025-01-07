<template>
  <div class="leaderboard-container">
    <h1>🏆 排行榜</h1>
    <div class="leaderboard-content">
      <div class="leaderboard-header">
        <div class="rank">排名</div>
        <div class="name">玩家</div>
        <div class="time">用时</div>
        <div class="level">关卡</div>
      </div>
      <div class="leaderboard-list">
        <div 
          v-for="(record, index) in leaderboard" 
          :key="record.id"
          class="leaderboard-item"
        >
          <div class="rank">{{ index + 1 }}</div>
          <div class="name">{{ record.name }}</div>
          <div class="time">{{ record.time }} 秒</div>
          <div class="level">第 {{ record.level }} 关</div>
        </div>
      </div>
      <button class="share-button" @click="shareLeaderboard">
        📤 分享排行榜
      </button>
    </div>
  </div>
</template>

<script>
import { mapState } from 'vuex'

export default {
  name: 'Leaderboard',
  computed: {
    ...mapState({
      leaderboard: state => state.leaderboard
    })
  },
  methods: {
    shareLeaderboard() {
      const top3 = this.leaderboard.slice(0, 3).map((record, index) => {
        const medal = ['🥇', '🥈', '🥉'][index];
        return `${medal} ${record?.name || '暂无'} - ${record?.time || 0}秒`;
      });

      const text = `《移动迷宫》排行榜：\n${top3.join('\n')}\n\n快来挑战吧！`;

      if (navigator.share) {
        navigator.share({
          title: '移动迷宫排行榜',
          text: text,
          url: window.location.href
        });
      } else {
        prompt('复制以下内容分享：', text);
      }
    }
  },
  mounted() {
    this.$store.dispatch('fetchLeaderboard')
  }
}
</script>

<style scoped>
.leaderboard-container {
  padding: 20px;
  color: #00ff00;
}

.leaderboard-content {
  max-width: 800px;
  margin: 0 auto;
  border: 2px solid #00ff00;
  padding: 20px;
}

.leaderboard-header {
  display: flex;
  font-weight: bold;
  border-bottom: 1px solid #00ff00;
  padding-bottom: 10px;
  margin-bottom: 10px;
}

.leaderboard-header > div {
  flex: 1;
  text-align: center;
}

.leaderboard-list {
  max-height: 500px;
  overflow-y: auto;
}

.leaderboard-item {
  display: flex;
  padding: 10px 0;
  border-bottom: 1px solid rgba(0, 255, 0, 0.2);
}

.leaderboard-item > div {
  flex: 1;
  text-align: center;
}

.leaderboard-item:last-child {
  border-bottom: none;
}

.share-button {
  margin-top: 20px;
  padding: 10px 20px;
  background-color: #00ff00;
  color: #1a1a1a;
  border: none;
  border-radius: 5px;
  cursor: pointer;
}

.share-button:hover {
  opacity: 0.8;
}
</style>
