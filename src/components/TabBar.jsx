import { useLearning } from '../context/LearningContext';

const tabs = [
  { key: 'docs', label: 'AI文档', icon: '📄' },
];

export default function TabBar() {
  const { activeTab, setActiveTab, reviewQueue } = useLearning();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 md:static md:border-t-0 md:border-r md:w-20 md:flex-col md:items-center md:pt-8 md:gap-6 flex md:flex">
      {tabs.map(tab => (
        <button
          key={tab.key}
          onClick={() => setActiveTab(tab.key)}
          className={`flex-1 flex flex-col items-center py-3 text-xs transition-colors md:flex-row md:gap-2 md:w-full md:px-4 md:py-3 md:text-sm ${
            activeTab === tab.key
              ? 'text-blue-600 font-semibold'
              : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          <span className="text-xl mb-0.5 md:mb-0">{tab.icon}</span>
          <span>{tab.label}</span>
          {tab.key === 'review' && reviewQueue.length > 0 && (
            <span className="ml-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {reviewQueue.length}
            </span>
          )}
        </button>
      ))}
    </nav>
  );
}
