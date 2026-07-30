import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { BrowserRouter } from 'react-router-dom'
import { store } from './app/store.js'
import { Provider } from 'react-redux'
import { AuthProvider } from '@/context/AuthContext'
import { SocketProvider } from '@/context/SocketContext'
import { toast } from 'react-hot-toast';

const originalToastError = toast.error;
toast.error = (message, options) => {
    if (window.__lastActionCancelled) {
        window.__lastActionCancelled = false;
        return null;
    }
    return originalToastError(message, options);
};

createRoot(document.getElementById('root')).render(
    <BrowserRouter>
        <AuthProvider>
            <SocketProvider>
                <Provider store={store}>
                    <App />
                </Provider>
            </SocketProvider>
        </AuthProvider>
    </BrowserRouter>,
)

// Register Service Worker for offline capabilities
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js')
            .then((reg) => console.log('[ServiceWorker] Registered successfully on scope:', reg.scope))
            .catch((err) => console.error('[ServiceWorker] Registration failed:', err));
    });
}