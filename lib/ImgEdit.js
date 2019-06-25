'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.output = exports.input = undefined;

var _typeof2 = require('babel-runtime/helpers/typeof');

var _typeof3 = _interopRequireDefault(_typeof2);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var loadImg = function () {
  var _ref = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee(src) {
    var img;
    return _regenerator2.default.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            img = new Image();

            img.crossOrigin = "anonymous";

            return _context.abrupt('return', new _promise2.default(function (res, rej) {
              img.onload = function () {
                res(this);
              };
              img.onerror = function (e) {
                console.error('loadImg error', e);
                rej(e);
              };
              img.src = src;
            }));

          case 3:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, this);
  }));

  return function loadImg(_x) {
    return _ref.apply(this, arguments);
  };
}();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var extReg = /\.(?:png|jpg|jpeg|gif|bmp)$/i;
var data = {};
function inputListener(e) {
  var reg = this.extReg || extReg;
  if (reg.test(e.target.files[0].name)) {
    this.img(e.target.files[0]);
  }
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
              case 'file':
                this.listen(option.file);
                break;
              case 'extReg':
                this.extReg = option.extReg;
                break;
            }
          }
        }
      }
    } else this.canvas = document.querySelector(option);
    if (!this.canvas || (0, _typeof3.default)(this.canvas) !== 'object' || !(this.canvas instanceof HTMLCanvasElement)) {
      data[this] = null;
      throw 'no canvas element';
    }
  }
  // 监听输入源(<input type=file>)变化


  (0, _createClass3.default)(ImgEdit, [{
    key: 'listen',
    value: function listen(el) {
      data[this].inputListener = inputListener.bind(this);
      this.input = (typeof el === 'undefined' ? 'undefined' : (0, _typeof3.default)(el)) === 'object' && 'addEventListener' in el ? el : document.querySelector(el);
      this.input.addEventListener('change', data[this].inputListener);
    }
    // 删除输入源监听

  }, {
    key: 'unlisten',
    value: function unlisten() {
      this.input.removeEventListener('change', data[this].inputListener);
    }
    // 图片资源/图片地址

  }, {
    key: 'img',
    value: function () {
      var _ref2 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee2(file) {
        var img, context;
        return _regenerator2.default.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                _context2.next = 2;
                return loadImg(file);

              case 2:
                img = _context2.sent;
                context = this.canvas.getContext('2d');

                context.drawImage(img, 0, 0);

              case 5:
              case 'end':
                return _context2.stop();
            }
          }
        }, _callee2, this);
      }));

      function img(_x2) {
        return _ref2.apply(this, arguments);
      }

      return img;
    }()
  }, {
    key: 'destroy',
    value: function destroy() {
      data[this] = null;
    }
  }]);
  return ImgEdit;
}();

// 输入源


var input = exports.input = function input() {
  console.log('Hello world');
};
// 输出
var output = exports.output = function output() {
  console.log('output');
};

exports.default = ImgEdit;