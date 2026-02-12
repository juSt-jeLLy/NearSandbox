// CRITICAL: Import the fetch interceptor FIRST, before any other imports
import './services/novaProxyInterceptor';

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { NearProvider } from "near-connect-hooks";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import Index from "./pages/Index";
import Upload from "./pages/Upload";
import Marketplace from "./pages/Marketplace";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <NearProvider 
      config={{
        network: "mainnet",
        providers: {
          testnet: ["https://rpc.mainnet.near.org"]
        }
      }}
    >
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Navbar />
          <AnimatePresence mode="wait">
            <Routes>
              {/* Public route - accessible without wallet */}
              <Route path="/" element={<Index />} />
              
              {/* Protected routes - require wallet connection */}
              <Route 
                path="/upload" 
                element={
                  <ProtectedRoute>
                    <Upload />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/marketplace" 
                element={
                  <ProtectedRoute>
                    <Marketplace />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/profile" 
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                } 
              />
              
              {/* 404 route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AnimatePresence>
        </BrowserRouter>
      </TooltipProvider>
    </NearProvider>
  </QueryClientProvider>
);

export default App;