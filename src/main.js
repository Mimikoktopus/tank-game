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
      this.gameLevel = 1;
      this.level = 1;
      this.levelEnemies = 1;  // Starte mit einem Gegner
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
      this.maxWavesPerLevel = 5;  // Basis-Anzahl der Wellen pro Level

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

      // Füge Menü-Button Bild hinzu
      this.menuButtonImage = new Image();
      this.menuButtonImage.src = 'Bilder/Buttons/Menu.png';  // Du musst dieses Bild noch erstellen/hinzufügen
      
      // Menü-Button Position und Größe
      this.menuButton = {
          x: 20,
          y: 20,
          width: 80,
          height: 40,
          isHovered: false
      };

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

      // Füge Menü-Status hinzu
      this.isMenuOpen = false;

      // Lade die Schriftart
      const link = document.createElement('link');
      link.href = 'https://fonts.googleapis.com/css2?family=Black+Ops+One&display=swap';
      link.rel = 'stylesheet';
      document.head.appendChild(link);

      this.init();
  }

  init() {
      this.spawnEnemies();
      this.setupEventListeners();
      this.gameLoop();
  }

  spawnEnemies() {
      const sides = ['top', 'bottom', 'left', 'right'];
      while (this.enemies.length < this.levelEnemies) {
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
      
      // Füge Mouse-Events für den Menü-Button hinzu
      this.canvas.addEventListener('mousemove', (e) => {
          const rect = this.canvas.getBoundingClientRect();
          const mouseX = e.clientX - rect.left;
          const mouseY = e.clientY - rect.top;
          
          this.menuButton.isHovered = (
              mouseX >= this.menuButton.x &&
              mouseX <= this.menuButton.x + this.menuButton.width &&
              mouseY >= this.menuButton.y &&
              mouseY <= this.menuButton.y + this.menuButton.height
          );
      });

      this.canvas.addEventListener('click', (e) => {
          const rect = this.canvas.getBoundingClientRect();
          const mouseX = e.clientX - rect.left;
          const mouseY = e.clientY - rect.top;
          
          if (
              mouseX >= this.menuButton.x &&
              mouseX <= this.menuButton.x + this.menuButton.width &&
              mouseY >= this.menuButton.y &&
              mouseY <= this.menuButton.y + this.menuButton.height
          ) {
              this.toggleMenu();
          }
      });

      // Füge ESC-Taste zum Schließen des Menüs hinzu
      window.addEventListener('keydown', (e) => {
          if (e.key === 'Escape' && this.isMenuOpen) {
              this.toggleMenu();
          }
      });
  }

  handleKeyPress(e) {
      if (this.gameWon && e.key === 'Enter') {
          this.gameWon = false;
          this.gameLevel++;  // Erhöhe das Level
          this.level = 1;    // Setze Wave zurück auf 1
          this.levelEnemies = 1;  // Starte wieder mit einem Gegner
          this.health = 100;  // Volle Gesundheit für das neue Level
          this.spawnEnemies();
          return;
      }
      
      if (this.gameOver && e.key === 'Enter') {
          this.restart();
          return;
      }

      // Neuer Kill-Switch
      if (e.key === 'k' && !this.gameOver && !this.gameWon && !this.isMenuOpen) {
          this.enemies.forEach(enemy => {
              this.points++;  // Punkte für jeden getöteten Gegner
              this.currency++;  // Währung für jeden getöteten Gegner
              this.sounds.explosion.play();
          });
          this.enemies = [];  // Leere das Gegner-Array
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
      // Keine Schüsse wenn das Spiel vorbei ist oder das Menü offen ist
      if (this.gameOver || this.gameWon || this.isMenuOpen) return;
      
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
          // Berechne die Distanz zum Spieler
          const distanceToPlayer = Math.sqrt(
              Math.pow(this.playerX - enemy.x, 2) + 
              Math.pow(this.playerY - enemy.y, 2)
          );
          
          // Nur rotieren und bewegen wenn der Gegner nicht zu nah ist
          if (distanceToPlayer > 20) {  // Von 35 auf 20 reduziert, damit sie näher kommen
              const angle = Math.atan2(
                  this.playerY - enemy.y, 
                  this.playerX - enemy.x
              );
              enemy.rotation = angle;
              enemy.x += Math.cos(angle) * 2.5;
              enemy.y += Math.sin(angle) * 2.5;
          }
          // Wenn kein rotation Wert existiert, setze einen
          if (enemy.rotation === undefined) {
              enemy.rotation = 0;
          }
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

      // Prüfe, ob Level abgeschlossen ist
      if (this.enemies.length === 0) {
          // Berechne die maximale Wellenzahl für das aktuelle Level
          const currentMaxWaves = this.maxWavesPerLevel * this.gameLevel;
          
          // Prüfe, ob die letzte Welle des Levels erreicht wurde
          if (this.level >= currentMaxWaves) {
              this.gameWon = true;  // Aktiviere den Siegesbildschirm
              this.sounds.levelUp.play();
              return;
          }
          
          this.level++;
          this.sounds.levelUp.play();
          this.levelEnemies = Math.ceil(this.level / 2);  // Erhöhe die Gegneranzahl alle 2 Wellen
          this.spawnEnemies();
      }

      // Player-Enemy collision mit größerer Hitbox
      for (let enemy of this.enemies) {
          const distance = Math.sqrt(
              Math.pow(this.playerX - enemy.x, 2) + 
              Math.pow(this.playerY - enemy.y, 2)
          );
          
          if (distance < 45) {  // Von 30 auf 45 erhöht für größere Hitbox
              this.health -= 0.5;
              this.sounds.damage.play();
              
              if (this.health <= 0) {
                  this.health = 0;
                  this.gameOver = true;
                  this.sounds.gameOver.play();
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
          this.ctx.save();
          this.ctx.translate(enemy.x, enemy.y);
          this.ctx.rotate(enemy.rotation);
          this.ctx.drawImage(
              this.enemyImage,
              -this.enemyImage.width/2,
              -this.enemyImage.height/2
          );
          this.ctx.restore();
      });

      // Draw bullets
      this.ctx.fillStyle = 'orange';
      this.bullets.forEach(bullet => {
          this.ctx.beginPath();
          this.ctx.arc(bullet.x, bullet.y, 5, 0, Math.PI * 2);
          this.ctx.fill();
      });

      // Draw UI - Größere Schrift und mehr Abstand
      this.ctx.fillStyle = 'white';
      this.ctx.font = '24px "Black Ops One"';  // von 16px auf 24px erhöht
      
      // Mehr vertikaler Abstand zwischen den Elementen (von +30 auf +40)
      this.ctx.fillText(`Level: ${this.gameLevel}`, this.menuButton.x, this.menuButton.y + this.menuButton.height + 40);
      this.ctx.fillText(`Wave: ${this.level}/${this.maxWavesPerLevel * this.gameLevel}`, this.menuButton.x, this.menuButton.y + this.menuButton.height + 80);
      this.ctx.fillText(`Points: ${this.points}`, this.menuButton.x, this.menuButton.y + this.menuButton.height + 120);
      this.ctx.fillText(`Coins: ${this.currency}`, this.menuButton.x, this.menuButton.y + this.menuButton.height + 160);
      this.ctx.fillText(`Health: ${Math.round(this.health)}`, 10, this.canvas.height - 20);

      // Health Bar in der rechten oberen Ecke - größere Dimensionen
      const healthBarWidth = 300;  // von 200 auf 300 erhöht
      const healthBarHeight = 30;  // von 20 auf 30 erhöht
      const healthBarX = this.canvas.width - healthBarWidth - 20;
      const healthBarY = 20;

      // Äußerer Rahmen
      this.ctx.strokeStyle = 'white';
      this.ctx.lineWidth = 3;  // von 2 auf 3 erhöht für bessere Sichtbarkeit
      this.ctx.strokeRect(healthBarX, healthBarY, healthBarWidth, healthBarHeight);

      // Health-Füllstand
      const currentHealthWidth = (this.health / 100) * healthBarWidth;
      this.ctx.fillStyle = `rgb(${255 - (this.health * 2.55)}, ${this.health * 2.55}, 0)`;
      this.ctx.fillRect(healthBarX, healthBarY, currentHealthWidth, healthBarHeight);

      // Health Bar Text - größere Schrift
      this.ctx.font = '20px "Black Ops One"';  // von 12px auf 20px erhöht
      this.ctx.textAlign = 'center';
      this.ctx.fillStyle = 'white';
      this.ctx.fillText(`${Math.round(this.health)}%`, healthBarX + healthBarWidth/2, healthBarY + 22);  // Y-Position angepasst
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
          this.ctx.font = '32px "Black Ops One"';
          this.ctx.textAlign = 'center';
          this.ctx.fillText(
              `You reached Level ${this.gameLevel}`,
              this.canvas.width/2,
              this.canvas.height - 120
          );
          this.ctx.fillText(
              `(Wave ${this.level})!`,
              this.canvas.width/2,
              this.canvas.height - 80
          );
      }

      // Zeichne den Menü-Button
      this.ctx.save();
      if (this.menuButton.isHovered) {
          this.ctx.globalAlpha = 0.8;
      }
      this.ctx.drawImage(
          this.menuButtonImage,
          this.menuButton.x,
          this.menuButton.y,
          this.menuButton.width,
          this.menuButton.height
      );
      this.ctx.restore();

      // Zeichne das Menü, wenn es geöffnet ist
      if (this.isMenuOpen) {
          // Halbtransparenter schwarzer Hintergrund
          this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
          this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

          // Menü-Box
          const menuWidth = 300;
          const menuHeight = 400;
          const menuX = (this.canvas.width - menuWidth) / 2;
          const menuY = (this.canvas.height - menuHeight) / 2;

          // Menü-Hintergrund
          this.ctx.fillStyle = '#333';
          this.ctx.fillRect(menuX, menuY, menuWidth, menuHeight);
          
          // Menü-Titel
          this.ctx.fillStyle = 'white';
          this.ctx.font = '24px "Black Ops One"';
          this.ctx.textAlign = 'center';
          this.ctx.fillText('MENU', this.canvas.width/2, menuY + 50);

          // Menü-Optionen
          this.ctx.font = '16px "Black Ops One"';
          this.ctx.fillText('Press ESC to close', this.canvas.width/2, menuY + 100);
          this.ctx.fillText(`Level: ${this.gameLevel}`, this.canvas.width/2, menuY + 150);
          this.ctx.fillText(`Wave: ${this.level}/${this.maxWavesPerLevel * this.gameLevel}`, this.canvas.width/2, menuY + 175);
          this.ctx.fillText(`Points: ${this.points}`, this.canvas.width/2, menuY + 200);
          this.ctx.fillText(`Health: ${Math.round(this.health)}%`, this.canvas.width/2, menuY + 250);
      }
  }

  gameLoop() {
      // Nur updaten wenn das Spiel nicht pausiert ist
      if (!this.gameOver && !this.isMenuOpen) {
          this.updatePlayerMovement();
          this.updateBullets();
          this.updateEnemies();
          this.checkCollisions();
      }
      
      this.render();
      requestAnimationFrame(() => this.gameLoop());
  }

  restart() {
      this.playerX = this.canvas.width / 2;
      this.playerY = this.canvas.height / 2;
      this.playerRotation = 0;
      this.level = 1;      // Wave zurücksetzen
      this.levelEnemies = 1;  // Stelle sicher, dass wir mit einem Gegner starten
      this.points = 0;
      this.health = 100;
      this.currency = 0;
      this.enemies = [];
      this.bullets = [];
      this.gameOver = false;
      this.gameWon = false;
      
      this.spawnEnemies();
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

  toggleMenu() {
      this.isMenuOpen = !this.isMenuOpen;
      
      if (this.isMenuOpen) {
          // Spiel pausieren
          this.gamePaused = true;
      } else {
          // Spiel fortsetzen
          this.gamePaused = false;
      }
  }
}

// Start the game when the page loads
window.onload = () => {
  new TankGame();
};