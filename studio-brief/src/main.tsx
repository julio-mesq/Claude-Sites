import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/inter';
import '@fontsource-variable/manrope';
import '@fontsource-variable/dm-sans';
import '@fontsource-variable/playfair-display';
import '@fontsource-variable/fraunces';
import '@fontsource-variable/lora';
import '@fontsource-variable/space-grotesk';
import '@fontsource-variable/source-serif-4';
import './styles/global.css';
import { App } from './App';

createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>);
