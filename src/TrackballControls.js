/**
 * @author Eberhard Graether / http://egraether.com/
 * @author Mark Lundin 	/ http://mark-lundin.com
 * @author Simone Manini / http://daron1337.github.io
 * @author Luca Antiga 	/ http://lantiga.github.io
 */

import { EventDispatcher, Quaternion, Vector2, Vector3 } from "three";

class TrackballControls extends EventDispatcher {
  constructor(object, domElement) {
    super();

    this.STATE = {
      NONE: -1,
      ROTATE: 0,
      ZOOM: 1,
      PAN: 2,
      TOUCH_ROTATE: 3,
      TOUCH_ZOOM_PAN: 4,
    };

    this.object = object;
    this.domElement = domElement !== undefined ? domElement : document;

    // API
    this.enabled = true;

    this.screen = { left: 0, top: 0, width: 0, height: 0 };

    this.scale = 0.5;
    this.aspect = 1.0;

    this.rotateSpeed = 1.0;
    this.zoomSpeed = 1.2;
    this.panSpeed = 0.3;

    this.noRotate = false;
    this.noZoom = false;
    this.noPan = false;

    this.staticMoving = false;
    this.dynamicDampingFactor = 0.2;

    this.minDistance = 0;
    this.maxDistance = Infinity;

    // Set to true to automatically rotate around the target
    // If auto-rotate is enabled, you must call controls.update() in your animation loop
    this.autoRotate = false;
    this.autoRotateSpeed = 2.0; // 30 seconds per round when fps is 60

    this.keys = [65 /*A*/, 83 /*S*/, 68 /*D*/];

    // internals

    this.target = new Vector3();

    this.EPS = 0.000001;

    this.lastPosition = new Vector3();

    this._state = this.STATE.NONE;
    this._prevState = this.STATE.NONE;
    this._eye = new Vector3();
    this._movePrev = new Vector2();
    this._moveCurr = new Vector2();
    this._lastAxis = new Vector3();
    this._lastAngle = 0;
    this._zoomStart = new Vector2();
    this._zoomEnd = new Vector2();
    this._touchZoomDistanceStart = 0;
    this._touchZoomDistanceEnd = 0;
    this._panStart = new Vector2();
    this._panEnd = new Vector2();

    // for reset

    this.target0 = this.target.clone();
    this.position0 = this.object.position.clone();
    this.up0 = this.object.up.clone();

    // events

    this.changeEvent = { type: "change" };
    this.startEvent = { type: "start" };
    this.endEvent = { type: "end" };

    this.domElement.addEventListener("contextmenu", this.contextmenu.bind(this), false);
    this.domElement.addEventListener("mousedown", this.mousedown.bind(this), false);
    this.domElement.addEventListener("wheel", this.mousewheel.bind(this), false);

    this.domElement.addEventListener("touchstart", this.touchstart.bind(this), false);
    this.domElement.addEventListener("touchend", this.touchend.bind(this), false);
    this.domElement.addEventListener("touchmove", this.touchmove.bind(this), false);

    window.addEventListener("keydown", this.keydown.bind(this), false);
    window.addEventListener("keyup", this.keyup.bind(this), false);

    this.handleResize();

    // force an update at start
    this.update();
  }

  handleResize() {
    if (this.domElement === document) {
      this.screen.left = 0;
      this.screen.top = 0;
      this.screen.width = window.innerWidth;
      this.screen.height = window.innerHeight;
    } else {
      var box = this.domElement.getBoundingClientRect();
      // adjustments come from similar code in the jquery offset() function
      var d = this.domElement.ownerDocument.documentElement;
      this.screen.left = box.left + window.pageXOffset - d.clientLeft;
      this.screen.top = box.top + window.pageYOffset - d.clientTop;
      this.screen.width = box.width;
      this.screen.height = box.height;
    }
  }

  getMouseOnScreen(pageX, pageY) {
    var vector = new Vector2();

    vector.set((pageX - this.screen.left) / this.screen.width, (pageY - this.screen.top) / this.screen.height);

    return vector;
  }

  getMouseOnCircle(pageX, pageY) {
    var vector = new Vector2();

    vector.set(
      (pageX - this.screen.width * 0.5 - this.screen.left) / (this.screen.width * 0.5),
      (this.screen.height + 2 * (this.screen.top - pageY)) / this.screen.width // screen.width intentional
    );

    return vector;
  }

  getAutoRotationAngle(delta) {
    return ((2 * Math.PI) / 60 / 60) * this.autoRotateSpeed * (delta * 60.0);
  }

  rotateCamera(delta) {
    var axis = new Vector3(),
      quaternion = new Quaternion(),
      eyeDirection = new Vector3(),
      objectUpDirection = new Vector3(),
      objectSidewaysDirection = new Vector3(),
      moveDirection = new Vector3(),
      angle,
      dx,
      dy;

    dx = this._moveCurr.x - this._movePrev.x;
    dy = this._moveCurr.y - this._movePrev.y;
    moveDirection.set(dx, dy, 0);
    angle = moveDirection.length();
    angle *= this.rotateSpeed;

    if (this.autoRotate && this._state === this.STATE.NONE) {
      // rotate about vertical axis
      angle = getAutoRotationAngle(delta);
      dx = angle;
      dy = 0;
      moveDirection.set(angle, 0, 0);
    }

    if (angle) {
      this._eye.copy(this.object.position).sub(this.target);

      eyeDirection.copy(this._eye).normalize();
      objectUpDirection.copy(this.object.up).normalize();
      objectSidewaysDirection.crossVectors(objectUpDirection, eyeDirection).normalize();

      objectUpDirection.setLength(dy);
      objectSidewaysDirection.setLength(dx);

      moveDirection.copy(objectUpDirection.add(objectSidewaysDirection));

      axis.crossVectors(moveDirection, this._eye).normalize();

      quaternion.setFromAxisAngle(axis, angle);

      this._eye.applyQuaternion(quaternion);
      this.object.up.applyQuaternion(quaternion);

      this._lastAxis.copy(axis);
      this._lastAngle = angle;
    } else if (!this.staticMoving && this._lastAngle) {
      this._lastAngle *= Math.sqrt(1.0 - this.dynamicDampingFactor);
      this._eye.copy(this.object.position).sub(this.target);
      quaternion.setFromAxisAngle(this._lastAxis, this._lastAngle);
      this._eye.applyQuaternion(quaternion);
      this.object.up.applyQuaternion(quaternion);
    }

    this._movePrev.copy(this._moveCurr);
  }

  zoomCamera() {
    var factor;

    if (this._state === this.STATE.TOUCH_ZOOM_PAN) {
      factor = this._touchZoomDistanceStart / this._touchZoomDistanceEnd;
      this._touchZoomDistanceStart = this._touchZoomDistanceEnd;
      this._eye.multiplyScalar(factor);
    } else {
      factor = 1.0 + (this._zoomEnd.y - this._zoomStart.y) * this.zoomSpeed;

      if (factor !== 1.0 && factor > 0.0) {
        if (this.object.type === "OrthographicCamera") {
          this.scale = this.scale * factor;
        } else {
          this._eye.multiplyScalar(factor);
        }
      }

      if (this.staticMoving) {
        this._zoomStart.copy(this._zoomEnd);
      } else {
        this._zoomStart.y += (this._zoomEnd.y - this._zoomStart.y) * this.dynamicDampingFactor;
      }
    }
  }

  panCamera() {
    var mouseChange = new Vector2(),
      objectUp = new Vector3(),
      pan = new Vector3();

    return function panCamera() {
      mouseChange.copy(this._panEnd).sub(this._panStart);

      if (mouseChange.lengthSq()) {
        mouseChange.multiplyScalar(this._eye.length() * this.panSpeed);

        pan
          .copy(this._eye)
          .cross(this.object.up)
          .setLength(mouseChange.x);
        pan.add(objectUp.copy(this.object.up).setLength(mouseChange.y));

        this.object.position.add(pan);
        this.target.add(pan);

        if (this.staticMoving) {
          this._panStart.copy(this._panEnd);
        } else {
          this._panStart.add(
            mouseChange.subVectors(this._panEnd, this._panStart).multiplyScalar(this.dynamicDampingFactor)
          );
        }
      }
    };
  }

  checkDistances() {
    if (!this.noZoom || !this.noPan) {
      if (this._eye.lengthSq() > this.maxDistance * this.maxDistance) {
        this.object.position.addVectors(this.target, this._eye.setLength(this.maxDistance));
        this._zoomStart.copy(this._zoomEnd);
      }

      if (this._eye.lengthSq() < this.minDistance * this.minDistance) {
        this.object.position.addVectors(this.target, this._eye.setLength(this.minDistance));
        this._zoomStart.copy(this._zoomEnd);
      }
    }
  }

  update(delta) {
    if (this.enabled === false) return;

    delta = delta || 0.0;

    this._eye.subVectors(this.object.position, this.target);

    if (!this.noRotate) {
      this.rotateCamera(delta);
    }

    if (!this.noZoom) {
      this.zoomCamera();
    }

    if (!this.noPan) {
      this.panCamera();
    }

    if (this.object.type === "OrthographicCamera") {
      this.object.top = this.scale;
      this.object.bottom = -this.scale;
      this.object.right = this.scale * this.aspect;
      this.object.left = -this.scale * this.aspect;
      this.object.updateProjectionMatrix();
    } else {
      this.object.position.addVectors(this.target, this._eye);
    }
    this.checkDistances();

    this.object.lookAt(this.target);

    if (this.lastPosition.distanceToSquared(this.object.position) > this.EPS) {
      this.dispatchEvent(this.changeEvent);

      this.lastPosition.copy(this.object.position);
    }
  }

  reset() {
    if (this.enabled === false) return;

    this._state = this.STATE.NONE;
    this._prevState = this.STATE.NONE;

    this.target.copy(this.target0);

    if (this.object.type === "OrthographicCamera") {
      this.scale = this.scale0;
      this.object.top = this.scale;
      this.object.bottom = -this.scale;
      this.object.right = this.scale * this.aspect;
      this.object.left = -this.scale * this.aspect;
    } else {
      this.object.position.copy(this.position0);
      this.object.up.copy(this.up0);
    }
    this._eye.subVectors(this.object.position, this.target);

    this.object.lookAt(this.target);

    this.dispatchEvent(this.changeEvent);

    this.lastPosition.copy(this.object.position);
  }

  // listeners

  keydown(event) {
    if (this.enabled === false) return;

    window.removeEventListener("keydown", this.keydown);

    this._prevState = this._state;

    if (this._state !== this.STATE.NONE) {
    } else if (event.keyCode === this.keys[this.STATE.ROTATE] && !this.noRotate) {
      this._state = this.STATE.ROTATE;
    } else if (event.keyCode === this.keys[this.STATE.ZOOM] && !this.noZoom) {
      this._state = this.STATE.ZOOM;
    } else if (event.keyCode === this.keys[this.STATE.PAN] && !this.noPan) {
      this._state = this.STATE.PAN;
    }
  }

  keyup(event) {
    if (this.enabled === false) return;

    this._state = this._prevState;

    window.addEventListener("keydown", this.keydown.bind(this), false);
  }

  mousedown(event) {
    if (this.enabled === false) return;

    event.preventDefault();
    event.stopPropagation();

    if (this._state === this.STATE.NONE) {
      this._state = event.button;
    }

    if (this._state === this.STATE.ROTATE && !this.noRotate) {
      this._moveCurr.copy(this.getMouseOnCircle(event.pageX, event.pageY));
      this._movePrev.copy(this._moveCurr);
    } else if (this._state === this.STATE.ZOOM && !this.noZoom) {
      this._zoomStart.copy(this.getMouseOnScreen(event.pageX, event.pageY));
      this._zoomEnd.copy(this._zoomStart);
    } else if (this._state === this.STATE.PAN && !this.noPan) {
      this._panStart.copy(this.getMouseOnScreen(event.pageX, event.pageY));
      this._panEnd.copy(this._panStart);
    }

    document.addEventListener("mousemove", this.mousemove.bind(this), false);
    document.addEventListener("mouseup", this.mouseup.bind(this), false);

    this.dispatchEvent(this.startEvent);
  }

  mousemove(event) {
    if (this.enabled === false) return;

    event.preventDefault();
    event.stopPropagation();

    if (this._state === this.STATE.ROTATE && !this.noRotate) {
      this._moveCurr.copy(this.getMouseOnCircle(event.pageX, event.pageY));
    } else if (this._state === this.STATE.ZOOM && !this.noZoom) {
      this._zoomEnd.copy(this.getMouseOnScreen(event.pageX, event.pageY));
    } else if (this._state === this.STATE.PAN && !this.noPan) {
      this._panEnd.copy(this.getMouseOnScreen(event.pageX, event.pageY));
    }
  }

  mouseup(event) {
    if (this.enabled === false) return;

    event.preventDefault();
    event.stopPropagation();

    this._state = this.STATE.NONE;

    document.removeEventListener("mousemove", this.mousemove);
    document.removeEventListener("mouseup", this.mouseup);
    this.dispatchEvent(this.endEvent);
  }

  mousewheel(event) {
    if (this.enabled === false) return;

    if (this.noZoom === true) return;

    event.preventDefault();
    event.stopPropagation();

    switch (event.deltaMode) {
      case 2:
        // Zoom in pages
        this._zoomStart.y -= event.deltaY * 0.025;
        break;

      case 1:
        // Zoom in lines
        this._zoomStart.y -= event.deltaY * 0.01;
        break;

      default:
        // undefined, 0, assume pixels
        this._zoomStart.y -= event.deltaY * 0.00025;
        break;
    }

    this.dispatchEvent(this.startEvent);
    this.dispatchEvent(this.endEvent);
  }

  touchstart(event) {
    if (this.enabled === false) return;

    event.preventDefault();

    switch (event.touches.length) {
      case 1:
        this._state = this.STATE.TOUCH_ROTATE;
        this._moveCurr.copy(this.getMouseOnCircle(event.touches[0].pageX, event.touches[0].pageY));
        this._movePrev.copy(this._moveCurr);
        break;

      default:
        // 2 or more
        this._state = this.STATE.TOUCH_ZOOM_PAN;
        var dx = event.touches[0].pageX - event.touches[1].pageX;
        var dy = event.touches[0].pageY - event.touches[1].pageY;
        this._touchZoomDistanceEnd = this._touchZoomDistanceStart = Math.sqrt(dx * dx + dy * dy);

        var x = (event.touches[0].pageX + event.touches[1].pageX) / 2;
        var y = (event.touches[0].pageY + event.touches[1].pageY) / 2;
        this._panStart.copy(this.getMouseOnScreen(x, y));
        this._panEnd.copy(this._panStart);
        break;
    }

    this.dispatchEvent(this.startEvent);
  }

  touchmove(event) {
    if (this.enabled === false) return;

    event.preventDefault();
    event.stopPropagation();

    switch (event.touches.length) {
      case 1:
        this._movePrev.copy(this._moveCurr);
        this._moveCurr.copy(this.getMouseOnCircle(event.touches[0].pageX, event.touches[0].pageY));
        break;

      default:
        // 2 or more
        var dx = event.touches[0].pageX - event.touches[1].pageX;
        var dy = event.touches[0].pageY - event.touches[1].pageY;
        this._touchZoomDistanceEnd = Math.sqrt(dx * dx + dy * dy);

        var x = (event.touches[0].pageX + event.touches[1].pageX) / 2;
        var y = (event.touches[0].pageY + event.touches[1].pageY) / 2;
        this._panEnd.copy(this.getMouseOnScreen(x, y));
        break;
    }
  }

  touchend(event) {
    if (this.enabled === false) return;

    switch (event.touches.length) {
      case 0:
        this._state = this.STATE.NONE;
        break;

      case 1:
        this._state = this.STATE.TOUCH_ROTATE;
        this._moveCurr.copy(this.getMouseOnCircle(event.touches[0].pageX, event.touches[0].pageY));
        this._movePrev.copy(this._moveCurr);
        break;
    }

    this.dispatchEvent(this.endEvent);
  }

  contextmenu(event) {
    if (this.enabled === false) return;

    event.preventDefault();
  }

  dispose() {
    this.domElement.removeEventListener("contextmenu", this.contextmenu, false);
    this.domElement.removeEventListener("mousedown", this.mousedown, false);
    this.domElement.removeEventListener("wheel", this.mousewheel, false);

    this.domElement.removeEventListener("touchstart", this.touchstart, false);
    this.domElement.removeEventListener("touchend", this.touchend, false);
    this.domElement.removeEventListener("touchmove", this.touchmove, false);

    document.removeEventListener("mousemove", this.mousemove, false);
    document.removeEventListener("mouseup", this.mouseup, false);

    window.removeEventListener("keydown", this.keydown, false);
    window.removeEventListener("keyup", this.keyup, false);
  }
}

export default TrackballControls;
