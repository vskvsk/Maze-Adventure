import * as PIXI from 'pixi.js';

export class Player {
  constructor(radius) {
    this.radius = radius;
    this.graphics = new PIXI.Graphics();
    this.draw();
  }

  draw() {
    this.graphics.clear();
    
    // Glowing effect
    const gradientSteps = 4;
    for (let i = gradientSteps; i >= 0; i--) {
      const alpha = i / gradientSteps;
      const radius = this.radius * (1 + (gradientSteps - i) / gradientSteps);
      this.graphics.beginFill(0xFFFFFF, alpha * 0.3);
      this.graphics.drawCircle(0, 0, radius);
      this.graphics.endFill();
    }
    
    // Main player circle
    this.graphics.beginFill(0xFFFFFF);
    this.graphics.drawCircle(0, 0, this.radius);
    this.graphics.endFill();
  }

  set x(value) {
    this.graphics.x = value;
  }

  get x() {
    return this.graphics.x;
  }

  set y(value) {
    this.graphics.y = value;
  }

  get y() {
    return this.graphics.y;
  }
}