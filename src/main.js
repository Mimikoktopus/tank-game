import { Howl } from 'howler';

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
      this.lastTime = performance.now();
      this.speed = 500; // Pixel pro Sekunde
      this.gameWon = false;

      // Images (placeholder, you'll need to replace with actual image loading)
      this.playerImage = new Image();
      this.playerImage.src = 'Bilder/Panzer1Skins/PanzerUntersatz.png';
      
      this.turretImage = new Image();
      this.turretImage.src = 'Bilder/Panzer1Skins/PanzerKanonenturm.png';
      
      this.enemyImage = new Image();
      this.enemyImage.src = 'Bilder/Sonstige/Feind.png';

      this.background = new Image();
      this.background.src = "Bilder/Hintergrund/Hintergrund.jpg";

      this.gameOverImage = new Image();
      this.gameOverImage.src = "Bilder/Hintergrund/Gameover.jpg";

      this.winImage = new Image();
      this.winImage.src = "Bilder/Hintergrund/win.jpg";

      // Bewegungsstatus für mehrere Tasten
      this.keys = {
          w: false,
          s: false,
          a: false,
          d: false
      };

      // Sound setup
      this.sounds = {
          shoot: new Howl({
              src: ['Sounds/Schuss.mp3'],
              volume: 0.5
          }),
          explosion: new Howl({
              src: ['Sounds/TodG.mp3'],
              volume: 0.6
          }),
          damage: new Howl({
              src: ['sounds/damage.mp3'],
              volume: 0.7
          }),
          levelUp: new Howl({
              src: ['sounds/levelup.mp3'],
              volume: 0.8
          }),
          gameOver: new Howl({
              src: ['sounds/gameover.mp3'],
              volume: 1.0
          })
      };

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
      window.addEventListener('keydown', (e) => {
          // Resume AudioContext on first user interaction
          if (Howler.ctx.state === 'suspended') {
              Howler.ctx.resume();
          }
          this.handleKeyPress(e);
      });
      window.addEventListener('keyup', (e) => {
          if (e.key in this.keys) {
              this.keys[e.key] = false;
          }
      });
      window.addEventListener('mousemove', (e) => this.handleMouseMove(e));
      window.addEventListener('mousedown', (e) => this.handleMouseClick(e));
  }

  handleKeyPress(e) {
      if ((this.gameOver || this.gameWon) && e.key === 'Enter') {
          this.restart();
          return;
      }
      
      if (e.key in this.keys) {
          this.keys[e.key] = true;
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
      this.sounds.shoot.play();
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
                  this.sounds.explosion.play();
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
              if (!this.sounds.damage.playing()) {
                  this.sounds.damage.play();
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
      this.ctx.fillText(`Coins: ${this.currency}`, 10, 90);

      // Health Bar in der rechten oberen Ecke
      const healthBarWidth = 200;
      const healthBarHeight = 20;
      const healthBarX = this.canvas.width - healthBarWidth - 20;
      const healthBarY = 20;

      // Äußerer Rahmen
      this.ctx.strokeStyle = 'white';
      this.ctx.lineWidth = 2;
      this.ctx.strokeRect(healthBarX, healthBarY, healthBarWidth, healthBarHeight);

      // Health-Füllstand
      const currentHealthWidth = (this.health / 100) * healthBarWidth;
      this.ctx.fillStyle = `rgb(${255 - (this.health * 2.55)}, ${this.health * 2.55}, 0)`;
      this.ctx.fillRect(healthBarX, healthBarY, currentHealthWidth, healthBarHeight);

      // Health Text
      this.ctx.fillStyle = 'white';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(`${this.health}%`, healthBarX + healthBarWidth/2, healthBarY + 15);
      this.ctx.textAlign = 'left';

      if (this.gameOver) {
          this.ctx.drawImage(
              this.gameOverImage,
              0,
              0,
              this.canvas.width,
              this.canvas.height
          );
      }

      if (this.gameWon) {
          this.ctx.drawImage(
              this.winImage,
              0,
              0,
              this.canvas.width,
              this.canvas.height
          );
          
          this.ctx.fillStyle = 'white';
          this.ctx.font = '48px Arial';
          this.ctx.textAlign = 'center';
          this.ctx.fillText(
              `Congratulations! You reached Level ${this.level}!`,
              this.canvas.width/2,
              this.canvas.height - 100
          );
      }
  }

  gameLoop() {
      if (!this.gameOver) {
          this.updatePlayerMovement();
          this.updateBullets();
          this.updateEnemies();
          this.checkCollisions();
          this.render();

          if (this.enemies.length === 0) {
              if (this.level % 5 === 0) {
                  this.gameWon = true;
              } else {
                  this.level++;
                  this.sounds.levelUp.play();
                  this.spawnEnemies();
              }
          }
      }
      
      this.render();
      requestAnimationFrame(() => this.gameLoop());
  }

  restart() {
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
      this.gameWon = false;
      
      this.spawnEnemies();
      this.gameLoop();
  }

  // Neue Methode für Bewegungsupdate
  updatePlayerMovement() {
      const currentTime = performance.now();
      const deltaTime = (currentTime - this.lastTime) / 1000;
      this.lastTime = currentTime;
      
      let newX = this.playerX;
      let newY = this.playerY;
      
      if (this.keys.w) {
          newX += Math.cos(this.playerRotation) * this.speed * deltaTime;
          newY += Math.sin(this.playerRotation) * this.speed * deltaTime;
      }
      if (this.keys.s) {
          newX -= Math.cos(this.playerRotation) * this.speed * deltaTime;
          newY -= Math.sin(this.playerRotation) * this.speed * deltaTime;
      }
      if (this.keys.a) {
          this.playerRotation -= 3 * deltaTime;
      }
      if (this.keys.d) {
          this.playerRotation += 3 * deltaTime;
      }

      // Bildschirmgrenzen prüfen
      const padding = 40; // Abstand zum Rand
      this.playerX = Math.max(padding, Math.min(this.canvas.width - padding, newX));
      this.playerY = Math.max(padding, Math.min(this.canvas.height - padding, newY));
  }
}

// Start the game when the page loads
window.onload = () => {
  new TankGame();
};