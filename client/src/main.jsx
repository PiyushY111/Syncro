import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { BrowserRouter } from 'react-router-dom'
import { store } from './app/store.js'
import { Provider } from 'react-redux'
import { AuthProvider } from '@/context/AuthContext'
import { SocketProvider } from '@/context/SocketContext'

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