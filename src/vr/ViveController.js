/**
 * @author mrdoob / http://mrdoob.com
 * @author stewdio / http://stewd.io
 */

import { Matrix4, Object3D } from "three";

class ViveController extends Object3D {
  constructor(id) {
    super();

    // var gamepad;

    this.id = id;
    this.axes = [0, 0];
    this.thumbpadIsPressed = false;
    this.triggerIsPressed = false;
    this.gripsArePressed = false;
    this.menuIsPressed = false;

    this.matrixAutoUpdate = false;
    this.standingMatrix = new Matrix4();
  }

  findGamepad(id) {
    // Iterate across gamepads as Vive Controllers may not be
    // in position 0 and 1.

    var gamepads = navigator.getGamepads && navigator.getGamepads();

    for (var i = 0, j = 0; i < gamepads.length; i++) {
      var gamepad = gamepads[i];

      if (
        gamepad &&
        (gamepad.id === "OpenVR Gamepad" ||
          gamepad.id.startsWith("Oculus Touch") ||
          gamepad.id.startsWith("Spatial Controller"))
      ) {
        if (j === id) return gamepad;

        j++;
      }
    }
  }

  getGamepad() {
    return this.gamepad;
  }

  getButtonState(button) {
    if (button === "thumbpad") return this.thumbpadIsPressed;
    if (button === "trigger") return this.triggerIsPressed;
    if (button === "grips") return this.gripsArePressed;
    if (button === "menu") return this.menuIsPressed;
  }

  update() {
    this.gamepad = this.findGamepad(this.id);

    if (this.gamepad !== undefined && this.gamepad.pose !== undefined) {
      if (this.gamepad.pose === null) return; // No user action yet

      //  Position and orientation.

      var pose = this.gamepad.pose;

      if (pose.position !== null) this.position.fromArray(pose.position);
      if (pose.orientation !== null) this.quaternion.fromArray(pose.orientation);
      this.matrix.compose(this.position, this.quaternion, this.scale);
      this.matrix.premultiply(this.standingMatrix);
      this.matrixWorldNeedsUpdate = true;
      this.visible = true;

      //  Thumbpad and Buttons.

      if (this.axes[0] !== this.gamepad.axes[0] || this.axes[1] !== this.gamepad.axes[1]) {
        this.axes[0] = this.gamepad.axes[0]; //  X axis: -1 = Left, +1 = Right.
        this.axes[1] = this.gamepad.axes[1]; //  Y axis: -1 = Bottom, +1 = Top.
        this.dispatchEvent({ type: "axischanged", axes: this.axes });
      }

      if (this.thumbpadIsPressed !== this.gamepad.buttons[0].pressed) {
        this.thumbpadIsPressed = this.gamepad.buttons[0].pressed;
        this.dispatchEvent({
          type: this.thumbpadIsPressed ? "thumbpaddown" : "thumbpadup",
          axes: this.axes,
        });
      }

      if (this.triggerIsPressed !== this.gamepad.buttons[1].pressed) {
        this.triggerIsPressed = this.gamepad.buttons[1].pressed;
        this.dispatchEvent({
          type: this.triggerIsPressed ? "triggerdown" : "triggerup",
        });
      }

      if (this.gripsArePressed !== this.gamepad.buttons[2].pressed) {
        this.gripsArePressed = this.gamepad.buttons[2].pressed;
        this.dispatchEvent({
          type: this.gripsArePressed ? "gripsdown" : "gripsup",
        });
      }

      if (this.menuIsPressed !== this.gamepad.buttons[3].pressed) {
        this.menuIsPressed = this.gamepad.buttons[3].pressed;
        this.dispatchEvent({ type: this.menuIsPressed ? "menudown" : "menuup" });
      }
    } else {
      this.visible = false;
    }
  }
}

export default ViveController;
