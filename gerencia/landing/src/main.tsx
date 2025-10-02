import React from 'react';
import ReactDOM from 'react-dom/client';
import { LandingPage } from './landing-page';
import './styles.css';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <LandingPage />
  </React.StrictMode>
);
