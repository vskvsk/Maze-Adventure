import * as PIXI from 'pixi.js';
import { Game } from './game/Game';
import { StartScreen } from './screens/StartScreen';
import { GameState } from './game/GameState';

// Enable PIXI interaction events
PIXI.settings.INTERACTIVE_TARGET_FINDER = true;

const app = new PIXI.Application({
  width: 800,
  height: 600,
  backgroundColor: 0x000000,
  view: document.getElementById('game-canvas'),
  resolution: window.devicePixelRatio || 1,
  autoDensity: true,
  antialias: true,
  hello: true // Enable WebGL hello message for debugging
});

// Enable interactivity on the stage
app.stage.interactive = true;
app.stage.hitArea = app.screen;

const gameState = new GameState();
const game = new Game(app, gameState);
const startScreen = new StartScreen(app, game);

startScreen.show();