/**
 * The design system's component bundle uses the React on `window` (loaded from /assets/vendor/react.js). Pages must use that same
 * instance: a second copy bundled into a page has no hooks dispatcher. The build maps `import ... from 'react'` to this file.
 */
const R = (window as unknown as { React: typeof import('react') }).React;
export default R;
export const { useState, useEffect, useLayoutEffect, useMemo, useRef, useCallback, useReducer, useContext, createElement, Fragment } = R;
