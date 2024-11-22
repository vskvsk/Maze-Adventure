export class GameState {
  constructor() {
    this.unlockedLevels = [1];
    this.bestTimes = {};
    this.loadProgress();
  }

  loadProgress() {
    const savedState = localStorage.getItem('mazeAdventure');
    if (savedState) {
      const state = JSON.parse(savedState);
      this.unlockedLevels = state.unlockedLevels;
      this.bestTimes = state.bestTimes;
    }
  }

  saveProgress() {
    const state = {
      unlockedLevels: this.unlockedLevels,
      bestTimes: this.bestTimes
    };
    localStorage.setItem('mazeAdventure', JSON.stringify(state));
  }

  unlockLevel(level) {
    if (!this.unlockedLevels.includes(level)) {
      this.unlockedLevels.push(level);
      this.saveProgress();
    }
  }

  updateBestTime(level, time) {
    if (!this.bestTimes[level] || time < this.bestTimes[level]) {
      this.bestTimes[level] = time;
      this.saveProgress();
    }
  }
}