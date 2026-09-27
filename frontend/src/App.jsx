import React, { useState, useEffect } from 'react';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';

import DashboardPage from './pages/DashboardPage';
import DocumentsPage from './pages/DocumentsPage';
import SummarizePage from './pages/SummarizePage';
import ExplainPage from './pages/ExplainPage';
import ParaphrasePage from './pages/ParaphrasePage';
import TranslatePage from './pages/TranslatePage';
import ChatPage from './pages/ChatPage';
import StudyPage from './pages/StudyPage';
import ComparePage from './pages/ComparePage';
import HistoryPage from './pages/HistoryPage';
import SettingsPage from './pages/SettingsPage';

import { getDocuments, getSystemStatus } from './services/api';
import { ErrorBoundary } from './components/common/ErrorBoundary';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [documents, setDocuments] = useState([]);
  const [activeDocId, setActiveDocId] = useState(null);
  const [selectedLanguage, setSelectedLanguage] = useState('English');
  const [darkMode, setDarkMode] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(true);

  // Sync dark mode class on documentElement
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Initial load: fetch documents and system status
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const [docsRes, statusRes] = await Promise.all([
        getDocuments(),
        getSystemStatus()
      ]);
      setDocuments(docsRes.data);
      if (docsRes.data.length > 0 && !activeDocId) {
        setActiveDocId(docsRes.data[0].id);
      }
      setIsDemoMode(statusRes.data.is_demo_mode);
    } catch (err) {
      console.error('Failed to load initial data:', err);
    }
  };

  const refreshDocuments = async () => {
    try {
      const res = await getDocuments();
      setDocuments(res.data);
      if (res.data.length > 0 && (!activeDocId || !res.data.some(d => d.id === activeDocId))) {
        setActiveDocId(res.data[0].id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const activeDoc = documents.find((d) => d.id === activeDocId) || documents[0] || null;

  return (
    <div className="flex min-h-screen main-app-surface text-slate-900 dark:text-slate-100 transition-colors">
      {/* Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        docCount={documents.length}
        isDemoMode={isDemoMode}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 main-app-surface">
        <Header
          documents={documents}
          activeDocId={activeDocId}
          setActiveDocId={setActiveDocId}
          selectedLanguage={selectedLanguage}
          setSelectedLanguage={setSelectedLanguage}
          darkMode={darkMode}
          setDarkMode={setDarkMode}
          isDemoMode={isDemoMode}
          setActiveTab={setActiveTab}
        />

        <main className="flex-1 overflow-y-auto main-app-surface">
          {activeTab === 'dashboard' && (
            <DashboardPage
              setActiveTab={setActiveTab}
              activeDoc={activeDoc}
              setActiveDocId={setActiveDocId}
            />
          )}

          {activeTab === 'documents' && (
            <DocumentsPage
              documents={documents}
              activeDocId={activeDocId}
              setActiveDocId={setActiveDocId}
              refreshDocuments={refreshDocuments}
              setActiveTab={setActiveTab}
            />
          )}

          {activeTab === 'summarize' && (
            <SummarizePage
              activeDoc={activeDoc}
              selectedLanguage={selectedLanguage}
            />
          )}

          {activeTab === 'explain' && (
            <ExplainPage
              activeDoc={activeDoc}
              selectedLanguage={selectedLanguage}
            />
          )}

          {activeTab === 'paraphrase' && (
            <ParaphrasePage
              activeDoc={activeDoc}
              selectedLanguage={selectedLanguage}
            />
          )}

          {activeTab === 'translate' && (
            <ErrorBoundary key="translate">
              <TranslatePage
                activeDoc={activeDoc}
                selectedLanguage={selectedLanguage}
                documents={documents}
                setActiveDocId={setActiveDocId}
              />
            </ErrorBoundary>
          )}

          {activeTab === 'chat' && (
            <ChatPage
              activeDoc={activeDoc}
              selectedLanguage={selectedLanguage}
            />
          )}

          {activeTab === 'study' && (
            <StudyPage
              activeDoc={activeDoc}
              selectedLanguage={selectedLanguage}
            />
          )}

          {activeTab === 'compare' && (
            <ComparePage
              documents={documents}
              selectedLanguage={selectedLanguage}
            />
          )}

          {activeTab === 'history' && (
            <HistoryPage
              setActiveDocId={setActiveDocId}
              setActiveTab={setActiveTab}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsPage />
          )}
        </main>
      </div>
    </div>
  );
}
