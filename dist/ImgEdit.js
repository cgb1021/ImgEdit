(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
  typeof define === 'function' && define.amd ? define(['exports'], factory) :
  (global = global || self, factory(global.ImgEdit = {}));
}(this, function (exports) { 'use strict';

  const sample = () => {
    console.log('Hello world');
  };

  exports.default = sample;
  exports.sample = sample;

  Object.defineProperty(exports, '__esModule', { value: true });

}));
