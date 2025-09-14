import '@testing-library/jest-dom';
import React from 'react';

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

// Mock react-router-dom
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: jest.fn(),
  useSearchParams: jest.fn(),
}));

// Mock react-markdown and remark-gfm
jest.mock('react-markdown', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="markdown-preview">{children}</div>
  ),
}));
jest.mock('remark-gfm', () => ({}));