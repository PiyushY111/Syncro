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

// Register Service Worker for offline capabilities in production only;
// In development, unregister any existing service worker so it doesn't intercept Vite HMR module requests
if ('serviceWorker' in navigator) {
    if (import.meta.env.PROD) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/service-worker.js')
                .then((reg) => console.log('[ServiceWorker] Registered successfully on scope:', reg.scope))
                .catch((err) => console.error('[ServiceWorker] Registration failed:', err));
        });
    } else {
        navigator.serviceWorker.getRegistrations().then((registrations) => {
            for (const registration of registrations) {
                registration.unregister();
            }
        });
    }
}