'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.rotate = exports.cut = exports.resize = exports.preview = exports.fetchImg = undefined;

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

var _typeof2 = require('babel-runtime/helpers/typeof');

var _typeof3 = _interopRequireDefault(_typeof2);

var _symbol = require('babel-runtime/core-js/symbol');

var _symbol2 = _interopRequireDefault(_symbol);

var _slicedToArray2 = require('babel-runtime/helpers/slicedToArray');

var _slicedToArray3 = _interopRequireDefault(_slicedToArray2);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _assign = require('babel-runtime/core-js/object/assign');

var _assign2 = _interopRequireDefault(_assign);

exports.loadImg = loadImg;
exports.readFile = readFile;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/*
 * 图片编辑器（图片编辑而不是图片合成）
 */
var data = {};
var eventData = {
  active: false, // 点击事件开始标记
  offsetX: 0, // 点击事件开始x轴位置
  offsetY: 0 // 点击事件开始y轴位置
};
var eventNames = ['mousewheel', 'mousedown', 'mouseup', 'mouseout', 'mousemove'];
var ctrlKey = false; // ctrl键按下标记
// 移动事件
function moveEvent(e) {
  e.preventDefault();
  e.stopPropagation();
  var state = data[this.id];
  var sprite = state.sprite;
  if (!sprite) return;
  var cx = sprite.cx,
      cy = sprite.cy;

  var _sprite$getViewSize = sprite.getViewSize(state.viewScale),
      iw = _sprite$getViewSize.width,
      ih = _sprite$getViewSize.height;

  switch (e.type) {
    case 'mousedown':
      ctrlKey = e.ctrlKey;
      if (!ctrlKey) {
        if (e.offsetX > cx && e.offsetY > cy && e.offsetX < cx + iw && e.offsetY < cy + ih) {
          // 在图片范围内
          eventData.active = true;
          eventData.offsetX = e.offsetX - cx;
          eventData.offsetY = e.offsetY - cy;
          this.canvas.style.cursor = 'move';
        }
      } else {
        // 按下ctrl键
        eventData.active = true;
        eventData.offsetX = e.offsetX;
        eventData.offsetY = e.offsetY;
      }
      break;
    case 'mouseout':
    case 'mouseup':
      if (eventData.active) {
        this.canvas.style.cursor = 'default';
        eventData.active = false;
      }
      break;
    case 'mousemove':
      if (eventData.active) {
        if (ctrlKey) {
          var x = Math.max(cx, Math.min(e.offsetX, eventData.offsetX));
          var y = Math.max(cy, Math.min(e.offsetY, eventData.offsetY));
          var width = Math.min(cx + iw, Math.max(e.offsetX, eventData.offsetX)) - x;
          var height = Math.min(cy + ih, Math.max(e.offsetY, eventData.offsetY)) - y;
          if (x + width > cx && y + height > cy && x < cx + iw && y < cy + ih) {
            x -= cx;
            y -= cy;
            // 裁剪只和原图有关，不用*scale
            (0, _assign2.default)(state.range, { width: width / state.viewScale >> 0, height: height / state.viewScale >> 0, x: x / state.viewScale >> 0, y: y / state.viewScale >> 0 });
            stateChange(state, 'range');
          }
        } else {
          sprite.cx = e.offsetX - eventData.offsetX;
          sprite.cy = e.offsetY - eventData.offsetY;
        }
        _draw(this.canvas, state);
      }
      break;
    case 'mousewheel':
      var direct = e.wheelDelta ? e.wheelDelta > 0 ? 0 : 1 : e.detail > 0 ? 0 : 1; // 0 上(缩小，scale变小) 1 下(放大，scale变大)
      eventData.offsetX = e.offsetX;
      eventData.offsetY = e.offsetY;
      this.scale(state.viewScale + (direct ? 0.1 : -0.1), 1);
      break;
  }
}
function stateChange(state, type) {
  if (state.onChange) {
    var range = (0, _assign2.default)({}, state.range);

    var _state$sprite$getSize = state.sprite.getSize(),
        width = _state$sprite$getSize.width,
        height = _state$sprite$getSize.height;

    state.onChange({ width: width >> 0, height: height >> 0, scale: window.parseFloat(state.viewScale.toFixed(2)), range: range, type: type });
  }
}
/* 
 * 画矩形选择框
 */
function drawRect(context, state) {
  var _state$sprite = state.sprite,
      cx = _state$sprite.cx,
      cy = _state$sprite.cy;
  var _state$range = state.range,
      x = _state$range.x,
      y = _state$range.y,
      width = _state$range.width,
      height = _state$range.height;

  if (width && height) {
    var ratio = state.viewScale;
    context.setLineDash([5, 2]);
    context.strokeStyle = "black";
    context.lineWidth = 1;
    context.strokeRect(cx + x * ratio, cy + y * ratio, width * ratio, height * ratio);
  }
}
/* 
 * 画图
 *
 * @param {string} img
 * @param {object} canvas
 */
function _draw(canvas, state) {
  // if (!canvas) return;
  var context = canvas.getContext('2d');
  var sprite = state.sprite;
  context.clearRect(0, 0, canvas.width, canvas.height);
  // 画背景
  state.before && state.before(context);
  // 画图片
  if (sprite) {
    sprite.draw(context, state.viewScale);
    /*绘制图片结束*/
    // 画矩形选择框
    if (state.range.width && state.range.height) {
      drawRect(context, state);
    }
  }
  state.after && state.after(context);
}
function save(state, method) {
  var canvas = document.createElement("canvas");
  // if (typeof canvas[method] !== 'function') return false;
  var ctx = canvas.getContext("2d");
  var sprite = state.sprite;
  var x = sprite.x,
      y = sprite.y,
      width = sprite.width,
      height = sprite.height;

  var _sprite$getSize = sprite.getSize(),
      dWidth = _sprite$getSize.width,
      dHeight = _sprite$getSize.height;

  canvas.width = dWidth;
  canvas.height = dHeight;
  if (sprite.angle) {
    if (sprite.angle !== 1) {
      var _ref = [canvas.height, canvas.width];
      // state.angle = .5, 1.5

      canvas.width = _ref[0];
      canvas.height = _ref[1];
    }
    ctx.rotate(window.Math.PI * sprite.angle);
    switch (sprite.angle) {
      case .5:
        ctx.translate(0, -canvas.width);
        break;
      case 1.5:
        ctx.translate(-canvas.height, 0);
        break;
      default:
        ctx.translate(-canvas.width, -canvas.height);
    }
  }
  ctx.drawImage(sprite.img, x, y, width, height, 0, 0, dWidth, dHeight);

  for (var _len = arguments.length, args = Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {
    args[_key - 2] = arguments[_key];
  }

  return canvas[method].apply(canvas, args);
}

var Sprite = function () {
  function Sprite(img) {
    (0, _classCallCheck3.default)(this, Sprite);

    this.img = img;
    this.init();
  }

  (0, _createClass3.default)(Sprite, [{
    key: 'init',
    value: function init() {
      this.width = this.img.width; // 图片显示范围宽度（cut）
      this.height = this.img.height; // 图片显示范围高度（cut）
      this.x = 0; // 图片显示范围x轴位置（cut）
      this.y = 0; // 图片显示范围y轴位置（cut）
      this.scale = 1; // 调整高宽时和原图比例（resize）
      this.angle = 0; // 旋转角度（rotate）
      this.cx = 0; // 图片在画布上x轴位置
      this.cy = 0; // 图片在画布上y轴位置
      this.zIndex = 0; // 图层深度（越大图层越高）
    }
  }, {
    key: 'getSize',
    value: function getSize() {
      var _ref2 = this.angle === .5 || this.angle === 1.5 ? [this.height * this.scale, this.width * this.scale] : [this.width * this.scale, this.height * this.scale],
          _ref3 = (0, _slicedToArray3.default)(_ref2, 2),
          width = _ref3[0],
          height = _ref3[1];

      return {
        width: width,
        height: height
      };
    }
  }, {
    key: 'getViewSize',
    value: function getViewSize(viewScale) {
      var ratio = viewScale * this.scale;

      var _ref4 = this.angle === .5 || this.angle === 1.5 ? [this.height * ratio, this.width * ratio] : [this.width * ratio, this.height * ratio],
          _ref5 = (0, _slicedToArray3.default)(_ref4, 2),
          width = _ref5[0],
          height = _ref5[1];

      return {
        width: width,
        height: height,
        ratio: ratio
      };
    }
  }, {
    key: 'draw',
    value: function draw(context, viewScale) {
      // 坐标转换
      var canvas = context.canvas;
      var ratio = viewScale * this.scale;
      var width = this.width * ratio;
      var height = this.height * ratio;
      var cx = void 0,
          cy = void 0;
      switch (this.angle) {
        case 0.5:
          // 顺时针90°
          cx = this.cy;
          cy = canvas.width - this.cx - height;
          break;
        case 1.5:
          // 逆时针90°
          cx = canvas.height - this.cy - width;
          cy = this.cx;
          break;
        case 1:
          // 180°
          cx = canvas.width - this.cx - width;
          cy = canvas.height - this.cy - height;
          break;
        default:
          // 0°
          cx = this.cx;
          cy = this.cy;
      }
      // 变换坐标轴
      context.save();
      if (this.angle) {
        var hWidth = canvas.width >> 1;
        var hHeight = canvas.height >> 1;
        context.translate(hWidth, hHeight);
        context.rotate(window.Math.PI * this.angle);
        if (this.angle !== 1) {
          context.translate(-hHeight, -hWidth);
        } else {
          context.translate(-hWidth, -hHeight);
        }
      }
      // console.log(state.x, state.y, state.width, state.height, cx, cy, width, height);
      context.drawImage(this.img, this.x, this.y, this.width, this.height, cx, cy, width, height);
      context.restore();
    }
  }, {
    key: 'cut',
    value: function cut(rw, rh, rx, ry, viewScale) {
      rw /= this.scale;
      rh /= this.scale;
      rx /= this.scale;
      ry /= this.scale;
      switch (this.angle) {
        case .5:
        case 1.5:
          if (this.angle === .5) {
            var _ref6 = [ry, this.height - rx - rw];
            rx = _ref6[0];
            ry = _ref6[1];
          } else {
            var _ref7 = [this.width - ry - rh, rx];
            rx = _ref7[0];
            ry = _ref7[1];
          }
          var _ref8 = [rh, rw];
          rw = _ref8[0];
          rh = _ref8[1];

          break;
        case 1:
          var _ref9 = [this.width - rw - rx, this.height - rh - ry];
          rx = _ref9[0];
          ry = _ref9[1];

          break;
        default:
          ;
      }
      if (rx >= this.width || ry >= this.height) return;
      var x = void 0,
          y = void 0,
          width = void 0,
          height = void 0;
      x = this.x + Math.max(rx, 0);
      y = this.y + Math.max(ry, 0);
      width = Math.min(Math.min(rx + rw, this.width) /*结束点*/ - Math.max(0, rx) /*起点*/, this.width);
      height = Math.min(Math.min(ry + rh, this.height) /*结束点*/ - Math.max(0, ry) /*起点*/, this.height);
      var ratio = viewScale * this.scale;
      // 让图片停留在原点
      switch (this.angle) {
        case .5:
          this.cx += (this.height + this.y - height - y) * ratio;
          this.cy += (x - this.x) * ratio;
          break;
        case 1:
          this.cx += (this.width + this.x - width - x) * ratio;
          this.cy += (this.height + this.y - height - y) * ratio;
          break;
        case 1.5:
          this.cx += (y - this.y) * ratio;
          this.cy += (this.width + this.x - width - x) * ratio;
          break;
        default:
          this.cx += (x - this.x) * ratio;
          this.cy += (y - this.y) * ratio;
      }
      (0, _assign2.default)(this, { x: x, y: y, width: width, height: height });
    }
  }, {
    key: 'resize',
    value: function resize(width, height) {
      var _getSize = this.getSize(),
          sWidth = _getSize.width,
          sHeight = _getSize.height;

      if (width >= sWidth && height >= sHeight) return 0;
      var scale = void 0;
      if (width && height) {
        scale = Math.min(width / sWidth, height / sHeight);
      } else if (width) {
        scale = width / sWidth;
      } else {
        scale = height / sHeight;
      }
      // 确保scale和viewScale成比例
      this.scale *= scale;
      return scale;
    }
  }, {
    key: 'rotate',
    value: function rotate(angle, viewScale) {
      // 90,180,270转.5,1,1.5
      if (angle > 2 || angle < -2) angle = angle / 180;
      angle += this.angle;
      angle = angle < 0 ? 2 + angle % 2 : angle % 2;
      // 只接受0,.5,1,1.5
      if (angle % .5 || angle === this.angle) return 0;
      var ratio = viewScale * .5;
      var diff = angle - this.angle;

      var _getSize2 = this.getSize(),
          width = _getSize2.width,
          height = _getSize2.height;

      switch (diff) {
        case -1.5:
        case .5:
        case 1.5:
        case -.5:
          this.cx -= (height - width) * ratio;
          this.cy -= (width - height) * ratio;
          break;
        default:
          this.cx -= (width - height) * ratio;
          this.cy -= (height - width) * ratio;
      }
      this.angle = angle;
      return diff;
    }
    // 设置对齐

  }, {
    key: 'align',
    value: function align(pos, canvas, viewScale) {
      var _getViewSize = this.getViewSize(viewScale),
          width = _getViewSize.width,
          height = _getViewSize.height;

      switch (pos) {
        case 'top':
        case 1:
          this.cy = 0;
          break;
        case 'right':
        case 2:
          this.cx = canvas.width - width;
          break;
        case 'bottom':
        case 3:
          this.cy = canvas.height - height;
          break;
        case 'left':
        case 4:
          this.cx = 0;
          break;
        default:
          // center
          this.cx = (canvas.width - width) / 2;
          this.cy = (canvas.height - height) / 2;
      }
    }
  }]);
  return Sprite;
}();

var ImgEdit = function () {
  function ImgEdit(option) {
    var _this = this;

    (0, _classCallCheck3.default)(this, ImgEdit);

    var id = (0, _symbol2.default)();
    Object.defineProperty(this, 'id', {
      value: id,
      writable: false
    });
    this.canvas = null;
    data[id] = {
      sprite: null,
      viewScale: 0,
      range: {
        x: 0, // 选择范围（setRange）在图片上的x轴位置（原始坐标系统）
        y: 0, // 选择范围（setRange）在图片上的y轴位置（原始坐标系统）
        width: 0, // 选择范围（cut）宽度（原始坐标系统）
        height: 0 // 选择范围（cut）高度（原始坐标系统）
      }, // 矩形选择框数据（左上角为原点）
      before: null,
      after: null
    };
    var state = data[id];
    // 获取canvas元素
    if (option && (typeof option === 'undefined' ? 'undefined' : (0, _typeof3.default)(option)) === 'object') {
      if (option instanceof HTMLCanvasElement) this.canvas = option;else {
        for (var k in option) {
          switch (k) {
            case 'canvas':
              this.canvas = typeof option.canvas === 'string' ? document.querySelector(option.canvas) : option.canvas;
              break;
            case 'width':
              this.canvas.width = option.width;
              break;
            case 'height':
              this.canvas.height = option.height;
              break;
            case 'before':
              this.before(option.before);
              break;
            case 'after':
              this.after(option.after);
              break;
            default:
              ;
          }
        }
      }
    } else if (option) this.canvas = document.querySelector(option);
    if (this.canvas) {
      var event = moveEvent.bind(this);
      eventNames.forEach(function (name) {
        _this.canvas.addEventListener(name, event, false);
      });
      state.moveEvent = event;
      _draw(this.canvas, state);
    }
  }

  (0, _createClass3.default)(ImgEdit, [{
    key: 'destroy',
    value: function destroy() {
      var _this2 = this;

      if (this.canvas) {
        eventNames.forEach(function (name) {
          _this2.canvas.removeEventListener(name, data[_this2.id].moveEvent);
        });
      }
      data[this.id] = data[this.id].sprite = data[this.id].moveEvent = data[this.id].onChange = data[this.id].before = data[this.id].after = this.canvas = null;
    }
  }, {
    key: 'before',
    value: function before(fn) {
      data[this.id].before = typeof fn === 'function' ? fn : null;
      return this;
    }
  }, {
    key: 'after',
    value: function after(fn) {
      data[this.id].after = typeof fn === 'function' ? fn : null;
      return this;
    }
  }, {
    key: 'onChange',
    value: function onChange(fn) {
      data[this.id].onChange = typeof fn === 'function' ? fn : null;
      return this;
    }
    // 获取图片宽度

  }, {
    key: 'width',
    value: function width() {
      return data[this.id].sprite.getSize()['width'];
    }
    // 获取图片高度

  }, {
    key: 'height',
    value: function height() {
      return data[this.id].sprite.getSize()['height'];
    }
    // 调整canvas尺寸

  }, {
    key: 'canvasResize',
    value: function canvasResize(width, height) {
      if (!width && !height) return this;
      var state = data[this.id];
      if (width) {
        width >>= 0;
        var rx = width - this.canvas.width >> 1;
        this.canvas.width = width;
        state.cx += rx;
      }
      if (height) {
        height >>= 0;
        var ry = height - this.canvas.height >> 1;
        this.canvas.height = height;
        state.cy += ry;
      }
      _draw(this.canvas, state);
      return this;
    }
  }, {
    key: 'toDataURL',
    value: function toDataURL() {
      var mime = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'image/jpeg';
      var quality = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : .8;

      var state = data[this.id];
      if (!state.sprite) return '';
      return save(state, 'toDataURL', mime, quality);
    }
  }, {
    key: 'toBlob',
    value: function toBlob() {
      var _this3 = this;

      var mime = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'image/jpeg';
      var quality = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : .8;

      return new _promise2.default(function (resolve, reject) {
        var state = data[_this3.id];
        if (!state.sprite) {
          reject(new Error(state.sprite.img));
        } else {
          save(state, 'toBlob', function (res) {
            resolve(res);
          }, mime, quality);
        }
      });
    }
    // 重置

  }, {
    key: 'reset',
    value: function reset(noDraw) {
      var state = data[this.id];
      !noDraw && state.sprite.init();
      state.viewScale = Math.min(1, this.canvas.width / state.sprite.width, this.canvas.height / state.sprite.height); // 在画布上的显示比例（scale）
      state.range.width = state.range.height = state.range.x = state.range.y = 0;
      state.sprite.align('center', this.canvas, state.viewScale);
      if (!noDraw) {
        this.canvas && _draw(this.canvas, state);
        stateChange(state, 'reset');
      }
      return this;
    }
    // 擦除辅助内容

  }, {
    key: 'clean',
    value: function clean(noDraw) {
      var state = data[this.id];
      if (!state.sprite) return this;
      state.range.width = state.range.height = state.range.x = state.range.y = 0;
      if (!noDraw) {
        this.canvas && _draw(this.canvas, state);
        stateChange(state, 'clean');
      }
      return this;
    }
  }, {
    key: 'close',
    value: function close() {
      data[this.id].sprite = null;
      return this;
    }
    /*
     * 异步打开图片
     * @param {object/string} file 图片资源(Image/base64/url)
     * @return {object} Promise
     */

  }, {
    key: 'open',
    value: function () {
      var _ref10 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee(file) {
        var img, state;
        return _regenerator2.default.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                img = void 0;
                _context.prev = 1;

                if (!(file instanceof Image)) {
                  _context.next = 12;
                  break;
                }

                if (!/^blob:/.test(file.src)) {
                  _context.next = 7;
                  break;
                }

                img = file;
                _context.next = 10;
                break;

              case 7:
                _context.next = 9;
                return loadImg(file.src);

              case 9:
                img = _context.sent;

              case 10:
                _context.next = 24;
                break;

              case 12:
                _context.t0 = loadImg;

                if (!((typeof file === 'undefined' ? 'undefined' : (0, _typeof3.default)(file)) === 'object')) {
                  _context.next = 19;
                  break;
                }

                _context.next = 16;
                return readFile(file);

              case 16:
                _context.t1 = _context.sent;
                _context.next = 20;
                break;

              case 19:
                _context.t1 = file;

              case 20:
                _context.t2 = _context.t1;
                _context.next = 23;
                return (0, _context.t0)(_context.t2);

              case 23:
                img = _context.sent;

              case 24:
                _context.next = 30;
                break;

              case 26:
                _context.prev = 26;
                _context.t3 = _context['catch'](1);

                stateChange(null, 'error');
                return _context.abrupt('return', this);

              case 30:
                state = data[this.id];

                state.sprite = new Sprite(img);
                if (this.canvas) {
                  this.reset(1);
                  _draw(this.canvas, state);
                }
                stateChange(state, 'open');
                return _context.abrupt('return', this);

              case 35:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee, this, [[1, 26]]);
      }));

      function open(_x5) {
        return _ref10.apply(this, arguments);
      }

      return open;
    }()
  }, {
    key: 'draw',
    value: function draw() {
      var state = data[this.id];
      this.canvas && _draw(this.canvas, state);
      stateChange(state, 'draw');
      return this;
    }
    // 视图缩放

  }, {
    key: 'scale',
    value: function scale(s, wheel) {
      var state = data[this.id];
      if (!state.sprite) return this;
      var sprite = state.sprite;
      // 放大比例不能小于1或大于10
      var viewScale = state.viewScale;
      var scale = s - viewScale;

      var _sprite$getViewSize2 = sprite.getViewSize(state.viewScale),
          width = _sprite$getViewSize2.width,
          height = _sprite$getViewSize2.height;

      if (s < .1 || s > 10) {
        return this;
      } else {
        state.viewScale = s;
      }
      var cx = sprite.cx,
          cy = sprite.cy;

      if (wheel && eventData.offsetX > cx && eventData.offsetY > cy && eventData.offsetX < cx + width && eventData.offsetY < cy + height) {
        // 在图片范围内，以鼠标位置为中心
        sprite.cx -= (eventData.offsetX - sprite.cx) / viewScale * scale;
        sprite.cy -= (eventData.offsetY - sprite.cy) / viewScale * scale;
      } else {
        // 以图片在画布范围内中心点
        var ratio = sprite.scale * scale * .5;
        if (sprite.angle === .5 || sprite.angle === 1.5) {
          sprite.cx -= sprite.height * ratio;
          sprite.cy -= sprite.width * ratio;
        } else {
          sprite.cx -= sprite.width * ratio;
          sprite.cy -= sprite.height * ratio;
        }
      }
      this.canvas && _draw(this.canvas, state);
      stateChange(state, 'scale');
      return this;
    }
    // 裁剪

  }, {
    key: 'cut',
    value: function cut(rw, rh) {
      var rx = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;
      var ry = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 0;

      var state = data[this.id];
      var sprite = state.sprite;
      if (!sprite) return this;
      if (!rw || !rh) {
        var _state$range2 = state.range;
        rx = _state$range2.x;
        ry = _state$range2.y;
        rw = _state$range2.width;
        rh = _state$range2.height;
      } else {
        // 以图片坐标为参考
        rw = rw >> 0;
        rh = rh >> 0;
        rx = rx >> 0;
        ry = ry >> 0;
      }
      if (!rw || !rh) return this;
      sprite.cut(rw, rh, rx, ry, state.viewScale);
      this.clean(1);
      this.canvas && _draw(this.canvas, state);
      stateChange(state, 'cut');
      return this;
    }
    // 调整大小

  }, {
    key: 'resize',
    value: function resize(width, height) {
      var state = data[this.id];
      if (!state.sprite) return this;
      var scale = state.sprite.resize(width, height);
      if (!scale) return this;
      state.viewScale /= scale;
      if (state.range.width) {
        state.range.width = state.range.width * scale >> 0;
        state.range.height = state.range.height * scale >> 0;
        state.range.x = state.range.x * scale >> 0;
        state.range.y = state.range.y * scale >> 0;
        this.canvas && _draw(this.canvas, state);
      }
      stateChange(state, 'resize');
      return this;
    }
    // 旋转

  }, {
    key: 'rotate',
    value: function rotate(angle) {
      var state = data[this.id];
      if (!state.sprite || !angle) return this;
      var sprite = state.sprite;

      var _sprite$getSize2 = sprite.getSize(),
          iw = _sprite$getSize2.width,
          ih = _sprite$getSize2.height;

      var diff = sprite.rotate(angle, state.viewScale);
      if (!diff) return this;
      if (state.range.width) {
        var _state$range3 = state.range,
            x = _state$range3.x,
            y = _state$range3.y,
            width = _state$range3.width,
            height = _state$range3.height;

        switch (diff) {
          // 顺时针
          case -1.5:
          case .5:
            var _ref11 = [ih - height - y, x, height, width];
            x = _ref11[0];
            y = _ref11[1];
            width = _ref11[2];
            height = _ref11[3];

            break;
          // 逆时针
          case -.5:
          case 1.5:
            var _ref12 = [y, iw - width - x, height, width];
            x = _ref12[0];
            y = _ref12[1];
            width = _ref12[2];
            height = _ref12[3];

            break;
          // 平翻
          default:
            var _ref13 = [iw - width - x, ih - height - y];
            x = _ref13[0];
            y = _ref13[1];

        }
        (0, _assign2.default)(state.range, { x: x, y: y, width: width, height: height });
      }
      this.canvas && _draw(this.canvas, state);
      stateChange(state, 'rotate');
      return this;
    }
  }, {
    key: 'setRange',
    value: function setRange(width, height) {
      var x = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;
      var y = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 0;

      var state = data[this.id];
      if (!state.sprite) return this;
      var sprite = state.sprite;
      width >>= 0;
      height >>= 0;
      x >>= 0;
      y >>= 0;

      var _sprite$getSize3 = sprite.getSize(),
          iw = _sprite$getSize3.width,
          ih = _sprite$getSize3.height;

      iw >>= 0;
      ih >>= 0;
      if (width && height && width > 0 && height > 0 && (width < iw || height < ih) && x >= 0 && y >= 0 && x < iw && y < ih) {
        width = Math.min(iw - x, width);
        height = Math.min(ih - y, height);
        (0, _assign2.default)(state.range, { width: width, height: height, x: x, y: y });
        this.canvas && _draw(this.canvas, state);
        stateChange(state, 'range');
      }
      return this;
    }
  }, {
    key: 'align',
    value: function align(pos) {
      var state = data[this.id];
      if (!state.sprite) return this;
      state.sprite.align(pos, this.canvas, state.viewScale);
      this.canvas && _draw(this.canvas, state);
      stateChange(state, 'align');
      return this;
    }
  }]);
  return ImgEdit;
}();
/* 
 * 加载线上图片
 *
 * @param {string} url
 * @return {object} promise
 */


var fetchImg = exports.fetchImg = function fetchImg(url) {
  return new _promise2.default(function (resolve, reject) {
    if (!url || typeof url !== 'string' || !/^(?:https?:)?\/\//i.test(url)) reject(0);
    var xhr = new XMLHttpRequest();
    xhr.responseType = 'blob';
    xhr.onload = function () {
      var file = xhr.response;
      var name = '';
      var m = url.match(/[\w.-]+\.(?:jpe?g|png|gif|bmp)$/);
      if (m) name = m[0];else {
        name = Date.now();
        var ext = file.type.split('/')[1];
        switch (ext) {
          case 'jpeg':
            name = name + '.jpg';
            break;
          default:
            name = name + '.' + ext;
            break;
        }
      }
      file.name = name;
      resolve(file);
    };
    xhr.onerror = function (e) {
      console.error('fetchImg err', e);
      reject(e);
    };
    xhr.open('GET', url);
    // xhr.overrideMimeType('text/plain; charset=x-user-defined')
    xhr.send(null);
  });
};
/* 
 * 加载图片
 *
 * @param {string} src url/base64
 * @return {object} promise
 */
function loadImg(src) {
  return new _promise2.default(function (resolve, reject) {
    if (!src || typeof src !== 'string' || !/^(?:data:image\/[^;]+;\s*base64\s*,|(?:https?:)?\/\/)/i.test(src)) {
      reject(0);
      return;
    }
    var img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = function () {
      resolve(this);
      img = img.onload = img.onerror = null;
    };
    img.onerror = function (e) {
      console.error('loadImg error', e);
      img = img.onload = img.onerror = null;
      reject(e);
    };
    img.src = src;
  });
}
/* 
 * 图片转base64
 *
 * @param {blob} file
 * @return {object} promise
 */
function readFile(file) {
  return new _promise2.default(function (resolve, reject) {
    if (!file || (typeof file === 'undefined' ? 'undefined' : (0, _typeof3.default)(file)) !== 'object') reject(0);
    var fileReader = new FileReader();
    fileReader.onload = function (e) {
      resolve(e.target.result);
      fileReader = fileReader.onload = fileReader.onerror = null;
    };
    fileReader.onerror = function (e) {
      console.error('readFile error', e);
      fileReader = fileReader.onload = fileReader.onerror = null;
      reject(e);
    };
    fileReader.readAsDataURL(file);
  });
}
/* 
 * 上传图片预览
 *
 * @param {blob} file
 * @return {object} promise
 */
var preview = exports.preview = function preview(file) {
  return new _promise2.default(function (resolve, reject) {
    if (!file || (typeof file === 'undefined' ? 'undefined' : (0, _typeof3.default)(file)) !== 'object') reject(0);
    var img = new Image();
    img.onload = function () {
      URL.revokeObjectURL(this.src);
    };
    img.onerror = function (e) {
      reject(e);
    };
    img.src = URL.createObjectURL(file);
    resolve(img);
  });
};
var resize = exports.resize = function () {
  var _ref14 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee2(img, width, height) {
    var mime, edit;
    return _regenerator2.default.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            if (!(!width && !height)) {
              _context2.next = 2;
              break;
            }

            return _context2.abrupt('return', false);

          case 2:
            if (!(typeof img === 'string' && /^(?:https?:)?\/\//.test(img))) {
              _context2.next = 6;
              break;
            }

            _context2.next = 5;
            return fetchImg(img);

          case 5:
            img = _context2.sent;

          case 6:
            mime = img.type;
            edit = new ImgEdit();
            return _context2.abrupt('return', edit.open(img).then(function () {
              var b64 = edit.resize(width, height).toDataURL(mime);
              edit.destroy();
              return b64;
            }));

          case 9:
          case 'end':
            return _context2.stop();
        }
      }
    }, _callee2, undefined);
  }));

  return function resize(_x10, _x11, _x12) {
    return _ref14.apply(this, arguments);
  };
}();
var cut = exports.cut = function () {
  var _ref15 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee3(img, width, height, x, y) {
    var mime, edit;
    return _regenerator2.default.wrap(function _callee3$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:
            if (!(!width && !height)) {
              _context3.next = 2;
              break;
            }

            return _context3.abrupt('return', false);

          case 2:
            if (!(typeof img === 'string' && /^(?:https?:)?\/\//.test(img))) {
              _context3.next = 6;
              break;
            }

            _context3.next = 5;
            return fetchImg(img);

          case 5:
            img = _context3.sent;

          case 6:
            mime = img.type;
            edit = new ImgEdit();
            return _context3.abrupt('return', edit.open(img).then(function () {
              var b64 = edit.cut(width, height, x, y).toDataURL(mime);
              edit.destroy();
              return b64;
            }));

          case 9:
          case 'end':
            return _context3.stop();
        }
      }
    }, _callee3, undefined);
  }));

  return function cut(_x13, _x14, _x15, _x16, _x17) {
    return _ref15.apply(this, arguments);
  };
}();
var rotate = exports.rotate = function () {
  var _ref16 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee4(img, deg) {
    var mime, edit;
    return _regenerator2.default.wrap(function _callee4$(_context4) {
      while (1) {
        switch (_context4.prev = _context4.next) {
          case 0:
            if (deg) {
              _context4.next = 2;
              break;
            }

            return _context4.abrupt('return', false);

          case 2:
            if (!(typeof img === 'string' && /^(?:https?:)?\/\//.test(img))) {
              _context4.next = 6;
              break;
            }

            _context4.next = 5;
            return fetchImg(img);

          case 5:
            img = _context4.sent;

          case 6:
            mime = img.type;
            edit = new ImgEdit();
            return _context4.abrupt('return', edit.open(img).then(function () {
              var b64 = edit.rotate(deg).toDataURL(mime);
              edit.destroy();
              return b64;
            }));

          case 9:
          case 'end':
            return _context4.stop();
        }
      }
    }, _callee4, undefined);
  }));

  return function rotate(_x18, _x19) {
    return _ref16.apply(this, arguments);
  };
}();
exports.default = ImgEdit;