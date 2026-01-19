import { Scene } from './Scene.js';
import { Sprite } from '../entities/Sprite.js';

/**
 * PongScene - Simple Pong game with player vs AI
 */
export class PongScene extends Scene {
  constructor() {
    super('PongScene');
    this.gameWidth = 1080;
    this.gameHeight = 600;
    this.offsetY = (1920 - this.gameHeight) / 2; // Center vertically

    // Game objects
    this.playerPaddle = null;
    this.aiPaddle = null;
    this.ball = null;

    // Game state
    this.playerScore = 0;
    this.aiScore = 0;
    this.ballSpeed = 400; // pixels per second
    this.paddleSpeed = 300;

    // Ball direction
    this.ballVelX = this.ballSpeed;
    this.ballVelY = 0;
  }

  init() {
    this.createGameObjects();
    this.resetBall();
  }

  createGameObjects() {
    // Player paddle (left side)
    this.playerPaddle = new Sprite(50, this.offsetY + this.gameHeight / 2 - 50, 20, 100);
    this.playerPaddle.color = '#00ff00';

    // AI paddle (right side)
    this.aiPaddle = new Sprite(this.gameWidth - 70, this.offsetY + this.gameHeight / 2 - 50, 20, 100);
    this.aiPaddle.color = '#ff0000';

    // Ball
    this.ball = new Sprite(this.gameWidth / 2 - 10, this.offsetY + this.gameHeight / 2 - 10, 20, 20);
    this.ball.color = '#ffffff';
  }

  resetBall() {
    this.ball.x = this.gameWidth / 2 - 10;
    this.ball.y = this.offsetY + this.gameHeight / 2 - 10;
    this.ballVelX = this.ballSpeed * (Math.random() > 0.5 ? 1 : -1);
    this.ballVelY = (Math.random() - 0.5) * this.ballSpeed * 0.5;
  }

  update(deltaTime) {
    this.handleInput(deltaTime);
    this.updateAI(deltaTime);
    this.updateBall(deltaTime);
    this.checkCollisions();
    this.checkScore();
  }

  handleInput(deltaTime) {
    // Player controls: Arrow keys or WASD
    if (this.inputHandler.keys['ArrowUp'] || this.inputHandler.keys['KeyW']) {
      this.playerPaddle.y -= this.paddleSpeed * deltaTime;
    }
    if (this.inputHandler.keys['ArrowDown'] || this.inputHandler.keys['KeyS']) {
      this.playerPaddle.y += this.paddleSpeed * deltaTime;
    }

    // Keep paddle in bounds
    this.playerPaddle.y = Math.max(this.offsetY, Math.min(this.offsetY + this.gameHeight - this.playerPaddle.height, this.playerPaddle.y));
  }

  updateAI(deltaTime) {
    // Simple AI: follow the ball
    const paddleCenter = this.aiPaddle.y + this.aiPaddle.height / 2;
    const ballCenter = this.ball.y + this.ball.height / 2;

    if (ballCenter < paddleCenter - 10) {
      this.aiPaddle.y -= this.paddleSpeed * deltaTime * 0.8; // Slightly slower AI
    } else if (ballCenter > paddleCenter + 10) {
      this.aiPaddle.y += this.paddleSpeed * deltaTime * 0.8;
    }

    // Keep AI paddle in bounds
    this.aiPaddle.y = Math.max(this.offsetY, Math.min(this.offsetY + this.gameHeight - this.aiPaddle.height, this.aiPaddle.y));
  }

  updateBall(deltaTime) {
    this.ball.x += this.ballVelX * deltaTime;
    this.ball.y += this.ballVelY * deltaTime;
  }

  checkCollisions() {
    // Ball collision with top/bottom walls
    if (this.ball.y <= this.offsetY || this.ball.y + this.ball.height >= this.offsetY + this.gameHeight) {
      this.ballVelY = -this.ballVelY;
    }

    // Ball collision with paddles
    if (this.ball.x <= this.playerPaddle.x + this.playerPaddle.width &&
        this.ball.x + this.ball.width >= this.playerPaddle.x &&
        this.ball.y + this.ball.height >= this.playerPaddle.y &&
        this.ball.y <= this.playerPaddle.y + this.playerPaddle.height) {
      // Hit player paddle
      this.ballVelX = Math.abs(this.ballVelX); // Ensure moving right
      // Add some angle based on where it hit the paddle
      const hitPos = (this.ball.y + this.ball.height / 2 - this.playerPaddle.y) / this.playerPaddle.height;
      this.ballVelY = (hitPos - 0.5) * this.ballSpeed;
    }

    if (this.ball.x + this.ball.width >= this.aiPaddle.x &&
        this.ball.x <= this.aiPaddle.x + this.aiPaddle.width &&
        this.ball.y + this.ball.height >= this.aiPaddle.y &&
        this.ball.y <= this.aiPaddle.y + this.aiPaddle.height) {
      // Hit AI paddle
      this.ballVelX = -Math.abs(this.ballVelX); // Ensure moving left
      // Add some angle
      const hitPos = (this.ball.y + this.ball.height / 2 - this.aiPaddle.y) / this.aiPaddle.height;
      this.ballVelY = (hitPos - 0.5) * this.ballSpeed;
    }
  }

  checkScore() {
    // Ball goes off left side - AI scores
    if (this.ball.x + this.ball.width < 0) {
      this.aiScore++;
      this.resetBall();
    }
    // Ball goes off right side - Player scores
    if (this.ball.x > this.gameWidth) {
      this.playerScore++;
      this.resetBall();
    }
  }

  populateLayers() {
    // Background
    const bg = {
      render: (ctx) => {
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, this.offsetY, this.gameWidth, this.gameHeight);

        // Center line
        ctx.strokeStyle = '#ffffff';
        ctx.setLineDash([10, 10]);
        ctx.beginPath();
        ctx.moveTo(this.gameWidth / 2, this.offsetY);
        ctx.lineTo(this.gameWidth / 2, this.offsetY + this.gameHeight);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    };
    this.layerManager.addToLayer(bg, 'BG_FAR');

    // Game objects
    this.layerManager.addToLayer(this.playerPaddle, 'MAIN');
    this.layerManager.addToLayer(this.aiPaddle, 'MAIN');
    this.layerManager.addToLayer(this.ball, 'MAIN');

    // Score
    const scoreDisplay = {
      render: (ctx) => {
        ctx.fillStyle = '#ffffff';
        ctx.font = '48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`${this.playerScore} - ${this.aiScore}`, this.gameWidth / 2, this.offsetY - 50);
      }
    };
    this.layerManager.addToLayer(scoreDisplay, 'UI');
  }
}