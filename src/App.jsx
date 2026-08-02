import { useState, useEffect } from 'react';
import { LearningProvider } from './context/LearningContext';
import GeneratedDocs from './pages/GeneratedDocs';

function AppContent() {
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

  return (
    <div className="min-h-screen bg-gray-50">
      {!online && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-yellow-500 text-white text-center py-1 text-xs font-medium safe-top">
          网络已断开
        </div>
      )}
      <main className="safe-bottom">
        <GeneratedDocs />
      </main>
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
