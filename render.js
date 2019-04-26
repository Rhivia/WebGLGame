(function (global, factory) { 
    typeof exports === 'object' && 
    typeof module !== 'undefined' ? factory(exports) : typeof define === 'function' && 
    define.amd ? define(['exports'], factory) : (global = global || self, factory(global.render = {}));
}(this, function (exports) { 
    'use strict';
    /**
     * Common utilities
     * @module render
    **/

    function getCanvas() {
        return document.querySelector("canvas");
    }
    
    var common = Object.freeze({
        getCanvas: getCanvas,
    });

    exports.render = common;

    Object.defineProperty(exports, '__esModule', { value: true });
}));
  