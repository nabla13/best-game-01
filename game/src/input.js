// Keyboard and mouse input for LUMEN DRIFT.
// Tracks held keys, edge-triggered presses (cleared once per frame), and the
// mouse position in canvas pixels. The game reads this, never the DOM events.
export class Input {
  constructor(canvas) {
    this.canvas = canvas;
    this.keys = new Set();
    this.pressed = new Set();
    this.mouseX = 640;
    this.mouseY = 300;
    this.mouseDown = false;
    this.mousePressed = false;
    this.rightDown = false;
    this.rightPressed = false;
    this.anyGesture = false;
    this._onKeyDown = (event) => {
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.code)) {
        event.preventDefault();
      }
      if (!event.repeat) this.pressed.add(event.code);
      this.keys.add(event.code);
      this.anyGesture = true;
    };
    this._onKeyUp = (event) => {
      this.keys.delete(event.code);
    };
    this._onMouseMove = (event) => {
      const rect = this.canvas.getBoundingClientRect();
      this.mouseX = ((event.clientX - rect.left) / rect.width) * this.canvas.width;
      this.mouseY = ((event.clientY - rect.top) / rect.height) * this.canvas.height;
    };
    this._onMouseDown = (event) => {
      this.anyGesture = true;
      if (event.button === 0) {
        this.mouseDown = true;
        this.mousePressed = true;
      }
      if (event.button === 2) {
        this.rightDown = true;
        this.rightPressed = true;
      }
    };
    this._onMouseUp = (event) => {
      if (event.button === 0) this.mouseDown = false;
      if (event.button === 2) this.rightDown = false;
    };
    this._onBlur = () => {
      this.keys.clear();
      this.mouseDown = false;
      this.rightDown = false;
    };
    this._onContextMenu = (event) => event.preventDefault();
    window.addEventListener('keydown', this._onKeyDown);
    window.addEventListener('keyup', this._onKeyUp);
    window.addEventListener('blur', this._onBlur);
    canvas.addEventListener('mousemove', this._onMouseMove);
    canvas.addEventListener('mousedown', this._onMouseDown);
    window.addEventListener('mouseup', this._onMouseUp);
    canvas.addEventListener('contextmenu', this._onContextMenu);
  }

  down(code) {
    return this.keys.has(code);
  }

  wasPressed(code) {
    return this.pressed.has(code);
  }

  moveX() {
    const left = this.down('KeyA') || this.down('ArrowLeft') ? -1 : 0;
    const right = this.down('KeyD') || this.down('ArrowRight') ? 1 : 0;
    return left + right;
  }

  moveY() {
    const up = this.down('KeyW') || this.down('ArrowUp') ? -1 : 0;
    const down = this.down('KeyS') || this.down('ArrowDown') ? 1 : 0;
    return up + down;
  }

  firing() {
    return this.mouseDown || this.down('KeyJ') || this.down('Space');
  }

  endFrame() {
    this.pressed.clear();
    this.mousePressed = false;
    this.rightPressed = false;
  }
}
