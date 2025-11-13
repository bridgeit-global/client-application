// This file runs BEFORE jsdom initializes
// We need to mock canvas at the Node.js module level before jsdom tries to load it

// Mock canvas module before jsdom can load it
const Module = require('module');
const originalRequire = Module.prototype.require;

// Pre-cache the canvas mock in the module cache
// This ensures it's available before any require() calls
const mockCanvasPath = require.resolve('./__mocks__/canvas.js');
if (!Module._cache[mockCanvasPath]) {
  Module._cache[mockCanvasPath] = {
    exports: require('./__mocks__/canvas.js'),
    loaded: true,
  };
}

const mockCanvas = {
  createCanvas: () => ({
    getContext: () => ({
      fillRect: () => {},
      clearRect: () => {},
      getImageData: () => ({ data: new Array(4) }),
      putImageData: () => {},
      createImageData: () => [],
      setTransform: () => {},
      drawImage: () => {},
      save: () => {},
      fillText: () => {},
      restore: () => {},
      beginPath: () => {},
      moveTo: () => {},
      lineTo: () => {},
      closePath: () => {},
      stroke: () => {},
      translate: () => {},
      scale: () => {},
      rotate: () => {},
      arc: () => {},
      fill: () => {},
      measureText: () => ({ width: 0 }),
      transform: () => {},
      rect: () => {},
      clip: () => {},
    }),
    toDataURL: () => '',
    width: 0,
    height: 0,
  }),
  loadImage: () => Promise.resolve({}),
  Image: function() {},
};

// Cache to store resolved paths
const path = require('path');
const fs = require('fs');

// Intercept require calls to handle canvas module
Module.prototype.require = function(...args) {
  const moduleId = args[0];
  
  // Handle canvas module requests (exact match)
  if (moduleId === 'canvas') {
    return mockCanvas;
  }
  
  // Handle canvas native module requests (relative paths from within canvas package)
  if (moduleId && typeof moduleId === 'string') {
    // Check for canvas.node or build/Release paths
    if (
      moduleId.includes('canvas.node') ||
      (moduleId.includes('canvas') && moduleId.includes('build/Release')) ||
      (moduleId.includes('canvas') && moduleId.includes('bindings'))
    ) {
      return mockCanvas;
    }
    
    // Try to resolve the path and check if it's canvas-related
    try {
      const resolvedPath = Module._resolveFilename(moduleId, this);
      if (resolvedPath && (
        resolvedPath.includes('canvas') && (
          resolvedPath.includes('bindings') ||
          resolvedPath.includes('canvas.node') ||
          resolvedPath.includes('build/Release')
        )
      )) {
        // Cache the mock for this path
        Module._cache[resolvedPath] = {
          exports: mockCanvas,
          loaded: true,
        };
        return mockCanvas;
      }
    } catch (resolveError) {
      // If resolution fails and it's canvas-related, return mock
      // This handles cases where the path doesn't exist yet
      if (moduleId.includes('canvas') || 
          (resolveError.message && resolveError.message.includes('canvas'))) {
        return mockCanvas;
      }
    }
  }
  
  // Try the original require
  try {
    return originalRequire.apply(this, args);
  } catch (error) {
    // Catch canvas-related module not found errors
    const errorMessage = error && error.message ? error.message : '';
    const errorCode = error && error.code ? error.code : '';
    
    // Check if this is a canvas-related error
    const isCanvasError = (
      errorMessage.includes('canvas.node') ||
      errorMessage.includes('build/Release/canvas') ||
      (errorMessage.includes('canvas') && (
        errorMessage.includes('Cannot find module') ||
        errorMessage.includes('MODULE_NOT_FOUND')
      )) ||
      (errorCode === 'MODULE_NOT_FOUND' && (
        errorMessage.includes('canvas') || 
        (moduleId && moduleId.includes('canvas'))
      ))
    );
    
    if (isCanvasError) {
      // Try to cache the mock for the failed path
      try {
        const failedPath = Module._resolveFilename(moduleId, this);
        if (failedPath) {
          Module._cache[failedPath] = {
            exports: mockCanvas,
            loaded: true,
          };
        }
      } catch (e) {
        // Ignore cache errors
      }
      return mockCanvas;
    }
    
    throw error;
  }
};

