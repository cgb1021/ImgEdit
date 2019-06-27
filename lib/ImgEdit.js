"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

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
  dx: 0, // 原始坐标系统下的画图x轴位置
  dy: 0 // 原始坐标系统下的画图y轴位置
};
var range = {
  rx: 0,
  ry: 0,
  rw: 0,
  rh: 0 // 坐标变换后的矩形选择框数据
};var fontSize = 12;
var lineHeight = 1.2;
var altKey = false; // alt键按下标记
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
      eventData.offsetX = e.offsetX - eventData.dx;
      eventData.offsetY = e.offsetY - eventData.dy;

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
          eventData.dx = e.offsetX - eventData.offsetX;
          eventData.dy = e.offsetY - eventData.offsetY;
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
          offsetX = e.offsetY;
          offsetY = this.canvas.width - e.offsetX;
          break;
        case 1.5:
          offsetX = this.canvas.height - e.offsetY;
          offsetY = e.offsetX;
          break;
        case 1:
          offsetX = this.canvas.width - e.offsetX;
          offsetY = this.canvas.height - e.offsetY;
          break;
        default:
          offsetX = e.offsetX;
          offsetY = e.offsetY;
      }

      this.scale(direct ? 0.1 : -0.1);
      break;
  }
}
function stateChange(data, type) {
  typeof data.stateChange === 'function' && data.stateChange(type);
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
      dx = eventData.dx,
      dy = eventData.dy;

  if (rw < 0) {
    rx += rw;
    rw = -rw;
  }
  if (rh < 0) {
    ry += rh;
    rh = -rh;
  }

  if (rw && rh) {
    var rt = data.scale / data.ratio / viewScale;

    context.setLineDash([5, 2]);
    context.strokeStyle = "black";
    context.lineWidth = 1;
    context.strokeRect(rx, ry, rw, rh);

    drawText(context, Math.floor((rx - dx) * rt) + ", " + Math.floor((ry - dy) * rt), rx, ry + fontSize * lineHeight);
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
  if (!data.angle || data.angle === 1) {
    data.ratio = Math.min(canvas.width / data.width, canvas.height / data.height);
  } else {
    data.ratio = Math.min(canvas.width / data.height, canvas.height / data.width);
  }
  // 画矩形选择框
  if (eventData.rw && eventData.rh) {
    drawRect(context, data);
    stateChange(data, 'range');
  }
  context.drawImage(img, 0, 0);
}

var ImgEdit = function () {
  function ImgEdit(option) {
    (0, _classCallCheck3.default)(this, ImgEdit);

    data[this] = {
      x: 0, // 图片x轴位置
      y: 0, // 图片y轴位置
      width: 0, // 图片裁剪宽度
      height: 0, // 图片裁剪高度
      scale: 1, // 缩放比例(和输出有关系)
      angle: 0, // 角度
      ratio: 1,
      dataURL: ''
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
  }

  (0, _createClass3.default)(ImgEdit, [{
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
    // 图片资源(base64)/图片地址

  }, {
    key: "draw",
    value: function () {
      var _ref = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee(file) {
        var img;
        return _regenerator2.default.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                img = void 0;

                if (!file) {
                  _context.next = 22;
                  break;
                }

                if (!(file instanceof HTMLImageElement)) {
                  _context.next = 6;
                  break;
                }

                img = file;
                _context.next = 18;
                break;

              case 6:
                _context.t0 = loadImg;

                if (!((typeof file === "undefined" ? "undefined" : (0, _typeof3.default)(file)) === 'object')) {
                  _context.next = 13;
                  break;
                }

                _context.next = 10;
                return readFile(file);

              case 10:
                _context.t1 = _context.sent;
                _context.next = 14;
                break;

              case 13:
                _context.t1 = file;

              case 14:
                _context.t2 = _context.t1;
                _context.next = 17;
                return (0, _context.t0)(_context.t2);

              case 17:
                img = _context.sent;

              case 18:
                data[this].width = img.width;
                data[this].height = img.height;
                _context.next = 26;
                break;

              case 22:
                if (!data[this].dataURL) {
                  _context.next = 26;
                  break;
                }

                _context.next = 25;
                return loadImg(data[this].dataURL);

              case 25:
                img = _context.sent;

              case 26:
                dwaw(img, this.canvas, data[this]);
                return _context.abrupt("return", this);

              case 28:
              case "end":
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      function draw(_x2) {
        return _ref.apply(this, arguments);
      }

      return draw;
    }()
  }, {
    key: "dataURL",
    value: function dataURL(base64) {
      data[this].dataURL = base64;
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
  }, {
    key: "resize",
    value: function resize() {
      console.log('resize');
    }
  }, {
    key: "scale",
    value: function scale() {
      console.log('scale');
    }
  }]);
  return ImgEdit;
}();

exports.default = ImgEdit;