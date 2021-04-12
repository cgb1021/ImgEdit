"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.rotate = exports.cut = exports.resize = exports.preview = exports.readFile = exports.loadImg = exports.fetchImg = void 0;

var _Sprite = _interopRequireDefault(require("./Sprite"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

/*
 * @description 获取HTMLElement
 * @param {string|HTMLElement} el
 * @return HTMLElement
 */

/* 
 * 加载线上图片
 *
 * @param {string} url
 * @return {object} promise
 */
var fetchImg = function fetchImg(url) {
  return new Promise(function (resolve, reject) {
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
            name = "".concat(name, ".jpg");
            break;

          default:
            name = "".concat(name, ".").concat(ext);
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

    xhr.open('GET', url); // xhr.overrideMimeType('text/plain; charset=x-user-defined')

    xhr.send(null);
  });
};
/* 
 * 加载图片
 *
 * @param {string} src url/base64
 * @return {object} promise
 */


exports.fetchImg = fetchImg;

var loadImg = function loadImg(src) {
  return new Promise(function (resolve, reject) {
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
};
/* 
 * 图片转base64
 *
 * @param {blob} file
 * @return {object} promise
 */


exports.loadImg = loadImg;

var readFile = function readFile(file) {
  return new Promise(function (resolve, reject) {
    if (!file || _typeof(file) !== 'object') reject(0);
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
};
/* 
 * 上传图片预览
 *
 * @param {blob} file
 * @return {object} promise
 */


exports.readFile = readFile;

var preview = function preview(file) {
  return new Promise(function (resolve, reject) {
    if (!file || _typeof(file) !== 'object') reject(0);
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

exports.preview = preview;

var resize = /*#__PURE__*/function () {
  var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(img, width, height) {
    var mime, edit, b64;
    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            if (!(!width && !height)) {
              _context.next = 2;
              break;
            }

            return _context.abrupt("return", false);

          case 2:
            if (!(typeof img === 'string' && /^(?:https?:)?\/\//.test(img))) {
              _context.next = 6;
              break;
            }

            _context.next = 5;
            return fetchImg(img);

          case 5:
            img = _context.sent;

          case 6:
            mime = img.type;
            edit = new _Sprite["default"](img);
            b64 = edit.resize(width, height).toDataURL(mime);
            return _context.abrupt("return", b64);

          case 10:
          case "end":
            return _context.stop();
        }
      }
    }, _callee);
  }));

  return function resize(_x, _x2, _x3) {
    return _ref.apply(this, arguments);
  };
}();

exports.resize = resize;

var cut = /*#__PURE__*/function () {
  var _ref2 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2(img, width, height, x, y) {
    var mime, edit, b64;
    return regeneratorRuntime.wrap(function _callee2$(_context2) {
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
            edit = new _Sprite["default"](img);
            b64 = edit.cut(width, height, x, y).toDataURL(mime);
            return _context2.abrupt("return", b64);

          case 10:
          case "end":
            return _context2.stop();
        }
      }
    }, _callee2);
  }));

  return function cut(_x4, _x5, _x6, _x7, _x8) {
    return _ref2.apply(this, arguments);
  };
}();

exports.cut = cut;

var rotate = /*#__PURE__*/function () {
  var _ref3 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee3(img, deg) {
    var mime, edit, b64;
    return regeneratorRuntime.wrap(function _callee3$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:
            if (deg) {
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
            edit = new _Sprite["default"](img);
            b64 = edit.rotate(deg).toDataURL(mime);
            return _context3.abrupt("return", b64);

          case 10:
          case "end":
            return _context3.stop();
        }
      }
    }, _callee3);
  }));

  return function rotate(_x9, _x10) {
    return _ref3.apply(this, arguments);
  };
}();

exports.rotate = rotate;