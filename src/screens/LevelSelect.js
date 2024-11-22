import * as PIXI from 'pixi.js';
import { StartScreen } from './StartScreen';

export class LevelSelect {
  constructor(app, game) {
    this.app = app;
    this.game = game;
    this.container = new PIXI.Container();
    this.levelsPerRow = 5;
    this.buttonSize = 80;
    this.padding = 20;
  }

  show() {
    this.app.stage.addChild(this.container);

    // Title
    const title = new PIXI.Text('Select Level', {
      fontFamily: 'Arial',
      fontSize: 48,
      fill: 0xFFFFFF
    });
    title.anchor.set(0.5);
    title.position.set(this.app.screen.width / 2, 50);
    this.container.addChild(title);

    // Back button
    const backButton = this.createButton('Back', 60, 50, 100, 40);
    backButton.on('pointerdown', () => {
      this.hide();
      const startScreen = new StartScreen(this.app, this.game);
      startScreen.show();
    });

    // Level buttons
    const unlockedLevels = this.game.gameState.unlockedLevels;
    const totalLevels = 10; // Total number of levels in the game

    for (let i = 0; i < totalLevels; i++) {
      const level = i + 1;
      const row = Math.floor(i / this.levelsPerRow);
      const col = i % this.levelsPerRow;

      const x = (this.app.screen.width - (this.levelsPerRow * (this.buttonSize + this.padding))) / 2 
                + col * (this.buttonSize + this.padding);
      const y = 150 + row * (this.buttonSize + this.padding);

      const isUnlocked = unlockedLevels.includes(level);
      const bestTime = this.game.gameState.bestTimes[level];

      this.createLevelButton(level, x, y, isUnlocked, bestTime);
    }
  }

  createButton(text, x, y, width, height) {
    const button = new PIXI.Container();
    
    const background = new PIXI.Graphics();
    background.beginFill(0x333333);
    background.drawRoundedRect(0, 0, width, height, 10);
    background.endFill();
    
    const buttonText = new PIXI.Text(text, {
      fontFamily: 'Arial',
      fontSize: 20,
      fill: 0xFFFFFF
    });
    buttonText.anchor.set(0.5);
    buttonText.position.set(width / 2, height / 2);
    
    button.addChild(background, buttonText);
    button.position.set(x - width / 2, y - height / 2);
    button.interactive = true;
    button.buttonMode = true;
    
    this.container.addChild(button);
    return button;
  }

  createLevelButton(level, x, y, isUnlocked, bestTime) {
    const button = new PIXI.Container();
    
    // Background
    const background = new PIXI.Graphics();
    background.beginFill(isUnlocked ? 0x333333 : 0x666666);
    background.drawRoundedRect(0, 0, this.buttonSize, this.buttonSize, 10);
    background.endFill();
    
    // Level number
    const levelText = new PIXI.Text(level.toString(), {
      fontFamily: 'Arial',
      fontSize: 32,
      fill: isUnlocked ? 0xFFFFFF : 0x999999
    });
    levelText.anchor.set(0.5);
    levelText.position.set(this.buttonSize / 2, this.buttonSize / 3);
    
    // Best time
    if (bestTime) {
      const timeText = new PIXI.Text(`${bestTime.toFixed(1)}s`, {
        fontFamily: 'Arial',
        fontSize: 16,
        fill: 0xFFFFFF
      });
      timeText.anchor.set(0.5);
      timeText.position.set(this.buttonSize / 2, this.buttonSize * 0.7);
      button.addChild(timeText);
    }
    
    button.addChild(background, levelText);
    button.position.set(x, y);
    
    if (isUnlocked) {
      button.interactive = true;
      button.buttonMode = true;
      button.on('pointerdown', () => {
        this.hide();
        this.game.startGame(level);
      });
    }
    
    this.container.addChild(button);
    return button;
  }

  hide() {
    this.app.stage.removeChild(this.container);
  }
}