import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { SettingsProvider } from './contexts/SettingsContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import MediaLibrary from './pages/MediaLibrary';

function App() {
  return (
    <SettingsProvider>
      <Router>
        <div className="min-h-screen bg-gray-900 text-gray-100">
          <Layout>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/media" element={<MediaLibrary />} />
            </Routes>
          </Layout>
          <Toaster 
            position="top-right"
            toastOptions={{
              style: {
                background: '#1F2937',
                color: '#F9FAFB',
                border: '1px solid #374151'
              }
            }}
          />
        </div>
      </Router>
    </SettingsProvider>
  );
}

export default App;