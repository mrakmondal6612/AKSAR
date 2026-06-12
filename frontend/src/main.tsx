import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import {NextUIProvider} from '@nextui-org/react'
import App from './App.tsx'
import './index.css'
import { AuthContextProvider } from './context/authContext.tsx'
import { ThemeProvider } from './context/ThemeProvider.tsx'
import { CourseContextProvider } from './context/courseContext.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
  <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
    <AuthContextProvider>
      <CourseContextProvider>
        <BrowserRouter>
          <NextUIProvider>
            <App />
          </NextUIProvider>
        </BrowserRouter>
      </CourseContextProvider>
    </AuthContextProvider>
  </ThemeProvider>
  </StrictMode>,
)
