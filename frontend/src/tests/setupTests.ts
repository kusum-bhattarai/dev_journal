import '@testing-library/jest-dom';

const MockIntersectionObserver = jest.fn();
MockIntersectionObserver.prototype.observe = jest.fn();
MockIntersectionObserver.prototype.unobserve = jest.fn();
MockIntersectionObserver.prototype.disconnect = jest.fn();

Object.defineProperty(global, 'IntersectionObserver', {
  writable: true,
  configurable: true,
  value: MockIntersectionObserver,
});

global.IntersectionObserver = MockIntersectionObserver as any;
global.TextEncoder = require('util').TextEncoder;
global.TextDecoder = require('util').TextDecoder;