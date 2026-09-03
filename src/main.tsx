import { createRoot } from 'react-dom/client';
import '@fontsource-variable/atkinson-hyperlegible-next';
import '@fontsource-variable/newsreader';
import { App } from './app/App';
import './styles/global.css';

createRoot(document.getElementById('root')!).render(<App />);
