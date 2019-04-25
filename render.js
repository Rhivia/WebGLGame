(function (global, factory) { 
    typeof exports === 'object' && 
    typeof module !== 'undefined' ? factory(exports) : typeof define === 'function' && 
    define.amd ? define(['exports'], factory) : (global = global || self, factory(global.render = {}));
}(this, function (exports) { 
    'use strict';

    function getCanvas() {
        return document.querySelector("canvas");
    }
    
    exports.render = Object.freeze({
        getCanvas: getCanvas,
    });;

    Object.defineProperty(exports, '__esModule', { value: true });
}));
  