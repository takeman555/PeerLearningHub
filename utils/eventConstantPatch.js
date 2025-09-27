const globalObject = typeof globalThis !== 'undefined' ? globalThis : global;

const EVENT_CONSTANTS = {
  NONE: 0,
  CAPTURING_PHASE: 1,
  AT_TARGET: 2,
  BUBBLING_PHASE: 3,
};

const constantNames = Object.keys(EVENT_CONSTANTS);

const shouldPatchEventConstructor = () => {
  const EventCtor = globalObject?.Event;
  if (!EventCtor) {
    return false;
  }

  const descriptor = Object.getOwnPropertyDescriptor(EventCtor, 'NONE');
  if (!descriptor) {
    return true;
  }

  return descriptor.configurable === false || descriptor.writable === false;
};

const copyStaticDescriptors = (source, target) => {
  Object.getOwnPropertyNames(source).forEach((property) => {
    if (property === 'prototype' || constantNames.includes(property)) {
      return;
    }

    const descriptor = Object.getOwnPropertyDescriptor(source, property);
    if (!descriptor) {
      return;
    }

    try {
      Object.defineProperty(target, property, descriptor);
    } catch (error) {
      // Non-critical; move on to the next property
    }
  });
};

const defineEventConstant = (target, property, value) => {
  try {
    Object.defineProperty(target, property, {
      value,
      enumerable: true,
      configurable: true,
      writable: true,
    });
  } catch (error) {
    // Ignore; if this fails we'll still avoid crashing later because the setter will remain writable
  }
};

const patchEventConstructor = () => {
  if (!shouldPatchEventConstructor()) {
    return;
  }

  const OriginalEvent = globalObject.Event;
  if (!OriginalEvent) {
    return;
  }

  class MutableEvent extends OriginalEvent {
    constructor(...args) {
      super(...args);
      // Ensure instance constants are writable
      constantNames.forEach((name) => {
        const value = EVENT_CONSTANTS[name];
        try {
          Object.defineProperty(this, name, {
            value,
            enumerable: true,
            configurable: true,
            writable: true,
          });
        } catch (error) {
          // Ignore errors
        }
      });
    }
  }

  // Ensure static inheritance (Event.someStatic)
  Object.setPrototypeOf?.(MutableEvent, OriginalEvent);

  // Define writable constants on both the constructor and its prototype
  constantNames.forEach((name) => {
    const value = EVENT_CONSTANTS[name];
    defineEventConstant(MutableEvent, name, value);
    defineEventConstant(MutableEvent.prototype, name, value);
  });

  // Preserve other static properties (e.g., Event.length)
  copyStaticDescriptors(OriginalEvent, MutableEvent);

  // Replace the global Event reference
  globalObject.Event = MutableEvent;
  
  // Also patch XMLHttpRequest events if they exist
  if (globalObject.XMLHttpRequest) {
    const originalXHR = globalObject.XMLHttpRequest;
    globalObject.XMLHttpRequest = class extends originalXHR {
      constructor(...args) {
        super(...args);
        // Ensure readyState constants are writable
        try {
          Object.defineProperty(this, 'UNSENT', { value: 0, writable: true, configurable: true });
          Object.defineProperty(this, 'OPENED', { value: 1, writable: true, configurable: true });
          Object.defineProperty(this, 'HEADERS_RECEIVED', { value: 2, writable: true, configurable: true });
          Object.defineProperty(this, 'LOADING', { value: 3, writable: true, configurable: true });
          Object.defineProperty(this, 'DONE', { value: 4, writable: true, configurable: true });
        } catch (error) {
          // Ignore errors
        }
      }
    };
  }
};

patchEventConstructor();

module.exports = {};
