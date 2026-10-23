import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { store, persistor } from './redux/store.js';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import ThemeProvider from './components/ThemeProvider.jsx';

// Add the protection code for production only
if (import.meta.env.VITE_PROD === 'true') {
  // Disable right-click
  document.addEventListener('contextmenu', (e) => e.preventDefault());

  // Disable DevTools shortcuts and add more protection
  document.addEventListener('keydown', (e) => {
    if (
      e.key === 'F12' ||
      (e.ctrlKey && e.shiftKey && e.key === 'I') ||
      (e.metaKey && e.altKey && e.key === 'I') ||
      (e.ctrlKey && e.shiftKey && e.key === 'C') ||
      (e.metaKey && e.altKey && e.key === 'C') ||
      (e.ctrlKey && e.shiftKey && e.key === 'J') ||
      (e.metaKey && e.altKey && e.key === 'J') ||
      (e.ctrlKey && 'us'.includes(e.key.toLowerCase()))
    ) {
      e.preventDefault();
    }
  });

  const disableConsole = () => {
    try {
      Object.defineProperty(window, 'console', {
        value: {},
        writable: false,
        configurable: false,
      });
    } catch (e) {}
  };

  setInterval(() => {
    const startTime = performance.now();
    debugger;
    const endTime = performance.now();
    if (endTime - startTime > 100) {
      disableConsole();
    }
  }, 1000);

  console.clear();
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <PersistGate persistor={persistor}>
    <Provider store={store}>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </Provider>
  </PersistGate>
);