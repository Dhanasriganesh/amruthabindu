import { StrictMode, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { BrowserRouter } from 'react-router-dom'
import Layout from './components/layout/Layout'
import Routers from './components/routers/Routers'
import ErrorBoundary from './components/ErrorBoundary'

function Root() {
  useEffect(() => { document.title = 'Amrutha Bindu' }, [])
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <Layout>
          <Routers />
        </Layout>
      </ErrorBoundary>
    </BrowserRouter>
  )
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Root />
  </StrictMode>,
)
