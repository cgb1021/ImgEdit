"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.rotate = exports.cut = exports.resize = exports.fetchImg = undefined;

var _assign = require("babel-runtime/core-js/object/assign");

var _assign2 = _interopRequireDefault(_assign);

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

var _promise = require("babel-runtime/core-js/promise");

var _promise2 = _interopRequireDefault(_promise);

exports.loadImg = loadImg;
exports.readFile = readFile;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/*
 * 图片编辑器
 */
var undefined = void 0;
var data = {};
var eventData = {
  active: false, // 点击事件开始标记
  offsetX: 0, // 点击事件开始x轴位置
  offsetY: 0 // 点击事件开始y轴位置
};
var fontSize = 12;
var lineHeight = 1.2;
var ctrlKey = false; // ctrl键按下标记
window.addEventListener('load', function () {
  window.addEventListener("keydown", keyEvent, false);
  window.addEventListener("keyup", keyEvent, false);
});
/* 
 * 加载图片
 *
 * @param {string} src url/base64
 * @return {object} promise
 */
function loadImg(src) {
  var img = new Image();
  img.crossOrigin = "anonymous";
  return new _promise2.default(function (resolve, reject) {
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
  var fileReader = new FileReader();
  return new _promise2.default(function (res) {
    fileReader.onload = function (e) {
      res(e.target.result);
    };
    fileReader.readAsDataURL(file);
  });
}
// 移动事件
function moveEvent(e) {
  e.preventDefault();
  e.stopPropagation();
  var state = data[this._id];
  switch (e.type) {
    case "mousedown":
      eventData.active = true;
      eventData.offsetX = e.offsetX - state.event.cx;
      eventData.offsetY = e.offsetY - state.event.cy;
      if (ctrlKey) {
        state.event.rx = e.offsetX;
        state.event.ry = e.offsetY;
      }
      break;
    case "mouseup":
      eventData.active = false;
      break;
    case "mousemove":
      if (eventData.active) {
        if (ctrlKey) {
          state.event.rw = e.offsetX - state.event.rx;
          state.event.rh = e.offsetY - state.event.ry;
        } else {
          state.event.cx = e.offsetX - eventData.offsetX;
          state.event.cy = e.offsetY - eventData.offsetY;
        }
        this.draw();
      }
      break;
    case "mousewheel":
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
      break;
  }
}
function keyEvent(e) {
  switch (e.type) {
    case "keydown":
      ctrlKey = !!e.ctrlKey;
      break;
    case "keyup":
      ctrlKey = false;
      break;
  }
}
function stateChange(state, type) {
  if (state.onChange) {
    var _state$event = state.event,
        rx = _state$event.rx,
        ry = _state$event.ry,
        rw = _state$event.rw,
        rh = _state$event.rh,
        cx = _state$event.cx,
        cy = _state$event.cy;

    var width = Math.floor(state.width * state.scale);
    var height = Math.floor(state.height * state.scale);
    var rangeX = 0;
    var rangeY = 0;
    var rangeW = 0;
    var rangeH = 0;

    if (rw && rh) {
      rangeX = Math.floor((rx - cx) / state.ratio * state.scale / state.viewScale);
      rangeY = Math.floor((ry - cy) / state.ratio * state.scale / state.viewScale);
      rangeW = Math.floor(rw / state.ratio * state.scale / state.viewScale);
      rangeH = Math.floor(rh / state.ratio * state.scale / state.viewScale);
    }
    if (state.angle && state.angle !== 1) {
      var _ref = [height, width];
      width = _ref[0];
      height = _ref[1];
    }
    state.onChange({ width: width, height: height, viewScale: state.viewScale.toFixed(2), range: { x: rangeX, y: rangeY, width: rangeW, height: rangeH }, type: type });
  }
}
// 设置对齐
function align(pos, canvas, state) {
  var sWidth = state.width * state.ratio * state.viewScale;
  var sHeight = state.height * state.ratio * state.viewScale;

  switch (pos) {
    case 'top':
    case 1:
      state.event.cy = 0;
      break;
    case 'right':
    case 2:
      state.event.cx = canvas.width - (!state.angle || state.angle === 1 ? sWidth : sHeight);
      break;
    case 'bottom':
    case 3:
      state.event.cy = canvas.height - (!state.angle || state.angle === 1 ? sHeight : sWidth);
      break;
    case 'left':
    case 4:
      state.event.cx = 0;
      break;
    default:
      if (!state.angle || state.angle === 1) {
        state.event.cx = (canvas.width - sWidth) / 2;
        state.event.cy = (canvas.height - sHeight) / 2;
      } else {
        state.event.cx = (canvas.width - sHeight) / 2;
        state.event.cy = (canvas.height - sWidth) / 2;
      }
  }
}
/*
 * 画文字
 */
function drawText(context, str, x, y) {
  var align = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : 'left';

  var padding = 5;
  context.font = fontSize + "px Arial";
  var m = context.measureText(str);
  context.fillStyle = "rgba(255,255,255,.5)";
  context.fillRect(align !== 'right' ? x : x - m.width - padding * 2, y - fontSize * lineHeight, m.width + padding * 2 - 1, fontSize * lineHeight * 1.5 - 1);

  context.fillStyle = "#000";
  context.textAlign = align;
  context.fillText(str, align !== 'right' ? x + padding : x - padding, y);
}
/* 
 * 画矩形选择框
 */
function drawRect(context, state) {
  var _state$event2 = state.event,
      rx = _state$event2.rx,
      ry = _state$event2.ry,
      rw = _state$event2.rw,
      rh = _state$event2.rh,
      cx = _state$event2.cx,
      cy = _state$event2.cy;

  if (rw < 0) {
    rx += rw;
    rw = -rw;
  }
  if (rh < 0) {
    ry += rh;
    rh = -rh;
  }

  if (rw && rh) {
    var rt = state.scale / state.ratio / state.viewScale;

    context.setLineDash([5, 2]);
    context.strokeStyle = "black";
    context.lineWidth = 1;
    context.strokeRect(rx, ry, rw, rh);

    drawText(context, Math.floor((rx - cx) * rt) + ", " + Math.floor((ry - cy) * rt), rx, ry + fontSize * lineHeight);
    drawText(context, Math.floor(rw * rt) + " x " + Math.floor(rh * rt), rx + rw, ry + rh - fontSize * .5, 'right');
  }
}
/* 
 * 画图
 *
 * @param {string} img
 * @param {object} canvas
 */
function _draw(img, canvas, state) {
  if (!canvas) return;
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
    if (!state.angle || state.angle === 1) {
      state.ratio = Math.min(canvas.width / state.width, canvas.height / state.height);
    } else {
      state.ratio = Math.min(canvas.width / state.height, canvas.height / state.width);
    }
    if (state.cx === null && state.cy === null) {
      // 图片居中
      align('center', canvas, state);
    }
    // 坐标转换
    var sWidth = state.width * state.ratio * state.viewScale;
    var sHeight = state.height * state.ratio * state.viewScale;
    var hWidth = canvas.width * 0.5;
    var hHeight = canvas.height * 0.5;
    switch (state.angle) {
      case 0.5:
        // 顺时针90°
        state.cx = state.event.cy;
        state.cy = canvas.width - state.event.cx - sHeight;
        var _ref2 = [state.event.ry, canvas.width - state.event.rx - state.event.rw, state.event.rh, state.event.rw];
        state.range.x = _ref2[0];
        state.range.y = _ref2[1];
        state.range.width = _ref2[2];
        state.range.height = _ref2[3];

        break;
      case 1.5:
        // 逆时针90°
        state.cx = canvas.height - state.event.cy - sWidth;
        state.cy = state.event.cx;
        var _ref3 = [canvas.height - state.event.ry - state.event.rh, state.event.rx, state.event.rh, state.event.rw];
        state.range.x = _ref3[0];
        state.range.y = _ref3[1];
        state.range.width = _ref3[2];
        state.range.height = _ref3[3];

        break;
      case 1:
        // 180°
        state.cx = canvas.width - state.event.cx - sWidth;
        state.cy = canvas.height - state.event.cy - sHeight;
        var _ref4 = [canvas.width - state.event.rx - state.event.rw, canvas.height - state.event.ry - state.event.rh, state.event.rw, state.event.rh];
        state.range.x = _ref4[0];
        state.range.y = _ref4[1];
        state.range.width = _ref4[2];
        state.range.height = _ref4[3];

        break;
      default:
        // 0°
        state.cx = state.event.cx;
        state.cy = state.event.cy;
        var _ref5 = [state.event.rx, state.event.ry, state.event.rw, state.event.rh];
        state.range.x = _ref5[0];
        state.range.y = _ref5[1];
        state.range.width = _ref5[2];
        state.range.height = _ref5[3];

    }
    // 变换坐标轴
    context.save();
    if (state.angle) {
      context.translate(hWidth, hHeight);
      context.rotate(window.Math.PI * state.angle);
      if (state.angle !== 1) {
        context.translate(-hHeight, -hWidth);
      } else {
        context.translate(-hWidth, -hHeight);
      }
    }
    // console.log(state.x, state.y, state.width, state.height, cx, cy, sWidth, sHeight);
    context.drawImage(img, state.x, state.y, state.width, state.height, state.cx, state.cy, sWidth, sHeight);
    context.restore();
    /*绘制图片结束*/
    // 画矩形选择框
    if (state.event.rw && state.event.rh) {
      drawRect(context, state);
      stateChange(state, 'range');
    }
  }
}

var ImgEdit = function () {
  function ImgEdit(option) {
    (0, _classCallCheck3.default)(this, ImgEdit);

    this._id = (0, _symbol2.default)();
    this.canvas = null;
    data[this._id] = {
      img: null, // new Image()
      width: 0, // 图片裁剪范围宽度
      height: 0, // 图片裁剪范围高度
      x: 0, // 图片上的x轴位置
      y: 0, // 图片上的y轴位置
      cx: null, // 坐标变换后画图x轴位置（画布上）
      cy: null, // 坐标变换后画图y轴位置（画布上）
      angle: 0, // 旋转角度
      scale: 1, // 调整宽高时的缩放比例(和输出有关系)
      ratio: 1, // 图片和画布的高宽比例
      viewScale: 1, // 与画布的缩放比例（和显示有关系）
      offsetX: 0, // 坐标变换后事件x轴位置
      offsetY: 0, // 坐标变换后事件y轴位置
      event: {
        cx: 0, // 原始坐标系统下在画布x轴位置
        cy: 0, // 原始坐标系统下在画布y轴位置
        rx: 0, // 原始坐标系统下的矩形选择框x轴位置（offsetX）
        ry: 0, // 原始坐标系统下的矩形选择框y轴位置（offsetY）
        rw: 0, // 原始坐标系统下的矩形选择框宽度
        rh: 0 // 原始坐标系统下的矩形选择框高度
      },
      range: {
        x: 0,
        y: 0,
        width: 0,
        height: 0
      }, // 坐标变换后的矩形选择框数据
      bg: true
    };
    var state = data[this._id];
    // 获取canvas元素
    if ((typeof option === "undefined" ? "undefined" : (0, _typeof3.default)(option)) === 'object') {
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
            case 'input':
              this.listen(option.input, option.inputListener);
              break;
            default:
              state[k] = option[k];
          }
        }
      }
    } else this.canvas = document.querySelector(option);
    if (this.canvas) {
      var event = moveEvent.bind(this);
      this.canvas.addEventListener("mousewheel", event, false);
      this.canvas.addEventListener("mousedown", event, false);
      this.canvas.addEventListener("mouseup", event, false);
      this.canvas.addEventListener("mousemove", event, false);
      state.moveEvent = event;
      _draw(null, this.canvas, state);
    }
  }

  (0, _createClass3.default)(ImgEdit, [{
    key: "reset",
    value: function reset() {
      var state = data[this._id];
      state.x = 0;
      state.y = 0;
      state.angle = 0;
      state.scale = 1;
      state.ratio = 1;
      state.viewScale = 1;
      state.offsetX = 0;
      state.offsetY = 0;
      state.cx = null;
      state.cy = null;
      return this;
    }
  }, {
    key: "destroy",
    value: function destroy() {
      this.unlisten();
      if (this.canvas) {
        this.canvas.removeEventListener("mousewheel", data[this._id].moveEvent, false);
        this.canvas.removeEventListener("mousedown", data[this._id].moveEvent, false);
        this.canvas.removeEventListener("mouseup", data[this._id].moveEvent, false);
        this.canvas.removeEventListener("mousemove", data[this._id].moveEvent, false);
      }
      data[this._id] = data[this._id].moveEvent = data[this._id].onChange = data[this._id].img = this.input = this.canvas = null;
    }
    // 监听输入源(<input type=file>)变化

  }, {
    key: "listen",
    value: function listen(el, hook) {
      var _this = this;

      if (typeof hook === 'function') data[this._id].inputListener = function (e) {
        var res = hook(e);
        if (res === undefined || res) {
          _this.open(e.target.files[0]).then(function () {
            _this.draw();
          });
        }
      };else {
        data[this._id].inputListener = function (e) {
          _this.open(e.target.files[0]).then(function () {
            _this.draw();
          });
        };
      }
      this.input = (typeof el === "undefined" ? "undefined" : (0, _typeof3.default)(el)) === 'object' && 'addEventListener' in el ? el : document.querySelector(el);
      this.input.addEventListener('change', data[this._id].inputListener);
      return this;
    }
    // 删除输入源监听

  }, {
    key: "unlisten",
    value: function unlisten() {
      this.input && this.input.removeEventListener('change', data[this._id].inputListener);
      return this;
    }
  }, {
    key: "onChange",
    value: function onChange(fn) {
      data[this._id].onChange = typeof fn === 'function' ? fn : null;
      return this;
    }
    /*
     * 异步打开图片
     * @param {object/string} file 图片资源(Image/base64/url)
     * @return {object} Promise
     */

  }, {
    key: "open",
    value: function () {
      var _ref6 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee(file) {
        var state;
        return _regenerator2.default.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                state = data[this._id];
                _context.t0 = loadImg;

                if (!(file instanceof Image)) {
                  _context.next = 6;
                  break;
                }

                _context.t1 = file.src;
                _context.next = 14;
                break;

              case 6:
                if (!((typeof file === "undefined" ? "undefined" : (0, _typeof3.default)(file)) === 'object')) {
                  _context.next = 12;
                  break;
                }

                _context.next = 9;
                return readFile(file);

              case 9:
                _context.t2 = _context.sent;
                _context.next = 13;
                break;

              case 12:
                _context.t2 = file;

              case 13:
                _context.t1 = _context.t2;

              case 14:
                _context.t3 = _context.t1;
                _context.next = 17;
                return (0, _context.t0)(_context.t3);

              case 17:
                state.img = _context.sent;

                state.width = state.img.width;
                state.height = state.img.height;
                this.reset();
                return _context.abrupt("return", this);

              case 22:
              case "end":
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      function open(_x2) {
        return _ref6.apply(this, arguments);
      }

      return open;
    }()
  }, {
    key: "draw",
    value: function draw() {
      _draw(data[this._id].img, this.canvas, data[this._id]);
      return this;
    }
  }, {
    key: "toDataURL",
    value: function toDataURL(mime, quality) {
      var canvas = document.createElement("canvas");
      var ctx = canvas.getContext("2d");
      var state = data[this._id];
      var x = state.x,
          y = state.y,
          width = state.width,
          height = state.height;

      var dWidth = canvas.width = Math.floor(width * state.scale);
      var dHeight = canvas.height = Math.floor(height * state.scale);

      if (state.angle) {
        if (state.angle !== 1) {
          var _ref7 = [canvas.height, canvas.width];
          // state.angle = .5, 1.5

          canvas.width = _ref7[0];
          canvas.height = _ref7[1];
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
      ctx.drawImage(state.img, Math.floor(x), Math.floor(y), Math.floor(width), Math.floor(height), 0, 0, dWidth, dHeight);
      return canvas.toDataURL(mime, quality);
    }
  }, {
    key: "toBlob",
    value: function toBlob() {
      console.log('toBlob');
    }
    // 清理选择矩形

  }, {
    key: "clean",
    value: function clean() {
      data[this._id].viewScale = 1;
      data[this._id].cx = data[this._id].cy = null;
    }
    // 获取图片宽度

  }, {
    key: "width",
    value: function width() {
      return data[this._id].width;
    }
    // 获取图片高度

  }, {
    key: "height",
    value: function height() {
      return data[this._id].height;
    }
    // 视图缩放

  }, {
    key: "scale",
    value: function scale(_scale) {
      var state = data[this._id];
      var x = state.offsetX - state.cx;
      var y = state.offsetY - state.cy;
      var s = state.viewScale + _scale;

      // 放大比例不能小于1或大于10
      if (s < 1 || s > 10) {
        return this;
      } else {
        state.viewScale = s;
      }
      // 在图片范围内
      if (x > 0 && y > 0 && state.offsetX < state.cx + state.width * state.ratio * state.viewScale && state.offsetY < state.cy + state.height * state.ratio * state.viewScale) {
        state.event.cx -= (eventData.offsetX - state.event.cx) / (state.viewScale - _scale) * _scale;
        state.event.cy -= (eventData.offsetY - state.event.cy) / (state.viewScale - _scale) * _scale;
      }

      this.draw();
      stateChange(state, 'scale');

      return this;
    }
    // 裁剪

  }, {
    key: "cut",
    value: function cut(rw, rh) {
      var rx = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;
      var ry = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 0;

      var state = data[this._id];
      var x = void 0,
          y = void 0,
          width = void 0,
          height = void 0;
      if (!rw || !rh) {
        var rt = state.ratio * state.viewScale;
        var xEnd = state.cx + state.width * rt;
        var yEnd = state.cy + state.height * rt;

        // console.log(!rw, !rh, rx + rw <= state.cx, ry + rh <= state.cy, rx >= xEnd, ry >= yEnd)
        // 是否在图片范围内
        var _state$range = state.range;
        rx = _state$range.x;
        ry = _state$range.y;
        rw = _state$range.width;
        rh = _state$range.height;
        if (!rw || !rh || rx + rw <= state.cx || ry + rh <= state.cy || rx >= xEnd || ry >= yEnd) return this;

        x = state.x + Math.max((rx - state.cx) / rt, 0);
        y = state.y + Math.max((ry - state.cy) / rt, 0);
        width = Math.min((Math.min(rx + rw, xEnd) - Math.max(state.cx, rx)) / rt, state.width);
        height = Math.min((Math.min(ry + rh, yEnd) - Math.max(state.cy, ry)) / rt, state.height);
      } else {
        rw = (rw >> 0) / state.scale;
        rh = (rh >> 0) / state.scale;
        rx = (rx >> 0) / state.scale;
        ry = (ry >> 0) / state.scale;

        if (state.angle) {
          switch (state.angle) {
            case .5:
            case 1.5:
              if (state.angle === .5) {
                var _ref8 = [ry, state.height - rx - rw];
                rx = _ref8[0];
                ry = _ref8[1];
              } else {
                var _ref9 = [state.width - ry - rh, rx];
                rx = _ref9[0];
                ry = _ref9[1];
              }

              var _ref10 = [rh, rw];
              rw = _ref10[0];
              rh = _ref10[1];

              break;
            default:
              var _ref11 = [state.width - rw - rx, state.height - rh - ry];
              rx = _ref11[0];
              ry = _ref11[1];

          }
        }

        if (rx >= state.width || ry >= state.height) return this;

        x = state.x + Math.max(rx, 0);
        y = state.y + Math.max(ry, 0);
        width = Math.min(Math.min(rx + rw, state.width) /*结束点*/ - Math.max(0, rx) /*起点*/, state.width);
        height = Math.min(Math.min(ry + rh, state.height) /*结束点*/ - Math.max(0, ry) /*起点*/, state.height);
      }
      (0, _assign2.default)(state, { x: x, y: y, width: width, height: height });
      this.clean();
      this.eraser();
      stateChange(state, 'cut');
      return this;
    }
    // 调整大小

  }, {
    key: "resize",
    value: function resize(width, height) {
      var state = data[this._id];
      var sWidth = state.width * state.scale;
      var sHeight = state.height * state.scale;
      if (state.angle && state.angle !== 1) {
        var _ref12 = [sHeight, sWidth];
        sWidth = _ref12[0];
        sHeight = _ref12[1];
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
      state.scale *= scale;
      return this;
    }
    // 旋转

  }, {
    key: "rotate",
    value: function rotate(angle) {
      var state = data[this._id];
      // 角度转换
      switch (angle) {
        case -.5:
        case .5:
        case -1.5:
        case 1.5:
        case 0:
        case -1:
        case 1:
          break;
        default:
          if (angle % 90) return this;
          angle = angle / 90 * .5;
      }

      angle += state.angle;
      state.angle = angle < 0 ? 2 + angle % 2 : angle % 2;
      align('center', this.canvas, state);
      this.draw();
      stateChange(state, 'rotate');

      return this;
    }
    // 擦除辅助内容

  }, {
    key: "eraser",
    value: function eraser() {
      var state = data[this._id];
      state.event.rw = state.event.rh = 0;
      this.draw();
      stateChange(data[this._id], 'range');

      return this;
    }
  }]);
  return ImgEdit;
}();

var fetchImg = exports.fetchImg = function fetchImg(url) {
  return new _promise2.default(function (resolve) {
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
    xhr.open('GET', url);
    // xhr.overrideMimeType('text/plain; charset=x-user-defined')
    xhr.send(null);
  });
};
var resize = exports.resize = function () {
  var _ref13 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee2(img, width, height) {
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
              edit.resize(width, height);
              var b64 = edit.toDataURL(mime);
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

  return function resize(_x5, _x6, _x7) {
    return _ref13.apply(this, arguments);
  };
}();
var cut = exports.cut = function cut() {
  console.log('quick cut');
};
var rotate = exports.rotate = function rotate() {
  console.log('quick rotate');
};
exports.default = ImgEdit;