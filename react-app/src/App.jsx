import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Feed from './pages/Feed';
import Environments from './pages/Environments';
import Workflows from './pages/Workflows';
import Skills from './pages/Skills';
import Profile from './pages/Profile';
import Help from './pages/Help';
import Knowledge from './pages/Knowledge';
import Versions from './pages/Versions';
import Team from './pages/Team';
import SecretVault from './pages/SecretVault';
import VaultReader from './pages/VaultReader';
import Governance from './pages/Governance';
import { ToastProvider } from './context/ToastContext';


function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          {/* Rota Pública */}
          <Route path="/login" element={<Login />} />

          {/* Rotas Protegidas e Envelopadas pelo Layout */}
          <Route 
            path="/" 
            element={
              <ProtectedRoute>
                <Layout>
                  <Dashboard />
                </Layout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/feed" 
            element={
              <ProtectedRoute>
                <Layout>
                  <Feed />
                </Layout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/environments" 
            element={
              <ProtectedRoute>
                <Layout>
                  <Environments />
                </Layout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/workflows" 
            element={
              <ProtectedRoute>
                <Layout>
                  <Workflows />
                </Layout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/skills" 
            element={
              <ProtectedRoute>
                <Layout>
                  <Skills />
                </Layout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/profile" 
            element={
              <ProtectedRoute>
                <Layout>
                  <Profile />
                </Layout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/knowledge" 
            element={
              <ProtectedRoute>
                <Layout>
                  <Knowledge />
                </Layout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/versions" 
            element={
              <ProtectedRoute>
                <Layout>
                  <Versions />
                </Layout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/help" 
            element={
              <ProtectedRoute>
                <Layout>
                  <Help />
                </Layout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/team" 
            element={
              <ProtectedRoute>
                <Layout>
                  <Team />
                </Layout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/invite/:inviteTeamId" 
            element={
              <ProtectedRoute>
                <Layout>
                  <Team />
                </Layout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/devtools/secret-vault" 
            element={
              <ProtectedRoute>
                <Layout>
                  <SecretVault />
                </Layout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/vault/:id" 
            element={
              <ProtectedRoute>
                <Layout>
                  <VaultReader />
                </Layout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/governance" 
            element={
              <ProtectedRoute>
                <Layout>
                  <Governance />
                </Layout>
              </ProtectedRoute>
            } 
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
