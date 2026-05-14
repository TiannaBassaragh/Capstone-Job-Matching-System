import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { AuthProvider } from './context/AuthContext'
import { NotificationProvider } from './context/NotificationContext'
import { QuestionsProvider } from './context/QuestionsContext'
import { MatchingProvider } from './context/MatchingContext'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
    <StrictMode>
        <AuthProvider>
            <NotificationProvider>
                <QuestionsProvider>
                    <MatchingProvider>
                        <App />
                    </MatchingProvider>
                </QuestionsProvider>
            </NotificationProvider>
        </AuthProvider>
    </StrictMode>,
)
