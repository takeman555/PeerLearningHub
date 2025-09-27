/**
 * Ultimate Hermes Engine Compatibility Polyfills
 * This file provides the most aggressive polyfills to completely override
 * Hermes engine's problematic Event implementation.
 */

// Immediate execution to override before any other code runs
(function() {
  'use strict';
  
  if (typeof global === 'undefined' || global.window) {
    return; // Skip if not in React Native environment
  }
  
  if (__DEV__) {
    console.log('🔧 Loading ultimate Hermes-safe polyfills...');
  }
  
  // Completely override the global Event constructor before anything else can use it
  const originalEvent = global.Event;
  const originalEventTarget = global.EventTarget;
  
  // Create a safe Event implementation that never uses read-only properties
  function SafeEvent(type, eventInitDict) {
    eventInitDict = eventInitDict || {};
    
    // Manually set all properties to avoid any descriptor issues
    this.type = String(type);
    this.bubbles = Boolean(eventInitDict.bubbles);
    this.cancelable = Boolean(eventInitDict.cancelable);
    this.composed = Boolean(eventInitDict.composed);
    this.currentTarget = null;
    this.defaultPrevented = false;
    this.eventPhase = 0;
    this.isTrusted = false;
    this.target = null;
    this.timeStamp = Date.now();
    
    // Add detail for CustomEvent compatibility
    if (eventInitDict.detail !== undefined) {
      this.detail = eventInitDict.detail;
    }
  }
  
  // Add prototype methods
  SafeEvent.prototype.preventDefault = function() {
    if (this.cancelable) {
      this.defaultPrevented = true;
    }
  };
  
  SafeEvent.prototype.stopPropagation = function() {
    // No-op for compatibility
  };
  
  SafeEvent.prototype.stopImmediatePropagation = function() {
    // No-op for compatibility
  };
  
  // Add constants as simple properties (never read-only)
  SafeEvent.NONE = 0;
  SafeEvent.CAPTURING_PHASE = 1;
  SafeEvent.AT_TARGET = 2;
  SafeEvent.BUBBLING_PHASE = 3;
  
  // Safe EventTarget implementation
  function SafeEventTarget() {
    this._eventListeners = Object.create(null);
  }
  
  SafeEventTarget.prototype.addEventListener = function(type, listener, options) {
    if (typeof listener !== 'function') return;
    
    type = String(type);
    if (!this._eventListeners[type]) {
      this._eventListeners[type] = [];
    }
    
    // Avoid duplicates
    if (this._eventListeners[type].indexOf(listener) === -1) {
      this._eventListeners[type].push(listener);
    }
  };
  
  SafeEventTarget.prototype.removeEventListener = function(type, listener, options) {
    type = String(type);
    if (!this._eventListeners[type]) return;
    
    const index = this._eventListeners[type].indexOf(listener);
    if (index > -1) {
      this._eventListeners[type].splice(index, 1);
    }
  };
  
  SafeEventTarget.prototype.dispatchEvent = function(event) {
    if (!event || !event.type) return true;
    
    const type = String(event.type);
    if (!this._eventListeners[type]) return true;
    
    // Set event target
    if (!event.target) {
      event.target = this;
    }
    event.currentTarget = this;
    
    // Call all listeners
    const listeners = this._eventListeners[type].slice(); // Copy to avoid modification during iteration
    
    for (let i = 0; i < listeners.length; i++) {
      try {
        listeners[i].call(this, event);
      } catch (error) {
        console.warn('Event listener error (caught):', error.message);
      }
    }
    
    return !event.defaultPrevented;
  };
  
  // Immediately replace global constructors
  global.Event = SafeEvent;
  global.EventTarget = SafeEventTarget;
  
  // CustomEvent implementation
  global.CustomEvent = function SafeCustomEvent(type, eventInitDict) {
    return new SafeEvent(type, eventInitDict);
  };
  
  // Aggressive XMLHttpRequest patching
  if (global.XMLHttpRequest) {
    const OriginalXHR = global.XMLHttpRequest;
    
    function PatchedXMLHttpRequest() {
      const xhr = new OriginalXHR();
      
      // Override all event-related methods to use our safe implementation
      const originalAddEventListener = xhr.addEventListener;
      const originalRemoveEventListener = xhr.removeEventListener;
      
      if (originalAddEventListener) {
        xhr.addEventListener = function(type, listener, options) {
          try {
            // Use our safe event target methods
            return SafeEventTarget.prototype.addEventListener.call(this, type, listener, options);
          } catch (error) {
            console.warn('XHR addEventListener error (using fallback):', error.message);
            // Fallback to manual listener tracking
            if (!this._safeListeners) this._safeListeners = {};
            if (!this._safeListeners[type]) this._safeListeners[type] = [];
            this._safeListeners[type].push(listener);
          }
        };
      }
      
      if (originalRemoveEventListener) {
        xhr.removeEventListener = function(type, listener, options) {
          try {
            return SafeEventTarget.prototype.removeEventListener.call(this, type, listener, options);
          } catch (error) {
            console.warn('XHR removeEventListener error (using fallback):', error.message);
            if (this._safeListeners && this._safeListeners[type]) {
              const index = this._safeListeners[type].indexOf(listener);
              if (index > -1) {
                this._safeListeners[type].splice(index, 1);
              }
            }
          }
        };
      }
      
      return xhr;
    }
    
    // Copy all static properties and methods
    Object.setPrototypeOf(PatchedXMLHttpRequest, OriginalXHR);
    Object.assign(PatchedXMLHttpRequest, OriginalXHR);
    
    global.XMLHttpRequest = PatchedXMLHttpRequest;
  }
  
  // Ultra-safe fetch wrapper
  if (global.fetch) {
    const originalFetch = global.fetch;
    
    global.fetch = function ultraSafeFetch(...args) {
      return new Promise((resolve, reject) => {
        try {
          const result = originalFetch.apply(this, args);
          
          if (result && typeof result.then === 'function') {
            result
              .then(response => {
                resolve(response);
              })
              .catch(error => {
                // Create a safe error object
                const safeError = new Error(error.message || 'Fetch error');
                safeError.name = error.name || 'FetchError';
                reject(safeError);
              });
          } else {
            resolve(result);
          }
        } catch (syncError) {
          const safeError = new Error(syncError.message || 'Fetch sync error');
          safeError.name = syncError.name || 'FetchSyncError';
          reject(safeError);
        }
      });
    };
    
    // Copy fetch properties
    Object.assign(global.fetch, originalFetch);
  }
  
  // Override any attempts to redefine Event constants
  const eventConstantHandler = {
    set: function(target, property, value) {
      if (['NONE', 'CAPTURING_PHASE', 'AT_TARGET', 'BUBBLING_PHASE'].includes(property)) {
        console.warn(`Attempt to modify Event.${property} blocked`);
        return true; // Pretend it succeeded but don't actually change anything
      }
      target[property] = value;
      return true;
    }
  };
  
  // Wrap Event in a Proxy to intercept constant modifications
  global.Event = new Proxy(SafeEvent, eventConstantHandler);
  
  if (__DEV__) {
    console.log('✅ Ultimate Hermes-safe polyfills loaded successfully');
    console.log('📋 Safe Event constants:', {
      NONE: global.Event.NONE,
      CAPTURING_PHASE: global.Event.CAPTURING_PHASE,
      AT_TARGET: global.Event.AT_TARGET,
      BUBBLING_PHASE: global.Event.BUBBLING_PHASE
    });
  }
  
})();