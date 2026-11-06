import React, { useState } from 'react';
import {
  Castle,
  Coins,
  Swords,
  Scroll,
  BookOpen,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

import { Language, TRANSLATIONS } from '../i18n/translations';

export type ActiveDockTab = 'none' | 'realm' | 'economy' | 'military' | 'diplomacy' | 'chronicle';

interface BottomDockProps {
  activeTab: ActiveDockTab;
  onSelectTab: (tab: ActiveDockTab) => void;
  unresolvedEventCount?: number;
  activeWarCount?: number;
  language: Language;
}

export const BottomDock: React.FC<BottomDockProps> = ({
  activeTab,
  onSelectTab,
  unresolvedEventCount = 0,
  activeWarCount = 0,
  language,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const t = TRANSLATIONS[language];

  const tabs = [
    { id: 'realm' as ActiveDockTab, label: t.navRealm, icon: Castle, desc: t.navRealmDesc },
    { id: 'economy' as ActiveDockTab, label: t.navEconomy, icon: Coins, desc: t.navEconomyDesc },
    { id: 'military' as ActiveDockTab, label: t.navMilitary, icon: Swords, desc: t.navMilitaryDesc, badge: activeWarCount > 0 ? `${activeWarCount} ${t.warBadge}` : undefined },
    { id: 'diplomacy' as ActiveDockTab, label: t.navDiplomacy, icon: Scroll, desc: t.navDiplomacyDesc },
    { id: 'chronicle' as ActiveDockTab, label: t.navChronicle, icon: BookOpen, desc: t.navChronicleDesc, badge: unresolvedEventCount > 0 ? t.newBadge : undefined },
  ];

  return (
    <div
      className={`fixed bottom-4 left-1/2 -translate-x-1/2 z-30 transition-all duration-300 max-w-[94vw] w-full max-w-3xl ${
        isCollapsed ? 'translate-y-[calc(100%-36px)]' : 'translate-y-0'
      }`}
    >
      {/* Collapse/Expand Toggle Tab */}
      <div className="flex justify-center mb-1">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="px-4 py-1 bg-[#0d1527]/90 hover:bg-[#131c2e] text-[#d4af37] border border-[#d4af37]/40 rounded-t-lg text-xs font-cinzel font-semibold tracking-wider flex items-center gap-1 shadow-lg backdrop-blur-md transition-colors"
        >
          {isCollapsed ? (
            <>
              <ChevronUp className="w-3.5 h-3.5" />
              <span>{t.showControls}</span>
            </>
          ) : (
            <>
              <ChevronDown className="w-3.5 h-3.5" />
              <span>{t.hideControls}</span>
            </>
          )}
        </button>
      </div>

      {/* Main Unified Dock Bar */}
      <nav
        aria-label="Realm Council Navigation"
        className="bg-[#0d1527]/95 border border-[#d4af37]/40 rounded-2xl p-2 shadow-2xl backdrop-blur-md flex items-center justify-around gap-1 sm:gap-2"
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(isActive ? 'none' : tab.id)}
              className={`relative flex-1 py-2 px-2 sm:px-3 rounded-xl transition-all flex flex-col items-center justify-center gap-1 group ${
                isActive
                  ? 'bg-gradient-to-b from-[#d4af37]/25 to-[#d4af37]/10 border border-[#d4af37]/70 text-[#faf6ed] shadow-inner'
                  : 'text-[#e2d5b8]/75 hover:text-[#faf6ed] hover:bg-[#131c2e]/60 border border-transparent'
              }`}
            >
              <div className="relative">
                <Icon
                  className={`w-5 h-5 transition-transform group-hover:scale-110 ${
                    isActive ? 'text-[#d4af37]' : 'text-[#e2d5b8]/80'
                  }`}
                />
                {tab.badge && (
                  <span className="absolute -top-1.5 -right-3 px-1 py-0.2 bg-red-600 text-white font-sans text-[9px] font-bold rounded">
                    {tab.badge}
                  </span>
                )}
              </div>

              <span className="font-cinzel font-semibold text-xs tracking-wider whitespace-nowrap">
                {tab.label}
              </span>

              <span className="text-[10px] text-[#e2d5b8]/50 hidden md:inline whitespace-nowrap">
                {tab.desc}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};
