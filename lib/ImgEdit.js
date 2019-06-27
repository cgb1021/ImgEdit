"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.cut = exports.resize = undefined;

var _regenerator = require("babel-runtime/regenerator");

var _regenerator2 = _interopRequireDefault(_regenerator);

var _asyncToGenerator2 = require("babel-runtime/helpers/asyncToGenerator");

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _typeof2 = require("babel-runtime/helpers/typeof");

var _typeof3 = _interopRequireDefault(_typeof2);

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
  offsetY: 0, // 点击事件开始y轴位置
  rx: 0, // 原始坐标系统下的矩形选择框x轴位置
  ry: 0, // 原始坐标系统下的矩形选择框y轴位置
  rw: 0, // 原始坐标系统下的矩形选择框宽度
  rh: 0, // 原始坐标系统下的矩形选择框高度
  cx: 0, // 原始坐标系统下的画图x轴位置
  cy: 0 // 原始坐标系统下的画图y轴位置
};
var range = {
  rx: 0,
  ry: 0,
  rw: 0,
  rh: 0 // 坐标变换后的矩形选择框数据
};var fontSize = 12;
var lineHeight = 1.2;
var altKey = false; // alt键按下标记
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
  return new _promise2.default(function (res, rej) {
    img.onload = function () {
      res(this);
    };
    img.onerror = function (e) {
      console.error('loadImg error', e);
      rej(e);
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
  switch (e.type) {
    case "mousedown":
      eventData.active = true;
      eventData.offsetX = e.offsetX - eventData.cx;
      eventData.offsetY = e.offsetY - eventData.cy;

      if (altKey) {
        eventData.rx = e.offsetX;
        eventData.ry = e.offsetY;
      }
      break;
    case "mouseup":
      eventData.active = false;
      break;
    case "mousemove":
      if (eventData.active) {
        if (altKey) {
          eventData.rw = e.offsetX - eventData.rx;
          eventData.rh = e.offsetY - eventData.ry;
        } else {
          eventData.cx = e.offsetX - eventData.offsetX;
          eventData.cy = e.offsetY - eventData.offsetY;
        }

        this.draw();
      }
      break;
    case "mousewheel":
      var direct = e.wheelDelta ? e.wheelDelta > 0 ? 0 : 1 : e.detail > 0 ? 0 : 1; // 0 上(缩小，scale变小) 1 下(放大，scale变大)
      var state = data[this];

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
      altKey = !!e.altKey;
      break;
    case "keyup":
      altKey = false;
      break;
  }
}
function stateChange(data, type) {
  typeof data.stateChange === 'function' && data.stateChange(type);
}
// 设置对齐
function align(pos, canvas, data) {
  var sWidth = data.width * data.ratio * data.viewScale,
      sHeight = data.height * data.ratio * data.viewScale;

  switch (pos) {
    case 'top':
    case 1:
      eventData.cy = 0;
      break;
    case 'right':
    case 2:
      eventData.cx = canvas.width - (!data.angle || data.angle === 1 ? sWidth : sHeight);
      break;
    case 'bottom':
    case 3:
      eventData.cy = canvas.height - (!data.angle || data.angle === 1 ? sHeight : sWidth);
      break;
    case 'left':
    case 4:
      eventData.cx = 0;
      break;
    default:
      if (!data.angle || data.angle === 1) {
        eventData.cx = (canvas.width - sWidth) / 2;
        eventData.cy = (canvas.height - sHeight) / 2;
      } else {
        eventData.cx = (canvas.width - sHeight) / 2;
        eventData.cy = (canvas.height - sWidth) / 2;
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
function drawRect(context, data) {
  var rx = eventData.rx,
      ry = eventData.ry,
      rw = eventData.rw,
      rh = eventData.rh,
      cx = eventData.cx,
      cy = eventData.cy;

  if (rw < 0) {
    rx += rw;
    rw = -rw;
  }
  if (rh < 0) {
    ry += rh;
    rh = -rh;
  }

  if (rw && rh) {
    var rt = data.scale / data.ratio / data.viewScale;

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
function dwaw(img, canvas, data) {
  var context = canvas.getContext('2d');
  context.clearRect(0, 0, canvas.width, canvas.height);
  // 画背景
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
  // 画图片
  if (img) {
    if (!data.angle || data.angle === 1) {
      data.ratio = Math.min(canvas.width / data.width, canvas.height / data.height);
    } else {
      data.ratio = Math.min(canvas.width / data.height, canvas.height / data.width);
    }
    if (data.cx === null && data.cy === null) {
      // 图片居中
      align('center', canvas, data);
    }
    // 坐标转换
    var sWidth = data.width * data.ratio * data.viewScale,
        sHeight = data.height * data.ratio * data.viewScale,
        hWidth = canvas.width * 0.5,
        hHeight = canvas.height * 0.5;
    switch (data.angle) {
      case 0.5:
        // 顺时针90°
        data.cx = eventData.cy;
        data.cy = canvas.width - eventData.cx - sHeight;
        var _ref = [eventData.ry, canvas.width - eventData.rx - eventData.rw, eventData.rh, eventData.rw];
        range.rx = _ref[0];
        range.ry = _ref[1];
        range.rw = _ref[2];
        range.rh = _ref[3];

        break;
      case 1.5:
        // 逆时针90°
        data.cx = canvas.height - eventData.cy - sWidth;
        data.cy = eventData.cx;
        var _ref2 = [canvas.height - eventData.ry - eventData.rh, eventData.rx, eventData.rh, eventData.rw];
        range.rx = _ref2[0];
        range.ry = _ref2[1];
        range.rw = _ref2[2];
        range.rh = _ref2[3];

        break;
      case 1:
        // 180°
        data.cx = canvas.width - eventData.cx - sWidth;
        data.cy = canvas.height - eventData.cy - sHeight;
        var _ref3 = [canvas.width - eventData.rx - eventData.rw, canvas.height - eventData.ry - eventData.rh, eventData.rw, eventData.rh];
        range.rx = _ref3[0];
        range.ry = _ref3[1];
        range.rw = _ref3[2];
        range.rh = _ref3[3];

        break;
      default:
        // 0°
        data.cx = eventData.cx;
        data.cy = eventData.cy;
        var _ref4 = [eventData.rx, eventData.ry, eventData.rw, eventData.rh];
        range.rx = _ref4[0];
        range.ry = _ref4[1];
        range.rw = _ref4[2];
        range.rh = _ref4[3];

    }
    // 变换坐标轴
    context.save();
    if (data.angle) {
      context.translate(hWidth, hHeight);
      context.rotate(window.Math.PI * data.angle);
      if (data.angle !== 1) {
        context.translate(-hHeight, -hWidth);
      } else {
        context.translate(-hWidth, -hHeight);
      }
    }
    // console.log(state.x, state.y, state.width, state.height, cx, cy, sWidth, sHeight);
    context.drawImage(img, data.x, data.y, data.width, data.height, data.cx, data.cy, sWidth, sHeight);
    context.restore();
    /*绘制图片结束*/
    // 画矩形选择框
    if (eventData.rw && eventData.rh) {
      drawRect(context, data);
      stateChange(data, 'range');
    }
  }
}

var ImgEdit = function () {
  function ImgEdit(option) {
    (0, _classCallCheck3.default)(this, ImgEdit);

    data[this] = {
      img: null, // new Image()
      width: 0, // 图片裁剪范围宽度
      height: 0, // 图片裁剪范围高度
      x: 0, // 图片上的x轴位置
      y: 0, // 图片上的y轴位置
      angle: 0, // 旋转角度
      scale: 1, // 裁剪时的缩放比例(和输出有关系)
      ratio: 1, // 图片和画布的高宽比例
      viewScale: 1, // 与画布的缩放比例（和显示有关系）
      offsetX: 0, // 坐标变换后事件x轴位置
      offsetY: 0, // 坐标变换后事件y轴位置
      cx: null, // 坐标变换后画图x轴位置（画布上）
      cy: null // 坐标变换后画图y轴位置（画布上）

      // 获取canvas元素
    };if ((typeof option === "undefined" ? "undefined" : (0, _typeof3.default)(option)) === 'object') {
      if (option instanceof HTMLCanvasElement) this.canvas = option;else {
        this.canvas = typeof option.canvas === 'string' ? document.querySelector(option.canvas) : option.canvas;
        if (this.canvas) {
          for (var k in option) {
            switch (k) {
              case 'width':
                this.canvas.width = option.width;
                break;
              case 'height':
                this.canvas.height = option.height;
                break;
              case 'input':
                this.listen(option.input, option.inputListener);
                break;
            }
          }
        }
      }
    } else this.canvas = document.querySelector(option);
    var event = moveEvent.bind(this);
    this.canvas.addEventListener("mousewheel", event, false);
    this.canvas.addEventListener("mousedown", event, false);
    this.canvas.addEventListener("mouseup", event, false);
    this.canvas.addEventListener("mousemove", event, false);
    data[this].moveEvent = event;
    this.draw(null, this.canvas);
  }

  (0, _createClass3.default)(ImgEdit, [{
    key: "reset",
    value: function reset() {
      var d = data[this];
      d.x = 0;
      d.y = 0;
      d.angle = 0;
      d.scale = 1;
      d.ratio = 1;
      d.viewScale = 1;
      d.offsetX = 0;
      d.offsetY = 0;
      d.cx = null;
      d.cy = null;
      return this;
    }
  }, {
    key: "destroy",
    value: function destroy() {
      this.unlisten();
      this.canvas.removeEventListener("mousewheel", data[this].moveEvent, false);
      this.canvas.removeEventListener("mousedown", data[this].moveEvent, false);
      this.canvas.removeEventListener("mouseup", data[this].moveEvent, false);
      this.canvas.removeEventListener("mousemove", data[this].moveEvent, false);
      data[this] = this.input = this.canvas = null;
    }
    // 监听输入源(<input type=file>)变化

  }, {
    key: "listen",
    value: function listen(el, hook) {
      var _this = this;

      if (typeof hook === 'function') data[this].inputListener = function (e) {
        var res = hook(e);
        if (res === undefined || res) {
          _this.draw(e.target.files[0]);
        }
      };else {
        data[this].inputListener = function (e) {
          _this.draw(e.target.files[0]);
        };
      }
      this.input = (typeof el === "undefined" ? "undefined" : (0, _typeof3.default)(el)) === 'object' && 'addEventListener' in el ? el : document.querySelector(el);
      this.input.addEventListener('change', data[this].inputListener);
      return this;
    }
    // 删除输入源监听

  }, {
    key: "unlisten",
    value: function unlisten() {
      this.input && this.input.removeEventListener('change', data[this].inputListener);
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
      var _ref5 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee(file) {
        var d;
        return _regenerator2.default.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                d = data[this];
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
                d.img = _context.sent;

                d.width = d.img.width;
                d.height = d.img.height;
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
        return _ref5.apply(this, arguments);
      }

      return open;
    }()
  }, {
    key: "draw",
    value: function draw() {
      dwaw(data[this].img, this.canvas, data[this]);
      return this;
    }
  }, {
    key: "toDataURL",
    value: function toDataURL(mime) {
      return this.canvas.toDataURL(mime ? mime : 'image/jpeg');
    }
  }, {
    key: "toBlob",
    value: function toBlob() {
      console.log('toBlob');
    }
    // 获取图片宽度

  }, {
    key: "width",
    value: function width() {
      return data[this].width;
    }
    // 获取图片高度

  }, {
    key: "height",
    value: function height() {
      return data[this].height;
    }
    // 视图缩放

  }, {
    key: "scale",
    value: function scale() {
      console.log('scale');
    }
    // 调整大小

  }, {
    key: "resize",
    value: function resize() {
      console.log('resize');
    }
    // 裁剪

  }, {
    key: "cut",
    value: function cut() {
      console.log('cut');
    }
    // 旋转

  }, {
    key: "rotate",
    value: function rotate() {
      console.log('rotate');
    }
  }]);
  return ImgEdit;
}();

var resize = exports.resize = function resize() {
  console.log('quick resize');
};
var cut = exports.cut = function cut() {
  console.log('quick cut');
};
exports.default = ImgEdit;