/**
 * Supabase Compatibility Patch for React Native/Expo
 * Fixes "Cannot assign to read-only property" errors in Supabase v2.57.4+
 * This patch ensures Event and XMLHttpRequest constants are writable
 */

(function() {
  'use strict';
  
  const globalObject = typeof globalThis !== 'undefined' ? globalThis : global;
  
  // Prevent multiple patches
  if (globalObject._supabasePatched) {
    return;
  }
  
  console.log('🔧 Applying Supabase compatibility patch...');
  
  // Store original constructors
  const OriginalEvent = globalObject.Event;
  const OriginalXMLHttpRequest = globalObject.XMLHttpRequest;
  
  // Event constants that need to be writable
  const EVENT_CONSTANTS = {
    NONE: 0,
    CAPTURING_PHASE: 1,
    AT_TARGET: 2,
    BUBBLING_PHASE: 3,
  };
  
  // XMLHttpRequest constants that need to be writable
  const XHR_CONSTANTS = {
    UNSENT: 0,
    OPENED: 1,
    HEADERS_RECEIVED: 2,
    LOADING: 3,
    DONE: 4,
  };
  
  // Helper function to safely define writable properties
  function defineWritableProperty(obj, prop, value) {
    try {
      Object.defineProperty(obj, prop, {
        value: value,
        writable: true,
        configurable: true,
        enumerable: true,
      });
      return true;
    } catch (error) {
      // If we can't define the property, try to set it directly
      try {
        obj[prop] = value;
        return true;
      } catch (innerError) {
        return false;
      }
    }
  }
  
  // Patch Event constructor if it exists
  if (OriginalEvent) {
    try {
      // Create a wrapper that ensures constants are writable
      function PatchedEvent(type, eventInitDict) {
        let event;
        
        // Create the event using the original constructor
        if (eventInitDict) {
          event = new OriginalEvent(type, eventInitDict);
        } else {
          event = new OriginalEvent(type);
        }
        
        // Make constants writable on the instance
        Object.keys(EVENT_CONSTANTS).forEach(key => {
          defineWritableProperty(event, key, EVENT_CONSTANTS[key]);
        });
        
        return event;
      }
      
      // Copy static properties from original Event
      Object.setPrototypeOf(PatchedEvent, OriginalEvent);
      PatchedEvent.prototype = OriginalEvent.prototype;
      
      // Add writable constants to the constructor
      Object.keys(EVENT_CONSTANTS).forEach(key => {
        defineWritableProperty(PatchedEvent, key, EVENT_CONSTANTS[key]);
      });
      
      // Replace global Event
      globalObject.Event = PatchedEvent;
      
    } catch (error) {
      console.warn('⚠️ Could not patch Event constructor:', error.message);
    }
  }
  
  // Patch XMLHttpRequest constructor if it exists
  if (OriginalXMLHttpRequest) {
    try {
      function PatchedXMLHttpRequest() {
        const xhr = new OriginalXMLHttpRequest();
        
        // Make constants writable on the instance
        Object.keys(XHR_CONSTANTS).forEach(key => {
          defineWritableProperty(xhr, key, XHR_CONSTANTS[key]);
        });
        
        return xhr;
      }
      
      // Copy static properties from original XMLHttpRequest
      Object.setPrototypeOf(PatchedXMLHttpRequest, OriginalXMLHttpRequest);
      PatchedXMLHttpRequest.prototype = OriginalXMLHttpRequest.prototype;
      
      // Add writable constants to the constructor
      Object.keys(XHR_CONSTANTS).forEach(key => {
        defineWritableProperty(PatchedXMLHttpRequest, key, XHR_CONSTANTS[key]);
      });
      
      // Replace global XMLHttpRequest
      globalObject.XMLHttpRequest = PatchedXMLHttpRequest;
      
    } catch (error) {
      console.warn('⚠️ Could not patch XMLHttpRequest constructor:', error.message);
    }
  }
  
  // Additional patch for Error constructors that might be affected
  const errorTypes = ['Error', 'TypeError', 'ReferenceError'];
  errorTypes.forEach(errorType => {
    const OriginalError = globalObject[errorType];
    if (OriginalError) {
      try {
        function PatchedError(...args) {
          const error = new OriginalError(...args);
          
          // Ensure error properties are writable
          ['name', 'message', 'stack'].forEach(prop => {
            if (error.hasOwnProperty(prop)) {
              const value = error[prop];
              try {
                Object.defineProperty(error, prop, {
                  value: value,
                  writable: true,
                  configurable: true,
                  enumerable: prop !== 'stack', // stack is usually non-enumerable
                });
              } catch (e) {
                // Ignore if we can't make it writable
              }
            }
          });
          
          return error;
        }
        
        Object.setPrototypeOf(PatchedError, OriginalError);
        PatchedError.prototype = OriginalError.prototype;
        
        // Don't replace global error constructors as it might break other things
        // globalObject[errorType] = PatchedError;
        
      } catch (error) {
        // Ignore errors when patching error constructors
      }
    }
  });
  
  // Mark as patched
  globalObject._supabasePatched = true;
  
  console.log('✅ Supabase compatibility patch applied successfully');
  
})();

module.exports = {};