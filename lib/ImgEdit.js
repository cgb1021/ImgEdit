'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _typeof2 = require('babel-runtime/helpers/typeof');

var _typeof3 = _interopRequireDefault(_typeof2);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

exports.loadImg = loadImg;
exports.readFile = readFile;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/*
 * 图片编辑器
 */
var undefined = void 0;
var data = {};
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
/* 
 * 画矩形选择框
 */
function drawRect() {
  drawText('drawRect');
}
/*
 * 画文字
 */
function drawText(str, x, y) {
  var align = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 'left';

  console.log(str, x, y, align);
}
/* 
 * 画图
 *
 * @param {string} base64
 * @param {object} context
 */
function dwaw(base64, context) {
  drawRect();
  context.drawImage(base64, 0, 0);
}

var ImgEdit = function () {
  function ImgEdit(option) {
    (0, _classCallCheck3.default)(this, ImgEdit);

    data[this] = {};
    // 获取canvas元素
    if ((typeof option === 'undefined' ? 'undefined' : (0, _typeof3.default)(option)) === 'object') {
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
  }

  (0, _createClass3.default)(ImgEdit, [{
    key: 'destroy',
    value: function destroy() {
      this.unlisten();
      data[this] = this.input = this.canvas = null;
    }
    // 监听输入源(<input type=file>)变化

  }, {
    key: 'listen',
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
      this.input = (typeof el === 'undefined' ? 'undefined' : (0, _typeof3.default)(el)) === 'object' && 'addEventListener' in el ? el : document.querySelector(el);
      this.input.addEventListener('change', data[this].inputListener);
    }
    // 删除输入源监听

  }, {
    key: 'unlisten',
    value: function unlisten() {
      this.input && this.input.removeEventListener('change', data[this].inputListener);
    }
    // 图片资源(base64)/图片地址

  }, {
    key: 'draw',
    value: function () {
      var _ref = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee(file) {
        var img;
        return _regenerator2.default.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                if (!(file instanceof HTMLImageElement)) {
                  _context.next = 4;
                  break;
                }

                _context.t0 = file;
                _context.next = 16;
                break;

              case 4:
                _context.t1 = loadImg;

                if (!((typeof file === 'undefined' ? 'undefined' : (0, _typeof3.default)(file)) === 'object')) {
                  _context.next = 11;
                  break;
                }

                _context.next = 8;
                return readFile(file);

              case 8:
                _context.t2 = _context.sent;
                _context.next = 12;
                break;

              case 11:
                _context.t2 = file;

              case 12:
                _context.t3 = _context.t2;
                _context.next = 15;
                return (0, _context.t1)(_context.t3);

              case 15:
                _context.t0 = _context.sent;

              case 16:
                img = _context.t0;

                dwaw(img, this.canvas.getContext('2d'));

              case 18:
              case 'end':
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
    key: 'toDataURL',
    value: function toDataURL(mime) {
      return this.canvas.toDataURL(mime ? mime : 'image/jpeg');
    }
  }, {
    key: 'toBlob',
    value: function toBlob() {
      console.log('toBlob');
    }
  }, {
    key: 'resize',
    value: function resize() {
      console.log('resize');
    }
  }]);
  return ImgEdit;
}();

exports.default = ImgEdit;