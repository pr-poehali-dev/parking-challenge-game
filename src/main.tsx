import * as React from 'react';
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'

const rootEl = document.getElementById("root") ?? document.body;
createRoot(rootEl).render(<App />);