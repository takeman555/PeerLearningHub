/**
 * Global Event Constants Patch for React Native/Expo
 * Fixes "Cannot assign to read-only property 'NONE'" errors
 * Updated for @supabase/supabase-js v2.58.0+
 */

// Apply patch immediately when module is loaded
(function() {
  const globalObject = typeof globalThis !== 'undefined' ? globalThis : global;
  
  // Early exit if already patched
  if (globalObject._eventPatched) {
    return;
  }
  
  // Store original constructors
  const OriginalEvent = globalObject.Event;
  const OriginalXMLHttpRequest = globalObject.XMLHttpRequest;
  
  if (!OriginalEvent) {
    return;
  }

  // Event constants
  const EVENT_CONSTANTS = {
    NONE: 0,
    CAPTURING_PHASE: 1,
    AT_TARGET: 2,
    BUBBLING_PHASE: 3,
  };

  // XMLHttpRequest constants
  const XHR_CONSTANTS = {
    UNSENT: 0,
    OPENED: 1,
    HEADERS_RECEIVED: 2,
    LOADING: 3,
    DONE: 4,
  };

  // Patch Event constructor
  function PatchedEvent(...args) {
    const event = new OriginalEvent(...args);

    // Override constants on instances with writable versions
    Object.keys(EVENT_CONSTANTS).forEach(key => {
      try {
        Object.defineProperty(event, key, {
          value: EVENT_CONSTANTS[key],
          writable: true,
          configurable: true,
          enumerable: true,
        });
      } catch (e) {
        // Ignore errors; some runtimes still disallow overriding
      }
    });

    return event;
  }

  // Ensure PatchedEvent inherits static behaviour but skip read-only constants
  Object.setPrototypeOf(PatchedEvent, OriginalEvent);
  Object.getOwnPropertyNames(OriginalEvent).forEach(prop => {
    if (
      prop === 'prototype' ||
      prop === 'name' ||
      prop === 'length' ||
      Object.prototype.hasOwnProperty.call(EVENT_CONSTANTS, prop)
    ) {
      return;
    }

    try {
      const descriptor = Object.getOwnPropertyDescriptor(OriginalEvent, prop);
      if (descriptor) {
        Object.defineProperty(PatchedEvent, prop, descriptor);
      }
    } catch (e) {
      // Ignore non-critical descriptor copy errors
    }
  });

  // Create a new prototype that inherits from the original to avoid locked descriptors
  const patchedEventPrototype = Object.create(OriginalEvent.prototype);
  Object.defineProperty(patchedEventPrototype, 'constructor', {
    value: PatchedEvent,
    writable: true,
    configurable: true,
  });
  PatchedEvent.prototype = patchedEventPrototype;

  // Add writable constants to constructor and prototype
  Object.keys(EVENT_CONSTANTS).forEach(key => {
    const descriptor = {
      value: EVENT_CONSTANTS[key],
      writable: true,
      configurable: true,
      enumerable: true,
    };

    try {
      Object.defineProperty(PatchedEvent, key, descriptor);
    } catch (e) {
      // Ignore if the runtime prevents redefining statics
    }

    try {
      Object.defineProperty(patchedEventPrototype, key, descriptor);
    } catch (e) {
      // Ignore if the runtime prevents redefining prototype values
    }
  });

  // Replace global Event
  globalObject.Event = PatchedEvent;

  // Patch XMLHttpRequest if available
  if (OriginalXMLHttpRequest) {
    function PatchedXMLHttpRequest(...args) {
      const xhr = new OriginalXMLHttpRequest(...args);

      Object.keys(XHR_CONSTANTS).forEach(key => {
        try {
          Object.defineProperty(xhr, key, {
            value: XHR_CONSTANTS[key],
            writable: true,
            configurable: true,
            enumerable: true,
          });
        } catch (e) {
          // Ignore errors
        }
      });

      return xhr;
    }

    Object.setPrototypeOf(PatchedXMLHttpRequest, OriginalXMLHttpRequest);

    const patchedXHRPrototype = Object.create(OriginalXMLHttpRequest.prototype);
    Object.defineProperty(patchedXHRPrototype, 'constructor', {
      value: PatchedXMLHttpRequest,
      writable: true,
      configurable: true,
    });
    PatchedXMLHttpRequest.prototype = patchedXHRPrototype;

    Object.keys(XHR_CONSTANTS).forEach(key => {
      const descriptor = {
        value: XHR_CONSTANTS[key],
        writable: true,
        configurable: true,
        enumerable: true,
      };

      try {
        Object.defineProperty(PatchedXMLHttpRequest, key, descriptor);
      } catch (e) {
        // Ignore errors
      }

      try {
        Object.defineProperty(patchedXHRPrototype, key, descriptor);
      } catch (e) {
        // Ignore errors
      }
    });

    // Replace global XMLHttpRequest
    globalObject.XMLHttpRequest = PatchedXMLHttpRequest;
  }

  // Mark as patched to prevent double-patching
  globalObject._eventPatched = true;
  
  console.log('🔧 Global Event/XMLHttpRequest patch applied (v2.58.0 compatible)');
})();

module.exports = {};
