class TankGame {
  constructor() {
      this.canvas = document.getElementById('app');
      this.ctx = this.canvas.getContext('2d');
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;

      // Game state variables
      this.playerX = this.canvas.width / 2;
      this.playerY = this.canvas.height / 2;
      this.playerRotation = 0;
      this.level = 1;
      this.levelEnemies = 5;
      this.points = 0;
      this.highscore = 0;
      this.health = 100;
      this.currency = 0;
      this.enemies = [];
      this.bullets = [];
      this.gameOver = false;
      this.currentSkin = 1;
      this.turretRotation = 0;

      // Images (placeholder, you'll need to replace with actual image loading)
      this.playerImage = new Image();
      this.playerImage.src = 'PanzerUntersatz.png';
      
      this.turretImage = new Image();
      this.turretImage.src = 'PanzerKanonenturm.png';
      
      this.enemyImage = new Image();
      this.enemyImage.src = 'Feind.png';

      this.background = new Image();
      this.background.src = "Hintergrund.jpg";

      this.gameOverImage = new Image();
      this.gameOverImage.src = "Gameover.jpg";

      this.init();
  }

  init() {
      this.spawnEnemies();
      this.setupEventListeners();
      this.gameLoop();
  }

  spawnEnemies() {
      const sides = ['top', 'bottom', 'left', 'right'];
      while (this.enemies.length < this.level) {
          const side = sides[Math.floor(Math.random() * sides.length)];
          let x, y;
          switch(side) {
              case 'top':
                  x = Math.random() * this.canvas.width;
                  y = -100;
                  break;
              case 'bottom':
                  x = Math.random() * this.canvas.width;
                  y = this.canvas.height + 100;
                  break;
              case 'left':
                  x = -100;
                  y = Math.random() * this.canvas.height;
                  break;
              case 'right':
                  x = this.canvas.width + 100;
                  y = Math.random() * this.canvas.height;
                  break;
          }
          this.enemies.push({ x, y });
      }
  }

  setupEventListeners() {
      window.addEventListener('keydown', (e) => this.handleKeyPress(e));
      window.addEventListener('mousemove', (e) => this.handleMouseMove(e));
      window.addEventListener('mousedown', (e) => this.handleMouseClick(e));
  }

  handleKeyPress(e) {
      if (this.gameOver && e.key === 'Enter') {
          this.restart();
          return;
      }

      const speed = 5;
      switch(e.key) {
          case 'w': 
              this.playerX += Math.cos(this.playerRotation) * speed;
              this.playerY += Math.sin(this.playerRotation) * speed;
              break;
          case 's': 
              this.playerX -= Math.cos(this.playerRotation) * speed;
              this.playerY -= Math.sin(this.playerRotation) * speed;
              break;
          case 'a':
              this.playerRotation -= 0.1;
              break;
          case 'd':
              this.playerRotation += 0.1;
              break;
      }
  }

  handleMouseMove(e) {
      // Berechne Winkel zum Mauszeiger
      this.turretRotation = Math.atan2(
          e.clientY - this.playerY,
          e.clientX - this.playerX
      );
  }

  handleMouseClick(e) {
      this.fireBullet(e);
  }

  fireBullet(e) {
      const bulletSpeed = 10;
      const angle = Math.atan2(
          e.clientY - this.playerY, 
          e.clientX - this.playerX
      );
      this.bullets.push({
          x: this.playerX,
          y: this.playerY,
          dx: Math.cos(angle) * bulletSpeed,
          dy: Math.sin(angle) * bulletSpeed
      });
  }

  updateBullets() {
      for (let i = this.bullets.length - 1; i >= 0; i--) {
          const bullet = this.bullets[i];
          bullet.x += bullet.dx;
          bullet.y += bullet.dy;

          // Remove bullets off screen
          if (
              bullet.x < 0 || 
              bullet.x > this.canvas.width || 
              bullet.y < 0 || 
              bullet.y > this.canvas.height
          ) {
              this.bullets.splice(i, 1);
          }
      }
  }

  updateEnemies() {
      this.enemies.forEach(enemy => {
          const angle = Math.atan2(
              this.playerY - enemy.y, 
              this.playerX - enemy.x
          );
          enemy.x += Math.cos(angle) * 3;
          enemy.y += Math.sin(angle) * 3;
      });
  }

  checkCollisions() {
      // Bullet-Enemy collision
      for (let i = this.bullets.length - 1; i >= 0; i--) {
          for (let j = this.enemies.length - 1; j >= 0; j--) {
              const bullet = this.bullets[i];
              const enemy = this.enemies[j];
              const distance = Math.sqrt(
                  Math.pow(bullet.x - enemy.x, 2) + 
                  Math.pow(bullet.y - enemy.y, 2)
              );
              if (distance < 30) {  // Collision distance
                  this.bullets.splice(i, 1);
                  this.enemies.splice(j, 1);
                  this.points++;
                  this.currency++;
                  break;
              }
          }
      }

      // Player-Enemy collision
      for (let i = this.enemies.length - 1; i >= 0; i--) {
          const enemy = this.enemies[i];
          const distance = Math.sqrt(
              Math.pow(this.playerX - enemy.x, 2) + 
              Math.pow(this.playerY - enemy.y, 2)
          );
          if (distance < 40) {  // Collision distance für Player-Enemy
              this.health -= 1;  // Schaden pro Frame
              if (this.health <= 0) {
                  this.gameOver = true;
              }
          }
      }
  }

  render() {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.ctx.drawImage(
          this.background,
          0,
          0,
          this.canvas.width,
          this.canvas.height
      );

      // Draw player base
      this.ctx.save();
      this.ctx.translate(this.playerX, this.playerY);
      this.ctx.rotate(this.playerRotation);
      this.ctx.drawImage(
          this.playerImage, 
          -this.playerImage.width/2, 
          -this.playerImage.height/2
      );
      this.ctx.restore();
      
      // Draw turret with separate rotation
      this.ctx.save();
      this.ctx.translate(this.playerX, this.playerY);
      this.ctx.rotate(this.turretRotation);
      this.ctx.drawImage(
          this.turretImage,
          -this.turretImage.width/2,
          -this.turretImage.height/2
      );
      this.ctx.restore();

      // Draw enemies
      this.enemies.forEach(enemy => {
          this.ctx.drawImage(
              this.enemyImage, 
              enemy.x - this.enemyImage.width/2, 
              enemy.y - this.enemyImage.height/2
          );
      });

      // Draw bullets
      this.ctx.fillStyle = 'orange';
      this.bullets.forEach(bullet => {
          this.ctx.beginPath();
          this.ctx.arc(bullet.x, bullet.y, 5, 0, Math.PI * 2);
          this.ctx.fill();
      });

      // Draw UI
      this.ctx.fillStyle = 'white';
      this.ctx.font = '20px Arial';
      this.ctx.fillText(`Level: ${this.level}`, 10, 30);
      this.ctx.fillText(`Points: ${this.points}`, 10, 60);
      this.ctx.fillText(`Health: ${this.health}`, 10, 90);
      this.ctx.fillText(`Coins: ${this.currency}`, 10, 120);

      if (this.gameOver) {
          this.ctx.drawImage(
              this.gameOverImage,
              0,
              0,
              this.canvas.width,
              this.canvas.height
          );
      }
  }

  gameLoop() {
      if (!this.gameOver) {
          this.updateBullets();
          this.updateEnemies();
          this.checkCollisions();
          this.render();

          if (this.enemies.length === 0) {
              this.level++;
              this.spawnEnemies();
          }

          requestAnimationFrame(() => this.gameLoop());
      }
  }

  restart() {
      // Reset all game state variables
      this.playerX = this.canvas.width / 2;
      this.playerY = this.canvas.height / 2;
      this.playerRotation = 0;
      this.level = 1;
      this.points = 0;
      this.health = 100;
      this.currency = 0;
      this.enemies = [];
      this.bullets = [];
      this.gameOver = false;
      
      // Restart game loop
      this.spawnEnemies();
      this.gameLoop();
  }
}

// Start the game when the page loads
window.onload = () => {
  new TankGame();
};