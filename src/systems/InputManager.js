// ============================================
// InputManager — Keyboard + Swipe gestures
// ============================================

export class InputManager {
  constructor(scene) {
    this.scene = scene;
    this.direction = null;
    this.locked = false;

    this.cursors = scene.input.keyboard.createCursorKeys();
    this.wasd = {
      up: scene.input.keyboard.addKey('W'),
      down: scene.input.keyboard.addKey('S'),
      left: scene.input.keyboard.addKey('A'),
      right: scene.input.keyboard.addKey('D')
    };

    this.swipeStart = null;
    this.minSwipeDist = 30;

    scene.input.on('pointerdown', (pointer) => {
      this.swipeStart = { x: pointer.x, y: pointer.y };
    });

    scene.input.on('pointerup', (pointer) => {
      if (!this.swipeStart) return;
      const dx = pointer.x - this.swipeStart.x;
      const dy = pointer.y - this.swipeStart.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist >= this.minSwipeDist) {
        if (Math.abs(dx) > Math.abs(dy)) {
          this.direction = dx > 0 ? 'right' : 'left';
        } else {
          this.direction = dy > 0 ? 'down' : 'up';
        }
      }
      this.swipeStart = null;
    });
  }

  update() {
    if (Phaser.Input.Keyboard.JustDown(this.cursors.left) || Phaser.Input.Keyboard.JustDown(this.wasd.left)) {
      this.direction = 'left';
    } else if (Phaser.Input.Keyboard.JustDown(this.cursors.right) || Phaser.Input.Keyboard.JustDown(this.wasd.right)) {
      this.direction = 'right';
    } else if (Phaser.Input.Keyboard.JustDown(this.cursors.up) || Phaser.Input.Keyboard.JustDown(this.wasd.up)) {
      this.direction = 'up';
    } else if (Phaser.Input.Keyboard.JustDown(this.cursors.down) || Phaser.Input.Keyboard.JustDown(this.wasd.down)) {
      this.direction = 'down';
    }
  }

  consume() {
    const dir = this.direction;
    this.direction = null;
    return dir;
  }
}
