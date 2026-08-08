import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './dashboard/App';

const el = document.getElementById('app');

if (el) {
    createRoot(el).render(<React.StrictMode><App /></React.StrictMode>);
}
