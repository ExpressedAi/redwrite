import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { SettingsProvider } from './contexts/SettingsContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Conversations from './pages/Conversations';
import MediaLibrary from './pages/MediaLibrary';
import ContextManagement from './pages/ContextManagement';
import ContextScrape from './pages/ContextScrape';
import HTMLGenerator from './pages/HTMLGenerator';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';

function App() {
  return (
    <SettingsProvider>
      <Router>
        <div className="min-h-screen bg-gray-900 text-gray-100">
          <Layout>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/conversations" element={<Conversations />} />
              <Route path="/media" element={<MediaLibrary />} />
              <Route path="/context" element={<ContextManagement />} />
              <Route path="/scrape" element={<ContextScrape />} />
              <Route path="/html-generator" element={<HTMLGenerator />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/settings" element={<Settings />} />
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