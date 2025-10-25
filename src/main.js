import { Howl } from 'howler';

// Cursor-Funktionalität
document.addEventListener('DOMContentLoaded', () => {
  const cursor = document.getElementById('custom-cursor');
  
  document.addEventListener('mousemove', (e) => {
    cursor.style.left = `${e.clientX}px`;
    cursor.style.top = `${e.clientY}px`;
  });
  
  // Cursor beim Verlassen des Fensters ausblenden
  document.addEventListener('mouseout', () => {
    cursor.style.display = 'none';
  });
  
  // Cursor beim Betreten des Fensters einblenden
  document.addEventListener('mouseover', () => {
    cursor.style.display = 'block';
  });
});

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

      // Füge Musik-Lautstärke hinzu
      this.musicVolume = 0.5;  // Musik-Lautstärke
      this.soundVolume = 0.5;  // Sound-Effekt-Lautstärke
      
      // Sound setup mit initialer Lautstärke
      this.sounds = {
          shoot: new Howl({
              src: ['Sounds/Schuss.mp3'],
              volume: this.soundVolume
          }),
          explosion: new Howl({
              src: ['Sounds/TodG.mp3'],
              volume: this.soundVolume
          }),
          damage: new Howl({
              src: ['sounds/damage.mp3'],
              volume: this.soundVolume
          }),
          levelUp: new Howl({
              src: ['Sounds/WonS.mp3'],
              volume: this.soundVolume
          }),
          gameOver: new Howl({
              src: ['Sounds/TodS.mp3'],
              volume: this.soundVolume
          }),
          backgroundMusic: new Howl({
              src: ['Sounds/Music.mp3'],
              volume: this.musicVolume,
              loop: true,
              autoplay: false
          })
      };

      // Füge Menü-Status hinzu
      this.isMenuOpen = false;

      // Füge Musik-Status hinzu
      this.isMusicPlaying = true;

      // Lade die Schriftart
      const link = document.createElement('link');
      link.href = 'https://fonts.googleapis.com/css2?family=Black+Ops+One&display=swap';
      link.rel = 'stylesheet';
      document.head.appendChild(link);

      // Slider-Status für Drag-Funktionalität
      this.isDraggingSlider = false;

      // Slider-Status für beide Regler
      this.isDraggingMusicSlider = false;
      this.isDraggingSoundSlider = false;

      // Bewegungs-Joystick - weiter vom Rand entfernt
      this.joystick = {
          x: 200,  // Von 140 auf 200 erhöht
          y: this.canvas.height - 200,  // Von -140 auf -200 geändert
          baseRadius: 140,
          stickRadius: 60,
          currentX: 0,
          currentY: 0,
          isPressed: false
      };

      // Schieß-Joystick - weiter vom Rand entfernt
      this.shootJoystick = {
          x: this.canvas.width - 200,  // Von -140 auf -200 geändert
          y: this.canvas.height - 200,  // Von -140 auf -200 geändert
          baseRadius: 140,
          stickRadius: 60,
          currentX: 0,
          currentY: 0,
          isPressed: false
      };

      // Initialisiere beide Sticks
      this.joystick.currentX = this.joystick.x;
      this.joystick.currentY = this.joystick.y;
      this.shootJoystick.currentX = this.shootJoystick.x;
      this.shootJoystick.currentY = this.shootJoystick.y;

      // Joystick Sichtbarkeits-Status - standardmäßig ausgeschaltet
      this.showJoystick = false;  // Von true auf false geändert

      // Füge Unverwundbarkeits-Status hinzu
      this.isInvulnerable = false;

      this.init();
  }

  init() {
      this.spawnEnemies();
      this.setupEventListeners();
      
      // Starte die Hintergrundmusik mit initialer Lautstärke
      this.sounds.backgroundMusic.volume(this.musicVolume);
      this.sounds.backgroundMusic.play();
      
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

      // Füge ESC-Taste zum Öffnen/Schließen des Menüs hinzu
      window.addEventListener('keydown', (e) => {
          if (e.key === 'Escape') {  // Geändert von "nur Schließen" zu "Öffnen und Schließen"
              this.toggleMenu();
          }
      });

      // Füge Click-Handler für Musik-Button hinzu
      this.canvas.addEventListener('click', (e) => {
          if (this.isMenuOpen && this.musicButton) {
              const rect = this.canvas.getBoundingClientRect();
              const mouseX = e.clientX - rect.left;
              const mouseY = e.clientY - rect.top;
              
              if (
                  mouseX >= this.musicButton.x &&
                  mouseX <= this.musicButton.x + this.musicButton.width &&
                  mouseY >= this.musicButton.y &&
                  mouseY <= this.musicButton.y + this.musicButton.height
              ) {
                  this.toggleMusic();
              }
          }
      });

      // Slider Event Listeners
      this.canvas.addEventListener('mousedown', (e) => {
          if (this.isMenuOpen) {
              const rect = this.canvas.getBoundingClientRect();
              const mouseX = e.clientX - rect.left;
              const mouseY = e.clientY - rect.top;
              
              // Prüfe Musik-Slider
              if (this.musicSlider && 
                  mouseX >= this.musicSlider.x &&
                  mouseX <= this.musicSlider.x + this.musicSlider.width &&
                  mouseY >= this.musicSlider.y &&
                  mouseY <= this.musicSlider.y + this.musicSlider.height
              ) {
                  this.isDraggingMusicSlider = true;
                  this.updateMusicVolume(mouseX);
              }
              
              // Prüfe Sound-Slider
              if (this.soundSlider && 
                  mouseX >= this.soundSlider.x &&
                  mouseX <= this.soundSlider.x + this.soundSlider.width &&
                  mouseY >= this.soundSlider.y &&
                  mouseY <= this.soundSlider.y + this.soundSlider.height
              ) {
                  this.isDraggingSoundSlider = true;
                  this.updateSoundVolume(mouseX);
              }
          }
      });

      this.canvas.addEventListener('mousemove', (e) => {
          const rect = this.canvas.getBoundingClientRect();
          const mouseX = e.clientX - rect.left;
          
          if (this.isDraggingMusicSlider) {
              this.updateMusicVolume(mouseX);
          }
          if (this.isDraggingSoundSlider) {
              this.updateSoundVolume(mouseX);
          }
      });

      window.addEventListener('mouseup', () => {
          this.isDraggingMusicSlider = false;
          this.isDraggingSoundSlider = false;
      });

      // Touch/Mouse Events für Joystick
      const handleStart = (e) => {
          if (!this.showJoystick) return;
          
          const pos = this.getInputPosition(e);
          
          // Prüfe Bewegungs-Joystick
          const distMove = Math.sqrt(
              Math.pow(pos.x - this.joystick.x, 2) + 
              Math.pow(pos.y - this.joystick.y, 2)
          );
          
          // Prüfe Schieß-Joystick
          const distShoot = Math.sqrt(
              Math.pow(pos.x - this.shootJoystick.x, 2) + 
              Math.pow(pos.y - this.shootJoystick.y, 2)
          );
          
          if (distMove < this.joystick.baseRadius) {
              this.joystick.isPressed = true;
          } else if (distShoot < this.shootJoystick.baseRadius) {
              this.shootJoystick.isPressed = true;
          }
      };

      const handleMove = (e) => {
          if (!this.showJoystick) return;
          
          const pos = this.getInputPosition(e);
          
          // Bewegungs-Joystick Logik
          if (this.joystick.isPressed) {
              const dx = pos.x - this.joystick.x;
              const dy = pos.y - this.joystick.y;
              const distance = Math.sqrt(dx * dx + dy * dy);
              
              if (distance < this.joystick.baseRadius) {
                  this.joystick.currentX = pos.x;
                  this.joystick.currentY = pos.y;
              } else {
                  const angle = Math.atan2(dy, dx);
                  this.joystick.currentX = this.joystick.x + Math.cos(angle) * this.joystick.baseRadius;
                  this.joystick.currentY = this.joystick.y + Math.sin(angle) * this.joystick.baseRadius;
              }
              
              // Berechne Rotation und Bewegung basierend auf Joystick-Position
              const joyDx = this.joystick.currentX - this.joystick.x;
              const joyDy = this.joystick.currentY - this.joystick.y;
              
              if (Math.abs(joyDx) > 10 || Math.abs(joyDy) > 10) {
                  this.playerRotation = Math.atan2(joyDy, joyDx);
                  this.keys.w = true;
              } else {
                  this.keys.w = false;
              }
          }
          
          // Schieß-Joystick Logik
          if (this.shootJoystick.isPressed) {
              const dx = pos.x - this.shootJoystick.x;
              const dy = pos.y - this.shootJoystick.y;
              const distance = Math.sqrt(dx * dx + dy * dy);
              
              if (distance < this.shootJoystick.baseRadius) {
                  this.shootJoystick.currentX = pos.x;
                  this.shootJoystick.currentY = pos.y;
              } else {
                  const angle = Math.atan2(dy, dx);
                  this.shootJoystick.currentX = this.shootJoystick.x + Math.cos(angle) * this.shootJoystick.baseRadius;
                  this.shootJoystick.currentY = this.shootJoystick.y + Math.sin(angle) * this.shootJoystick.baseRadius;
              }
              
              // Aktualisiere Turm-Rotation und schieße
              if (Math.abs(dx) > 10 || Math.abs(dy) > 10) {
                  this.turretRotation = Math.atan2(dy, dx);
                  if (!this.lastShootTime || performance.now() - this.lastShootTime > 250) {
                      this.fireBulletFromJoystick();
                      this.lastShootTime = performance.now();
                  }
              }
          }
      };

      const handleEnd = () => {
          if (!this.showJoystick) return;
          
          this.joystick.isPressed = false;
          this.shootJoystick.isPressed = false;
          this.joystick.currentX = this.joystick.x;
          this.joystick.currentY = this.joystick.y;
          this.shootJoystick.currentX = this.shootJoystick.x;
          this.shootJoystick.currentY = this.shootJoystick.y;
          this.keys.w = false;
      };

      // Mouse Events
      this.canvas.addEventListener('mousedown', handleStart);
      this.canvas.addEventListener('mousemove', handleMove);
      window.addEventListener('mouseup', handleEnd);

      // Touch Events
      this.canvas.addEventListener('touchstart', handleStart);
      this.canvas.addEventListener('touchmove', handleMove);
      window.addEventListener('touchend', handleEnd);

      // Füge Click-Handler für Joystick-Button hinzu
      this.canvas.addEventListener('click', (e) => {
          if (this.isMenuOpen && this.joystickButton) {
              const rect = this.canvas.getBoundingClientRect();
              const mouseX = e.clientX - rect.left;
              const mouseY = e.clientY - rect.top;
              
              if (
                  mouseX >= this.joystickButton.x &&
                  mouseX <= this.joystickButton.x + this.joystickButton.width &&
                  mouseY >= this.joystickButton.y &&
                  mouseY <= this.joystickButton.y + this.joystickButton.height
              ) {
                  this.toggleJoystick();
              }
          }
      });

      // Füge Click-Handler für die Continue/Next Level Buttons hinzu
      this.canvas.addEventListener('click', (e) => {
          const rect = this.canvas.getBoundingClientRect();
          const mouseX = e.clientX - rect.left;
          const mouseY = e.clientY - rect.top;

          // Prüfe Game Over Button
          if (this.gameOver && this.continueButton) {
              if (
                  mouseX >= this.continueButton.x &&
                  mouseX <= this.continueButton.x + this.continueButton.width &&
                  mouseY >= this.continueButton.y &&
                  mouseY <= this.continueButton.y + this.continueButton.height
              ) {
                  this.restart();
              }
          }

          // Prüfe Next Level Button
          if (this.gameWon && this.nextLevelButton) {
              if (
                  mouseX >= this.nextLevelButton.x &&
                  mouseX <= this.nextLevelButton.x + this.nextLevelButton.width &&
                  mouseY >= this.nextLevelButton.y &&
                  mouseY <= this.nextLevelButton.y + this.nextLevelButton.height
              ) {
                  this.gameWon = false;
                  this.gameLevel++;
                  this.level = 1;
                  this.levelEnemies = 1;
                  this.health = 100;
                  this.spawnEnemies();
              }
          }
      });

      // Füge Tastatur-Event für Unverwundbarkeit hinzu
      window.addEventListener('keydown', (e) => {
          if (e.key.toLowerCase() === 'u') {
              this.isInvulnerable = !this.isInvulnerable;  // Toggle Unverwundbarkeit
          }
      });
  }

  handleKeyPress(e) {
      if (this.gameWon && e.key === 'Enter') {
          this.gameWon = false;
          this.gameLevel++;
          this.level = 1;
          this.levelEnemies = 1;
          this.health = 100;
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
      if (this.gameOver || this.gameWon || this.isMenuOpen) return;

      // Berechne Turm-Rotation nur wenn Joysticks nicht aktiv sind
      if (!this.showJoystick || (!this.joystick.isPressed && !this.shootJoystick.isPressed)) {
          const rect = this.canvas.getBoundingClientRect();
          const mouseX = e.clientX - rect.left;
          const mouseY = e.clientY - rect.top;
          
          // Berechne Winkel zur Mausposition
          const dx = mouseX - this.playerX;
          const dy = mouseY - this.playerY;
          this.turretRotation = Math.atan2(dy, dx);
      }
  }

  handleMouseClick(e) {
      // Prüfe zuerst, ob auf den Menü-Button geklickt wurde
      const rect = this.canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      
      // Prüfe Klick auf Menü-Button
      if (
          mouseX >= this.menuButton.x &&
          mouseX <= this.menuButton.x + this.menuButton.width &&
          mouseY >= this.menuButton.y &&
          mouseY <= this.menuButton.y + this.menuButton.height
      ) {
          return;
      }
      
      // Prüfe Klick im Joystick-Bereich
      if (this.showJoystick) {
          // Prüfe Bewegungs-Joystick
          const distToJoystick = Math.sqrt(
              Math.pow(mouseX - this.joystick.x, 2) + 
              Math.pow(mouseY - this.joystick.y, 2)
          );
          
          // Prüfe Schieß-Joystick
          const distToShootJoystick = Math.sqrt(
              Math.pow(mouseX - this.shootJoystick.x, 2) + 
              Math.pow(mouseY - this.shootJoystick.y, 2)
          );
          
          // Wenn Klick in einem der Joystick-Bereiche ist, nicht schießen
          if (distToJoystick <= this.joystick.baseRadius || 
              distToShootJoystick <= this.shootJoystick.baseRadius) {
              return;
          }
      }
      
      // Nur schießen wenn nicht auf Joysticks geklickt wurde
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
              if (distance < 30) {
                  this.bullets.splice(i, 1);
                  this.enemies.splice(j, 1);
                  this.points++;
                  this.currency++;
                  this.sounds.explosion.play();
                  break;
              }
          }
      }

      // Player-Enemy collision mit größerer Hitbox
      for (let enemy of this.enemies) {
          const dx = enemy.x - this.playerX;
          const dy = enemy.y - this.playerY;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < 45) {  // Von 30 auf 45 erhöht für größere Hitbox
              // Nur Schaden nehmen wenn nicht unverwundbar
              if (!this.isInvulnerable) {
                  this.health -= 0.5;
                  this.sounds.damage.play();
              }
          }
      }

      // Prüfe, ob Level abgeschlossen ist
      if (this.enemies.length === 0) {
          // Berechne die maximale Wellenzahl für das aktuelle Level
          const currentMaxWaves = this.maxWavesPerLevel * this.gameLevel;
          
          // Prüfe, ob die letzte Welle des Levels erreicht wurde
          if (this.level >= currentMaxWaves && !this.gameWon) {  // Prüfe ob noch nicht gewonnen
              this.gameWon = true;
              this.sounds.levelUp.play();  // Level-Up Sound wird nur einmal gespielt
              return;
          }
          
          if (!this.gameWon) {  // Nur neue Gegner spawnen wenn nicht gewonnen
              this.level++;
              this.levelEnemies = Math.ceil(this.level / 2);
              this.spawnEnemies();
          }
      }

      if (this.health <= 0 && !this.isInvulnerable) {  // Game Over nur wenn nicht unverwundbar
          this.health = 0;
          this.gameOver = true;
          this.sounds.gameOver.play();
          this.sounds.backgroundMusic.stop();
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

      // Draw bullets first (behind everything else)
      this.ctx.fillStyle = 'orange';
      this.bullets.forEach(bullet => {
          this.ctx.beginPath();
          this.ctx.arc(bullet.x, bullet.y, 5, 0, Math.PI * 2);
          this.ctx.fill();
      });

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

      // Draw UI - Größere Schrift und mehr Abstand
      this.ctx.fillStyle = 'white';
      this.ctx.font = '24px "Black Ops One"';
      this.ctx.textAlign = 'left';
      
      // Mehr vertikaler Abstand zwischen den Elementen
      this.ctx.fillText(`Level: ${this.gameLevel}`, this.menuButton.x, this.menuButton.y + this.menuButton.height + 40);
      this.ctx.fillText(`Wave: ${this.level}/${this.maxWavesPerLevel * this.gameLevel}`, this.menuButton.x, this.menuButton.y + this.menuButton.height + 80);
      this.ctx.fillText(`Points: ${this.points}`, this.menuButton.x, this.menuButton.y + this.menuButton.height + 120);
      this.ctx.fillText(`Coins: ${this.currency}`, this.menuButton.x, this.menuButton.y + this.menuButton.height + 160);

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
          this.#renderGameOver();
      }

      if (this.gameWon) {
          this.#renderWinScreen();
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
          this.#renderMenu();
      }

      // Zeichne beide Joysticks
      if (!this.gameOver && !this.gameWon && !this.isMenuOpen && this.showJoystick) {
          // Bewegungs-Joystick
          this.ctx.beginPath();
          this.ctx.arc(this.joystick.x, this.joystick.y, this.joystick.baseRadius, 0, Math.PI * 2);
          this.ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
          this.ctx.fill();
          this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
          this.ctx.stroke();

          this.ctx.beginPath();
          this.ctx.arc(
              this.joystick.currentX,
              this.joystick.currentY,
              this.joystick.stickRadius,
              0,
              Math.PI * 2
          );
          this.ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
          this.ctx.fill();

          // Schieß-Joystick
          this.ctx.beginPath();
          this.ctx.arc(this.shootJoystick.x, this.shootJoystick.y, this.shootJoystick.baseRadius, 0, Math.PI * 2);
          this.ctx.fillStyle = 'rgba(255, 0, 0, 0.2)';  // Rötlich für den Schieß-Joystick
          this.ctx.fill();
          this.ctx.strokeStyle = 'rgba(255, 0, 0, 0.4)';
          this.ctx.stroke();

          this.ctx.beginPath();
          this.ctx.arc(
              this.shootJoystick.currentX,
              this.shootJoystick.currentY,
              this.shootJoystick.stickRadius,
              0,
              Math.PI * 2
          );
          this.ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
          this.ctx.fill();
      }

      // Zeige Unverwundbarkeits-Status an
      if (this.isInvulnerable) {
          this.ctx.fillStyle = 'yellow';
          this.ctx.font = '24px "Black Ops One"';
          this.ctx.textAlign = 'center';
          this.ctx.fillText('INVULNERABLE', this.canvas.width/2, 30);
      }
  }

  // Private method for rendering game over screen
  #renderGameOver() {
      this.ctx.drawImage(
          this.gameOverImage,
          0,
          0,
          this.canvas.width,
          this.canvas.height
      );

      // Game Over Continue Button - nochmal 5 Pixel höher
      const buttonWidth = 200;
      const buttonHeight = 50;
      const buttonX = this.canvas.width/2 - buttonWidth/2;
      const buttonY = this.canvas.height - 55;  // Von -50 auf -55 geändert

      // Button Hintergrund
      this.ctx.fillStyle = '#ff0000';
      this.ctx.fillRect(buttonX, buttonY, buttonWidth, buttonHeight);

      // Button Text
      this.ctx.fillStyle = 'white';
      this.ctx.font = '20px "Black Ops One"';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('Play Again', this.canvas.width/2, buttonY + 32);

      // Speichere Button-Position
      this.continueButton = {
          x: buttonX,
          y: buttonY,
          width: buttonWidth,
          height: buttonHeight
      };
  }

  #renderWinScreen() {
      this.ctx.drawImage(
          this.winImage,
          0,
          0,
          this.canvas.width,
          this.canvas.height
      );
      
      // Win Screen Stats - Position ganz nach oben verschoben
      this.ctx.fillStyle = 'white';
      this.ctx.font = '32px "Black Ops One"';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(
          `You reached Level ${this.gameLevel}`,
          this.canvas.width/2,
          100  // Feste Position nahe dem oberen Rand
      );
      this.ctx.fillText(
          `(Wave ${this.level})!`,
          this.canvas.width/2,
          140  // 40 Pixel Abstand zum ersten Text
      );

      // Next Level Button - gleiche Farbe wie Play Again
      const buttonWidth = 200;
      const buttonHeight = 50;
      const buttonX = this.canvas.width/2 - buttonWidth/2;
      const buttonY = this.canvas.height - 100;

      // Button Hintergrund - jetzt in Rot
      this.ctx.fillStyle = '#ff0000';  // Rot statt #555
      this.ctx.fillRect(buttonX, buttonY, buttonWidth, buttonHeight);

      // Button Text
      this.ctx.fillStyle = 'white';
      this.ctx.font = '20px "Black Ops One"';
      this.ctx.fillText('Next Level', this.canvas.width/2, buttonY + 32);

      // Speichere Button-Position
      this.nextLevelButton = {
          x: buttonX,
          y: buttonY,
          width: buttonWidth,
          height: buttonHeight
      };
  }

  // Private method for rendering menu
  #renderMenu() {
      // Halbtransparenter schwarzer Hintergrund
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

      // Menü-Box mit größerer Höhe
      const menuWidth = 300;
      const menuHeight = 500;
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

      // Musik-Slider
      const sliderWidth = 200;
      const sliderHeight = 4;
      const musicSliderY = menuY + 300;
      const soundSliderY = menuY + 370;
      const sliderX = this.canvas.width/2 - sliderWidth/2;
      
      // Funktion zum Zeichnen eines Sliders
      const drawSlider = (y, value, label) => {
          // Slider Hintergrund
          this.ctx.fillStyle = '#555';
          this.ctx.fillRect(sliderX, y, sliderWidth, sliderHeight);
          
          // Slider Fortschritt
          this.ctx.fillStyle = '#fff';
          this.ctx.fillRect(sliderX, y, sliderWidth * value, sliderHeight);
          
          // Slider Knopf
          const knobSize = 15;
          const knobX = sliderX + (sliderWidth * value) - (knobSize/2);
          
          this.ctx.beginPath();
          this.ctx.arc(knobX + knobSize/2, y + sliderHeight/2, knobSize/2, 0, Math.PI * 2);
          this.ctx.fillStyle = '#fff';
          this.ctx.fill();
          
          // Label
          this.ctx.fillStyle = 'white';
          this.ctx.font = '16px "Black Ops One"';
          this.ctx.textAlign = 'center';
          this.ctx.fillText(label, this.canvas.width/2, y - 10);
          
          // Prozentzahl
          this.ctx.fillText(
              `${Math.round(value * 100)}%`,
              this.canvas.width/2,
              y + 25
          );
      };

      // Zeichne beide Slider mit Prozentzahlen
      drawSlider(musicSliderY, this.musicVolume, 'Music Volume');
      drawSlider(soundSliderY, this.soundVolume, 'Sound Effects Volume');

      // Speichere Slider-Positionen für Click-Detection
      const knobSize = 15;
      this.musicSlider = {
          x: sliderX,
          y: musicSliderY - knobSize/2,
          width: sliderWidth,
          height: knobSize
      };
      this.soundSlider = {
          x: sliderX,
          y: soundSliderY - knobSize/2,
          width: sliderWidth,
          height: knobSize
      };

      // Joystick Toggle Button
      const buttonWidth = 150;
      const buttonHeight = 40;
      const buttonX = this.canvas.width/2 - buttonWidth/2;
      const buttonY = menuY + 440;

      // Button Hintergrund
      this.ctx.fillStyle = '#555';
      this.ctx.fillRect(buttonX, buttonY, buttonWidth, buttonHeight);

      // Button Text
      this.ctx.fillStyle = 'white';
      this.ctx.font = '16px "Black Ops One"';
      this.ctx.fillText(
          this.showJoystick ? 'Joystick: ON' : 'Joystick: OFF',
          this.canvas.width/2,
          buttonY + 25
      );

      // Speichere Button-Position für Click-Detection
      this.joystickButton = {
          x: buttonX,
          y: buttonY,
          width: buttonWidth,
          height: buttonHeight
      };

      this.ctx.textAlign = 'left';  // Setze textAlign zurück auf 'left' nach dem Menü
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
      this.level = 1;
      this.levelEnemies = 1;
      this.points = 0;
      this.health = 100;
      this.currency = 0;
      this.enemies = [];
      this.bullets = [];
      this.gameOver = false;
      this.gameWon = false;
      
      this.spawnEnemies();
      // Starte Musik nur wenn sie aktiviert ist
      if (this.isMusicPlaying && !this.sounds.backgroundMusic.playing()) {
          this.sounds.backgroundMusic.play();
      }
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
          // Nur das Spiel pausieren, Musik weiterlaufen lassen wenn aktiviert
          this.gamePaused = true;
      } else {
          // Spiel fortsetzen
          this.gamePaused = false;
      }
  }

  toggleMusic() {
      this.isMusicPlaying = !this.isMusicPlaying;
      if (this.isMusicPlaying) {
          this.sounds.backgroundMusic.play();
      } else {
          this.sounds.backgroundMusic.pause();
          this.sounds.backgroundMusic.stop();  // Komplett stoppen statt nur pausieren
      }
  }

  updateMusicVolume(mouseX) {
      let volume = (mouseX - this.musicSlider.x) / this.musicSlider.width;
      volume = Math.max(0, Math.min(1, volume));
      this.musicVolume = volume;
      this.sounds.backgroundMusic.volume(volume);
  }

  updateSoundVolume(mouseX) {
      let volume = (mouseX - this.soundSlider.x) / this.soundSlider.width;
      volume = Math.max(0, Math.min(1, volume));
      this.soundVolume = volume;
      
      // Aktualisiere die Lautstärke aller Sound-Effekte
      Object.keys(this.sounds).forEach(key => {
          if (key !== 'backgroundMusic') {
              this.sounds[key].volume(volume);
          }
      });
  }

  // Hilfsfunktion zum Ermitteln der Input-Position
  getInputPosition(e) {
      const rect = this.canvas.getBoundingClientRect();
      let x, y;
      
      if (e.touches) {  // Touch Event
          x = e.touches[0].clientX - rect.left;
          y = e.touches[0].clientY - rect.top;
      } else {  // Mouse Event
          x = e.clientX - rect.left;
          y = e.clientY - rect.top;
      }
      
      return { x, y };
  }

  // Neue Methode zum Umschalten des Joysticks
  toggleJoystick() {
      this.showJoystick = !this.showJoystick;
      
      // Wenn Joystick ausgeschaltet wird, setze Bewegung zurück
      if (!this.showJoystick) {
          this.joystick.isPressed = false;
          this.joystick.currentX = this.joystick.x;
          this.joystick.currentY = this.joystick.y;
          this.keys.w = false;
      }
  }

  // Neue Methode zum Schießen vom Joystick
  fireBulletFromJoystick() {
      if (this.gameOver || this.gameWon || this.isMenuOpen) return;
      
      const angle = this.turretRotation;  // Nutze die Turm-Rotation für die Schussrichtung
      
      const bulletSpeed = 10;
      this.bullets.push({
          x: this.playerX,
          y: this.playerY,
          dx: Math.cos(angle) * bulletSpeed,
          dy: Math.sin(angle) * bulletSpeed
      });
      this.sounds.shoot.play();
  }
}

// Start the game when the page loads
window.onload = () => {
  new TankGame();
};