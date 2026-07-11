import { useState, useEffect } from 'react';
import { LearningProvider, useLearning } from './context/LearningContext';
import TabBar from './components/TabBar';
import TodayLearning from './pages/TodayLearning';
import ReviewPage from './pages/ReviewPage';
import ListeningQuiz from './pages/ListeningQuiz';

function AppContent() {
  const { activeTab, setActiveTab, totalLearned } = useLearning();

  const tabs = [
    { key: 'learn', label: '今日学习', icon: '📖', component: TodayLearning },
    { key: 'review', label: '复习', icon: '🔄', component: ReviewPage },
    { key: 'quiz', label: '听力测验', icon: '🎧', component: ListeningQuiz },
  ];

  // Android back button / Escape key handler
  useEffect(() => {
    const tabKeys = tabs.map(t => t.key);
    function handleBack(e) {
      if (e.key === 'Escape') {
        const idx = tabKeys.indexOf(activeTab);
        if (idx > 0) {
          e.preventDefault();
          setActiveTab(tabKeys[idx - 1]);
        }
      }
    }
    document.addEventListener('keydown', handleBack);
    return () => document.removeEventListener('keydown', handleBack);
  }, [activeTab, setActiveTab]);

  // Android physical back button via popstate
  useEffect(() => {
    window.history.pushState(null, '', null);
    function handlePop() {
      const tabKeys = tabs.map(t => t.key);
      const idx = tabKeys.indexOf(activeTab);
      if (idx > 0) {
        setActiveTab(tabKeys[idx - 1]);
        window.history.pushState(null, '', null);
      }
    }
    window.addEventListener('popstate', handlePop);
    return () => window.removeEventListener('popstate', handlePop);
  }, [activeTab, setActiveTab]);

  // Pause speech when app goes to background
  useEffect(() => {
    function handleVisibility() {
      if (document.hidden && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    }
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  // Network status
  const [online, setOnline] = useState(navigator.onLine);
  useEffect(() => {
    function goOnline() { setOnline(true); }
    function goOffline() { setOnline(false); }
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  // Hide splash
  useEffect(() => {
    const el = document.getElementById('splash');
    if (el) {
      el.classList.add('hide');
      setTimeout(() => el.remove(), 500);
    }
  }, []);

  const ActiveComponent = tabs.find(t => t.key === activeTab)?.component || TodayLearning;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {/* Offline banner */}
      {!online && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-yellow-500 text-white text-center py-1 text-xs font-medium safe-top">
          网络已断开 — 部分功能不可用
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:flex-col md:w-56 md:bg-white md:border-r md:border-gray-200 md:min-h-screen md:p-6">
        <div className="mb-8">
          <h1 className="text-xl font-bold text-gray-900">Echo English</h1>
          <p className="text-xs text-gray-400 mt-1">每天 15 分钟学英语</p>
        </div>

        <nav className="flex-1 space-y-1">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-colors ${
                activeTab === tab.key
                  ? 'bg-blue-50 text-blue-700 font-semibold'
                  : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              <span className="text-lg">{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>

        <div className="pt-6 border-t border-gray-100">
          <p className="text-sm text-gray-400">
            已掌握 <span className="font-semibold text-green-600">{totalLearned}</span> 词
          </p>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 pb-20 md:pb-0 safe-bottom">
        <div className="max-w-2xl mx-auto">
          <ActiveComponent />
        </div>
      </main>

      {/* Mobile tab bar */}
      <div className="md:hidden">
        <TabBar />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <LearningProvider>
      <AppContent />
    </LearningProvider>
  );
}
