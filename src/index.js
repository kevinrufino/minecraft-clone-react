import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Fade out and remove the inline boot splash (see public/index.html) once the
// app has rendered. Two rAFs ensure the title screen has painted underneath
// before the splash starts fading, so there's never a blank frame between.
function dismissBootSplash() {
  const splash = document.getElementById('boot-splash');
  if (!splash) {
    return;
  }
  splash.classList.add('boot-splash--hide');
  splash.addEventListener('transitionend', () => splash.remove(), { once: true });
  // fallback in case the transition event never fires
  setTimeout(() => splash.remove(), 800);
}
requestAnimationFrame(() => requestAnimationFrame(dismissBootSplash));
