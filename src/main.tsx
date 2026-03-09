import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

//Web3 connector
import { config } from './wagmi'
import { WagmiProvider } from 'wagmi'
import { QueryClientProvider, QueryClient, } from "@tanstack/react-query"

const queryClient = new QueryClient();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
          <App />
      </QueryClientProvider>
    </WagmiProvider>  
  </StrictMode>,
)