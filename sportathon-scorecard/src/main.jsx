import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { store, persistor } from './store/store';
import App from './App.jsx';
import Loader from './components/Loader.jsx'; // Import your new loader
import { sportathonTheme } from './theme/sportathonTheme';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={store}>
      <ThemeProvider theme={sportathonTheme}>
        <CssBaseline />
        <PersistGate loading={<Loader />} persistor={persistor}>
          <BrowserRouter
            basename={import.meta.env.BASE_URL.replace(/\/$/, '') || undefined}
          >
            <App />
          </BrowserRouter>
        </PersistGate>
      </ThemeProvider>
    </Provider>
  </React.StrictMode>
);