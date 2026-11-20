import '@testing-library/jest-dom';

// Radix (Checkbox/Select) observa tamaños; jsdom no implementa ResizeObserver.
class ResizeObserverStub {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}

if (!globalThis.ResizeObserver) {
  globalThis.ResizeObserver = ResizeObserverStub as unknown as typeof ResizeObserver;
}

// Radix Select usa Pointer Events que jsdom no implementa.
Element.prototype.hasPointerCapture = function hasPointerCapture() {
  return false;
};
Element.prototype.setPointerCapture = function setPointerCapture() {};
Element.prototype.releasePointerCapture = function releasePointerCapture() {};
Element.prototype.scrollIntoView = function scrollIntoView() {};
