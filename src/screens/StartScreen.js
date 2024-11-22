import * as PIXI from 'pixi.js';
import { LevelSelect } from './LevelSelect';

export class StartScreen {
  constructor(app, game) {
    this.app = app;
    this.game = game;
    this.container = new PIXI.Container();
  }

  show() {
    this.app.stage.addChild(this.container);
    
    // Create title
    const title = new PIXI.Text('Maze Adventure', {
      fontFamily: 'Arial',
      fontSize: 48,
      fill: 0xffffff,
      align: 'center'
    });
    title.anchor.set(0.5);
    title.position.set(this.app.screen.width / 2, 200);
    this.container.addChild(title);

    // Create start button
    const startButton = this.createButton('Start Game', this.app.screen.width / 2, 300);
    startButton.on('pointerdown', () => {
      this.hide();
      this.game.startGame(1);
    });

    // Create level select button
    const levelButton = this.createButton('Select Level', this.app.screen.width / 2, 380);
    levelButton.on('pointerdown', () => {
      this.hide();
      const levelSelect = new LevelSelect(this.app, this.game);
      levelSelect.show();
    });
  }

  createButton(text, x, y) {
    const button = new PIXI.Container();
    
    const background = new PIXI.Graphics();
    background.beginFill(0x333333);
    background.drawRoundedRect(0, 0, 200, 50, 10);
    background.endFill();
    
    const buttonText = new PIXI.Text(text, {
      fontFamily: 'Arial',
      fontSize: 24,
      fill: 0xffffff
    });
    buttonText.anchor.set(0.5);
    buttonText.position.set(100, 25);
    
    button.addChild(background, buttonText);
    button.position.set(x - 100, y);
    button.interactive = true;
    button.buttonMode = true;
    
    this.container.addChild(button);
    return button;
  }

  hide() {
    this.app.stage.removeChild(this.container);
  }
}