"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.rotate = exports.cut = exports.resize = exports.fetchImg = undefined;

var _promise = require("babel-runtime/core-js/promise");

var _promise2 = _interopRequireDefault(_promise);

var _regenerator = require("babel-runtime/regenerator");

var _regenerator2 = _interopRequireDefault(_regenerator);

var _asyncToGenerator2 = require("babel-runtime/helpers/asyncToGenerator");

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _typeof2 = require("babel-runtime/helpers/typeof");

var _typeof3 = _interopRequireDefault(_typeof2);

var _symbol = require("babel-runtime/core-js/symbol");

var _symbol2 = _interopRequireDefault(_symbol);

var _classCallCheck2 = require("babel-runtime/helpers/classCallCheck");

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require("babel-runtime/helpers/createClass");

var _createClass3 = _interopRequireDefault(_createClass2);

var _assign = require("babel-runtime/core-js/object/assign");

var _assign2 = _interopRequireDefault(_assign);

var _slicedToArray2 = require("babel-runtime/helpers/slicedToArray");

var _slicedToArray3 = _interopRequireDefault(_slicedToArray2);

exports.loadImg = loadImg;
exports.readFile = readFile;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/*
 * 图片编辑器（图片编辑而不是图片合成）
 */
var undefined = void 0;
var data = {};
var eventData = {
  active: false, // 点击事件开始标记
  offsetX: 0, // 点击事件开始x轴位置
  offsetY: 0 // 点击事件开始y轴位置
};
var ctrlKey = false; // ctrl键按下标记
window.addEventListener('load', function () {
  window.addEventListener("keydown", keyEvent, false);
  window.addEventListener("keyup", keyEvent, false);
});
// 移动事件
function moveEvent(e) {
  e.preventDefault();
  e.stopPropagation();
  var state = data[this.id];
  if (!this.img) return;
  switch (e.type) {
    case 'mousedown':
      eventData.active = true;
      if (!ctrlKey) {
        eventData.offsetX = e.offsetX - state.event.cx;
        eventData.offsetY = e.offsetY - state.event.cy;
      } else {
        eventData.offsetX = e.offsetX;
        eventData.offsetY = e.offsetY;
      }
      break;
    case 'mouseout':
    case 'mouseup':
      eventData.active = false;
      break;
    case 'mousemove':
      if (eventData.active) {
        if (ctrlKey) {
          var ratio = state.viewScale * state.scale;
          var _state$event = state.event,
              cx = _state$event.cx,
              cy = _state$event.cy;

          var _ref = state.angle === .5 || state.angle === 1.5 ? [state.height * ratio, state.width * ratio] : [state.width * ratio, state.height * ratio],
              _ref2 = (0, _slicedToArray3.default)(_ref, 2),
              iw = _ref2[0],
              ih = _ref2[1];

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
          state.event.cx = e.offsetX - eventData.offsetX;
          state.event.cy = e.offsetY - eventData.offsetY;
        }
        _draw(this.canvas, state, this.img);
      }
      break;
    case 'mousewheel':
      var direct = e.wheelDelta ? e.wheelDelta > 0 ? 0 : 1 : e.detail > 0 ? 0 : 1; // 0 上(缩小，scale变小) 1 下(放大，scale变大)
      eventData.offsetX = e.offsetX;
      eventData.offsetY = e.offsetY;
      switch (state.angle) {
        case .5:
          state.offsetX = e.offsetY;
          state.offsetY = this.canvas.width - e.offsetX;
          break;
        case 1.5:
          state.offsetX = this.canvas.height - e.offsetY;
          state.offsetY = e.offsetX;
          break;
        case 1:
          state.offsetX = this.canvas.width - e.offsetX;
          state.offsetY = this.canvas.height - e.offsetY;
          break;
        default:
          state.offsetX = e.offsetX;
          state.offsetY = e.offsetY;
      }
      this.scale(direct ? 0.1 : -0.1);
      state.offsetX = state.offsetY = 0;
      break;
  }
}
function keyEvent(e) {
  switch (e.type) {
    case 'keyup':
    case 'keydown':
      ctrlKey = e.ctrlKey;
      break;
  }
}
function stateChange(state, type) {
  if (state.onChange) {
    var range = (0, _assign2.default)({}, state.range);
    var width = state.width * state.scale >> 0;
    var height = state.height * state.scale >> 0;
    if (state.angle && state.angle !== 1) {
      var _ref3 = [height, width];
      width = _ref3[0];
      height = _ref3[1];
    }
    state.onChange({ width: width, height: height, viewScale: state.viewScale.toFixed(2), range: range, type: type });
  }
}
// 设置对齐
function _align(pos, canvas, state) {
  var width = state.width * state.viewScale * state.scale;
  var height = state.height * state.viewScale * state.scale;
  switch (pos) {
    case 'top':
    case 1:
      state.event.cy = 0;
      break;
    case 'right':
    case 2:
      state.event.cx = canvas.width - (!state.angle || state.angle === 1 ? width : height);
      break;
    case 'bottom':
    case 3:
      state.event.cy = canvas.height - (!state.angle || state.angle === 1 ? height : width);
      break;
    case 'left':
    case 4:
      state.event.cx = 0;
      break;
    default:
      // center
      if (!state.angle || state.angle === 1) {
        state.event.cx = (canvas.width - width) / 2;
        state.event.cy = (canvas.height - height) / 2;
      } else {
        state.event.cx = (canvas.width - height) / 2;
        state.event.cy = (canvas.height - width) / 2;
      }
  }
}
/* 
 * 画矩形选择框
 */
function drawRect(context, state) {
  var _state$event2 = state.event,
      cx = _state$event2.cx,
      cy = _state$event2.cy;
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
function _draw(canvas, state, img) {
  // if (!canvas) return;
  var context = canvas.getContext('2d');
  context.clearRect(0, 0, canvas.width, canvas.height);
  // 画背景
  if (state.bg) {
    var bgSize = 10;
    var xs = Math.ceil(canvas.width / bgSize); // 画canvas背景x轴循环次数
    var ys = Math.ceil(canvas.height / bgSize); // 画canvas背景y轴循环次数
    var color1 = "#ccc";
    var color2 = "#eee"; // 画布和图片的比例
    for (var y = 0; y < ys; ++y) {
      var color = y % 2 ? color1 : color2;
      for (var x = 0; x < xs; ++x) {
        context.fillStyle = color;
        context.fillRect(x * bgSize, y * bgSize, bgSize, bgSize);
        color = color === color1 ? color2 : color1;
      }
    }
  }
  // 画图片
  if (img) {
    // 坐标转换
    var ratio = state.viewScale * state.scale;
    var width = state.width * ratio;
    var height = state.height * ratio;
    switch (state.angle) {
      case 0.5:
        // 顺时针90°
        state.cx = state.event.cy;
        state.cy = canvas.width - state.event.cx - height;
        break;
      case 1.5:
        // 逆时针90°
        state.cx = canvas.height - state.event.cy - width;
        state.cy = state.event.cx;
        break;
      case 1:
        // 180°
        state.cx = canvas.width - state.event.cx - width;
        state.cy = canvas.height - state.event.cy - height;
        break;
      default:
        // 0°
        state.cx = state.event.cx;
        state.cy = state.event.cy;
    }
    // 变换坐标轴
    context.save();
    if (state.angle) {
      var hWidth = canvas.width >> 1;
      var hHeight = canvas.height >> 1;
      context.translate(hWidth, hHeight);
      context.rotate(window.Math.PI * state.angle);
      if (state.angle !== 1) {
        context.translate(-hHeight, -hWidth);
      } else {
        context.translate(-hWidth, -hHeight);
      }
    }
    // console.log(state.x, state.y, state.width, state.height, cx, cy, width, height);
    context.drawImage(img, state.x, state.y, state.width, state.height, state.cx, state.cy, width, height);
    context.restore();
    /*绘制图片结束*/
    // 画矩形选择框
    if (state.range.width && state.range.height) {
      drawRect(context, state);
    }
  }
}
function save(img, state, method) {
  var canvas = document.createElement("canvas");
  // if (typeof canvas[method] !== 'function') return false;
  var ctx = canvas.getContext("2d");
  var x = state.x,
      y = state.y,
      width = state.width,
      height = state.height;

  var dWidth = canvas.width = Math.floor(width * state.scale);
  var dHeight = canvas.height = Math.floor(height * state.scale);
  if (state.angle) {
    if (state.angle !== 1) {
      var _ref4 = [canvas.height, canvas.width];
      // state.angle = .5, 1.5

      canvas.width = _ref4[0];
      canvas.height = _ref4[1];
    }
    ctx.rotate(window.Math.PI * state.angle);
    switch (state.angle) {
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
  ctx.drawImage(img, Math.floor(x), Math.floor(y), Math.floor(width), Math.floor(height), 0, 0, dWidth, dHeight);

  for (var _len = arguments.length, args = Array(_len > 3 ? _len - 3 : 0), _key = 3; _key < _len; _key++) {
    args[_key - 3] = arguments[_key];
  }

  return canvas[method].apply(canvas, args);
}

var ImgEdit = function () {
  function ImgEdit(option) {
    (0, _classCallCheck3.default)(this, ImgEdit);

    var id = (0, _symbol2.default)();
    this.canvas = null;
    this.img = null, // new Image()
    data[id] = {
      width: 0, // 图片显示范围宽度（cut）
      height: 0, // 图片显示范围高度（cut）
      x: 0, // 图片显示范围x轴位置（cut）
      y: 0, // 图片显示范围y轴位置（cut）
      scale: 1, // 调整高宽时和原图比例（resize）
      angle: 0, // 旋转角度（rotate）
      viewScale: 0, // 在画布上的显示比例（scale）
      offsetX: 0, // 坐标变换后事件x轴位置
      offsetY: 0, // 坐标变换后事件y轴位置
      cx: 0, // 图片在画布上x轴位置（变换后坐标系统）
      cy: 0, // 图片在画布上y轴位置（变换后坐标系统）
      event: {
        cx: 0, // 图片在画布上x轴位置（原始坐标系统）
        cy: 0 // 图片在画布上y轴位置（原始坐标系统）
      },
      range: {
        x: 0, // 选择范围（setRange）在图片上的x轴位置（原始坐标系统）
        y: 0, // 选择范围（setRange）在图片上的y轴位置（原始坐标系统）
        width: 0, // 选择范围（cut）宽度（原始坐标系统）
        height: 0 // 选择范围（cut）高度（原始坐标系统）
      }, // 矩形选择框数据（左上角为原点）
      bg: true
    };
    var state = data[id];
    // 获取canvas元素
    if (option && (typeof option === "undefined" ? "undefined" : (0, _typeof3.default)(option)) === 'object') {
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
            default:
              ;
          }
        }
      }
    } else if (option) this.canvas = document.querySelector(option);
    if (this.canvas) {
      var event = moveEvent.bind(this);
      this.canvas.addEventListener('mousewheel', event, false);
      this.canvas.addEventListener('mousedown', event, false);
      this.canvas.addEventListener('mouseup', event, false);
      this.canvas.addEventListener('mouseout', event, false);
      this.canvas.addEventListener('mousemove', event, false);
      state.moveEvent = event;
      _draw(this.canvas, state);
    }
    Object.defineProperty(this, 'id', {
      value: id,
      writable: false
    });
  }

  (0, _createClass3.default)(ImgEdit, [{
    key: "destroy",
    value: function destroy() {
      if (this.canvas) {
        this.canvas.removeEventListener('mousewheel', data[this.id].moveEvent, false);
        this.canvas.removeEventListener('mousedown', data[this.id].moveEvent, false);
        this.canvas.removeEventListener('mouseup', data[this.id].moveEvent, false);
        this.canvas.removeEventListener('mouseout', data[this.id].moveEvent, false);
        this.canvas.removeEventListener('mousemove', data[this.id].moveEvent, false);
      }
      this.img = data[this.id] = data[this.id].moveEvent = data[this.id].onChange = this.input = this.canvas = null;
    }
    // 监听输入源(<input type=file>)变化

  }, {
    key: "listen",
    value: function listen(el, hook) {
      var _this = this;

      if (typeof hook === 'function') data[this.id].inputListener = function (e) {
        var res = hook(e);
        if (res === undefined || res) {
          _this.open(/file/i.test(e.target.type) ? e.target.files[0] : e.target.value);
        }
      };else {
        data[this.id].inputListener = function (e) {
          _this.open(/file/i.test(e.target.type) ? e.target.files[0] : e.target.value);
        };
      }
      this.input = (typeof el === "undefined" ? "undefined" : (0, _typeof3.default)(el)) === 'object' && 'addEventListener' in el ? el : document.querySelector(el);
      this.input.addEventListener('change', data[this.id].inputListener);
      return this;
    }
    // 删除输入源监听

  }, {
    key: "unlisten",
    value: function unlisten() {
      if (this.input) {
        this.input.removeEventListener('change', data[this.id].inputListener);
        data[this.id].inputListener = null;
      }
      return this;
    }
  }, {
    key: "onChange",
    value: function onChange(fn) {
      data[this.id].onChange = typeof fn === 'function' ? fn : null;
      return this;
    }
  }, {
    key: "reset",
    value: function reset(noDraw) {
      var state = data[this.id];
      state.width = this.img.width;
      state.height = this.img.height;
      state.x = 0;
      state.y = 0;
      state.scale = 1;
      state.angle = 0;
      state.cx = 0;
      state.cy = 0;
      state.offsetX = 0;
      state.offsetY = 0;
      state.viewScale = Math.min(1, this.canvas.width / state.width, this.canvas.height / state.height);
      state.range.width = state.range.height = state.range.x = state.range.y = 0;
      _align('center', this.canvas, state);
      if (!noDraw) {
        this.canvas && _draw(this.canvas, state, this.img);
        stateChange(state, 'reset');
      }
      return this;
    }
    // 擦除辅助内容

  }, {
    key: "clean",
    value: function clean(noDraw) {
      var state = data[this.id];
      if (!this.img) return this;
      state.range.width = state.range.height = state.range.x = state.range.y = 0;
      if (!noDraw) {
        this.canvas && _draw(this.canvas, state, this.img);
        stateChange(state, 'clean');
      }
      return this;
    }
  }, {
    key: "close",
    value: function close() {
      this.img = null;
      return this.reset(1);
    }
    // 获取图片宽度

  }, {
    key: "width",
    value: function width() {
      var state = data[this.id];
      return state.width * state.scale >> 0;
    }
    // 获取图片高度

  }, {
    key: "height",
    value: function height() {
      var state = data[this.id];
      return state.height * state.scale >> 0;
    }
    /*
     * 异步打开图片
     * @param {object/string} file 图片资源(Image/base64/url)
     * @return {object} Promise
     */

  }, {
    key: "open",
    value: function () {
      var _ref5 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee(file) {
        var state;
        return _regenerator2.default.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                state = data[this.id];
                _context.prev = 1;
                _context.t0 = loadImg;

                if (!(file instanceof Image)) {
                  _context.next = 7;
                  break;
                }

                _context.t1 = file.src;
                _context.next = 15;
                break;

              case 7:
                if (!((typeof file === "undefined" ? "undefined" : (0, _typeof3.default)(file)) === 'object')) {
                  _context.next = 13;
                  break;
                }

                _context.next = 10;
                return readFile(file);

              case 10:
                _context.t2 = _context.sent;
                _context.next = 14;
                break;

              case 13:
                _context.t2 = file;

              case 14:
                _context.t1 = _context.t2;

              case 15:
                _context.t3 = _context.t1;
                _context.next = 18;
                return (0, _context.t0)(_context.t3);

              case 18:
                this.img = _context.sent;
                _context.next = 25;
                break;

              case 21:
                _context.prev = 21;
                _context.t4 = _context["catch"](1);

                stateChange(state, 'error');
                return _context.abrupt("return", this);

              case 25:
                state.width = this.img.width;
                state.height = this.img.height;
                if (this.canvas) {
                  this.reset(1);
                  _draw(this.canvas, state, this.img);
                }
                stateChange(state, 'open');
                return _context.abrupt("return", this);

              case 30:
              case "end":
                return _context.stop();
            }
          }
        }, _callee, this, [[1, 21]]);
      }));

      function open(_x) {
        return _ref5.apply(this, arguments);
      }

      return open;
    }()
  }, {
    key: "draw",
    value: function draw() {
      var state = data[this.id];
      this.canvas && _draw(this.canvas, state, this.img);
      stateChange(state, 'draw');
      return this;
    }
  }, {
    key: "toDataURL",
    value: function toDataURL(mime, quality) {
      if (!this.img) return '';
      return save(this.img, data[this.id], 'toDataURL', mime, quality);
    }
  }, {
    key: "toBlob",
    value: function toBlob(mime, quality) {
      var _this2 = this;

      return new _promise2.default(function (resolve, reject) {
        if (!_this2.img) {
          reject(new Error(_this2.img));
        } else {
          save(_this2.img, data[_this2.id], 'toBlob', function (res) {
            resolve(res);
          }, mime, quality);
        }
      });
    }
    // 视图缩放

  }, {
    key: "scale",
    value: function scale(_scale) {
      if (!this.img) return this;
      var state = data[this.id];
      // 放大比例不能小于1或大于10
      var viewScale = state.viewScale;
      var s = viewScale + _scale;
      if (s < .1 || s > 10) {
        return this;
      } else {
        state.viewScale = s;
      }
      var ratio = state.scale * viewScale;
      if ((state.offsetX || state.offsetY) && state.offsetX - state.cx > 0 && state.offsetY - state.cy > 0 && state.offsetX < state.cx + state.width * ratio && state.offsetY < state.cy + state.height * ratio) {
        // 在图片范围内，以鼠标位置为中心
        state.event.cx -= (eventData.offsetX - state.event.cx) / viewScale * _scale;
        state.event.cy -= (eventData.offsetY - state.event.cy) / viewScale * _scale;
      } else {
        // 以图片在画布范围内中心点
        var _ratio = state.scale * _scale * .5;
        if (state.angle === .5 || state.angle === 1.5) {
          state.event.cx -= state.height * _ratio;
          state.event.cy -= state.width * _ratio;
        } else {
          state.event.cx -= state.width * _ratio;
          state.event.cy -= state.height * _ratio;
        }
      }
      this.canvas && _draw(this.canvas, state, this.img);
      stateChange(state, 'scale');
      return this;
    }
    // 裁剪

  }, {
    key: "cut",
    value: function cut(rw, rh) {
      var rx = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;
      var ry = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 0;

      if (!this.img) return this;
      var state = data[this.id];
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
      rw = rw / state.scale;
      rh = rh / state.scale;
      rx = rx / state.scale;
      ry = ry / state.scale;
      switch (state.angle) {
        case .5:
        case 1.5:
          if (state.angle === .5) {
            var _ref6 = [ry, state.height - rx - rw];
            rx = _ref6[0];
            ry = _ref6[1];
          } else {
            var _ref7 = [state.width - ry - rh, rx];
            rx = _ref7[0];
            ry = _ref7[1];
          }
          var _ref8 = [rh, rw];
          rw = _ref8[0];
          rh = _ref8[1];

          break;
        case 1:
          var _ref9 = [state.width - rw - rx, state.height - rh - ry];
          rx = _ref9[0];
          ry = _ref9[1];

          break;
        default:
          ;
      }
      if (rx >= state.width || ry >= state.height) return this;
      var x = void 0,
          y = void 0,
          width = void 0,
          height = void 0;
      x = state.x + Math.max(rx, 0);
      y = state.y + Math.max(ry, 0);
      width = Math.min(Math.min(rx + rw, state.width) /*结束点*/ - Math.max(0, rx) /*起点*/, state.width);
      height = Math.min(Math.min(ry + rh, state.height) /*结束点*/ - Math.max(0, ry) /*起点*/, state.height);
      var ratio = state.viewScale * state.scale;
      // 让图片停留在原点
      switch (state.angle) {
        case .5:
          state.event.cx += (state.height + state.y - height - y) * ratio;
          state.event.cy += (x - state.x) * ratio;
          break;
        case 1:
          state.event.cx += (state.width + state.x - width - x) * ratio;
          state.event.cy += (state.height + state.y - height - y) * ratio;
          break;
        case 1.5:
          state.event.cx += (y - state.y) * ratio;
          state.event.cy += (state.width + state.x - width - x) * ratio;
          break;
        default:
          state.event.cx += (x - state.x) * ratio;
          state.event.cy += (y - state.y) * ratio;
      }
      (0, _assign2.default)(state, { x: x, y: y, width: width, height: height });
      this.clean(1);
      this.canvas && _draw(this.canvas, state, this.img);
      stateChange(state, 'cut');
      return this;
    }
    // 调整大小

  }, {
    key: "resize",
    value: function resize(width, height) {
      if (!this.img) return this;
      var state = data[this.id];
      var sWidth = state.width * state.scale;
      var sHeight = state.height * state.scale;
      if (state.angle && state.angle !== 1) {
        var _ref10 = [sHeight, sWidth];
        sWidth = _ref10[0];
        sHeight = _ref10[1];
      }
      if (width >= sWidth && height >= sHeight) return this;
      var scale = void 0;
      if (width && height) {
        scale = Math.min(width / sWidth, height / sHeight);
      } else if (width) {
        scale = width / sWidth;
      } else {
        scale = height / sHeight;
      }
      // 确保scale和viewScale成比例
      state.scale *= scale;
      state.viewScale /= scale;
      if (state.range.width) {
        state.range.width = state.range.width * scale >> 0;
        state.range.height = state.range.height * scale >> 0;
        state.range.x = state.range.x * scale >> 0;
        state.range.y = state.range.y * scale >> 0;
        this.canvas && _draw(this.canvas, state, this.img);
      }
      stateChange(state, 'resize');
      return this;
    }
    // 旋转

  }, {
    key: "rotate",
    value: function rotate(angle) {
      if (!this.img || !angle) return this;
      var state = data[this.id];
      // 90,180,270转.5,1,1.5
      if (angle > 2 || angle < -2) angle = angle / 180;
      angle += state.angle;
      angle = angle < 0 ? 2 + angle % 2 : angle % 2;
      // 只接受0,.5,1,1.5
      if (angle % .5 || angle === state.angle) return this;
      var ratio = state.viewScale * .5;
      var diff = angle - state.angle;

      var _ref11 = state.angle === .5 || state.angle === 1.5 ? [state.height * state.scale, state.width * state.scale] : [state.width * state.scale, state.height * state.scale],
          _ref12 = (0, _slicedToArray3.default)(_ref11, 2),
          iw = _ref12[0],
          ih = _ref12[1];

      switch (diff) {
        case -1.5:
        case .5:
        case 1.5:
        case -.5:
          state.event.cx -= (ih - iw) * ratio;
          state.event.cy -= (iw - ih) * ratio;
          break;
        default:
          state.event.cx -= (iw - ih) * ratio;
          state.event.cy -= (ih - iw) * ratio;
      }
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
            var _ref13 = [ih - height - y, x, height, width];
            x = _ref13[0];
            y = _ref13[1];
            width = _ref13[2];
            height = _ref13[3];

            break;
          // 逆时针
          case -.5:
          case 1.5:
            var _ref14 = [y, iw - width - x, height, width];
            x = _ref14[0];
            y = _ref14[1];
            width = _ref14[2];
            height = _ref14[3];

            break;
          // 平翻
          default:
            var _ref15 = [iw - width - x, ih - height - y];
            x = _ref15[0];
            y = _ref15[1];

        }
        (0, _assign2.default)(state.range, { x: x, y: y, width: width, height: height });
      }
      state.angle = angle;
      this.canvas && _draw(this.canvas, state, this.img);
      stateChange(state, 'rotate');
      return this;
    }
  }, {
    key: "setRange",
    value: function setRange(width, height) {
      var x = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;
      var y = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 0;

      if (!this.img) return this;
      var state = data[this.id];
      width >>= 0;
      height >>= 0;
      x >>= 0;
      y >>= 0;

      var _ref16 = state.angle === .5 || state.angle === 1.5 ? [state.height * state.scale >> 0, state.width * state.scale >> 0] : [state.width * state.scale >> 0, state.height * state.scale >> 0],
          _ref17 = (0, _slicedToArray3.default)(_ref16, 2),
          iw = _ref17[0],
          ih = _ref17[1];

      if (width && height && width > 0 && height > 0 && (width < iw || height < ih) && x >= 0 && y >= 0 && x < iw && y < ih) {
        width = Math.min(iw - x, width);
        height = Math.min(ih - y, height);
        (0, _assign2.default)(state.range, { width: width, height: height, x: x, y: y });
        this.canvas && _draw(this.canvas, state, this.img);
        stateChange(state, 'range');
      }
      return this;
    }
  }, {
    key: "align",
    value: function align(pos) {
      if (!this.img) return this;
      var state = data[this.id];
      _align(pos, this.canvas, state);
      this.canvas && _draw(this.canvas, state, this.img);
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
            name = name + ".jpg";
            break;
          default:
            name = name + "." + ext;
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
    if (typeof src !== 'string' || !/^(?:data:image\/[^;]+;\s*base64\s*,|(?:https?:)?\/\/)/i.test(src)) {
      reject(0);
      return;
    }
    var img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = function () {
      resolve(this);
    };
    img.onerror = function (e) {
      console.error('loadImg error', e);
      reject(e);
    };
    img.src = src;
  });
}
/* 
 * 图片转base64
 *
 * @param {object} file
 * @return {object} promise
 */
function readFile(file) {
  return new _promise2.default(function (resolve, reject) {
    var fileReader = new FileReader();
    fileReader.onload = function (e) {
      resolve(e.target.result);
    };
    fileReader.onerror = function (e) {
      console.error('readFile error', e);
      reject(e);
    };
    fileReader.readAsDataURL(file);
  });
}
var resize = exports.resize = function () {
  var _ref18 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee2(img, width, height) {
    var mime, edit;
    return _regenerator2.default.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            if (!(!width && !height)) {
              _context2.next = 2;
              break;
            }

            return _context2.abrupt("return", false);

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
            return _context2.abrupt("return", edit.open(img).then(function () {
              var b64 = edit.resize(width, height).toDataURL(mime);
              edit.destroy();
              return b64;
            }));

          case 9:
          case "end":
            return _context2.stop();
        }
      }
    }, _callee2, undefined);
  }));

  return function resize(_x6, _x7, _x8) {
    return _ref18.apply(this, arguments);
  };
}();
var cut = exports.cut = function () {
  var _ref19 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee3(img, width, height, x, y) {
    var mime, edit;
    return _regenerator2.default.wrap(function _callee3$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:
            if (!(!width && !height)) {
              _context3.next = 2;
              break;
            }

            return _context3.abrupt("return", false);

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
            return _context3.abrupt("return", edit.open(img).then(function () {
              var b64 = edit.cut(width, height, x, y).toDataURL(mime);
              edit.destroy();
              return b64;
            }));

          case 9:
          case "end":
            return _context3.stop();
        }
      }
    }, _callee3, undefined);
  }));

  return function cut(_x9, _x10, _x11, _x12, _x13) {
    return _ref19.apply(this, arguments);
  };
}();
var rotate = exports.rotate = function () {
  var _ref20 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee4(img, deg) {
    var mime, edit;
    return _regenerator2.default.wrap(function _callee4$(_context4) {
      while (1) {
        switch (_context4.prev = _context4.next) {
          case 0:
            if (deg) {
              _context4.next = 2;
              break;
            }

            return _context4.abrupt("return", false);

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
            return _context4.abrupt("return", edit.open(img).then(function () {
              var b64 = edit.rotate(deg).toDataURL(mime);
              edit.destroy();
              return b64;
            }));

          case 9:
          case "end":
            return _context4.stop();
        }
      }
    }, _callee4, undefined);
  }));

  return function rotate(_x14, _x15) {
    return _ref20.apply(this, arguments);
  };
}();
exports.default = ImgEdit;