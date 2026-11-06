import React from 'react';
import { GameResources, PlayerHouse } from '../types/game';
import { Language, TRANSLATIONS } from '../i18n/translations';
import {
  Coins,
  Wheat,
  Users,
  ShieldAlert,
  Crown,
  Play,
  Pause,
  FastForward,
  ChevronRight,
  Flame,
  Languages,
} from 'lucide-react';

interface TopBarProps {
  resources: GameResources;
  season: 'Spring' | 'Summer' | 'Autumn' | 'Winter';
  year: number;
  gameSpeed: number; // 0 = pause, 1 = normal, 2 = fast, 3 = very fast
  stability: number; // 0 - 100
  playerHouse: PlayerHouse;
  onSetGameSpeed: (speed: number) => void;
  onAdvanceTurn: () => void;
  goldNetChange: number;
  foodNetChange: number;
  language: Language;
  onToggleLanguage: (lang: Language) => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  resources,
  season,
  year,
  gameSpeed,
  stability,
  playerHouse,
  onSetGameSpeed,
  onAdvanceTurn,
  goldNetChange,
  foodNetChange,
  language,
  onToggleLanguage,
}) => {
  const t = TRANSLATIONS[language];

  const seasonNames = {
    Spring: t.spring,
    Summer: t.summer,
    Autumn: t.autumn,
    Winter: t.winter,
  };

  const seasonColors = {
    Spring: 'text-emerald-400',
    Summer: 'text-amber-400',
    Autumn: 'text-orange-400',
    Winter: 'text-cyan-300',
  };

  return (
    <header className="relative z-30 w-full bg-[#0d1527]/95 border-b border-[#d4af37]/30 px-4 py-2.5 shadow-2xl backdrop-blur-md">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
        {/* Left: House Sigil & Ruler */}
        <div className="flex items-center gap-3 shrink-0">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center font-cinzel font-bold text-lg text-white shadow-inner border border-[#d4af37]/60"
            style={{ backgroundColor: playerHouse.color }}
          >
            {playerHouse.sigil === 'Eagle' ? '🦅' : playerHouse.sigil === 'Dragon' ? '🐉' : '🦌'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-cinzel font-bold text-sm tracking-wider text-[#faf6ed]">
                {language === 'zh'
                  ? playerHouse.houseName === 'House Sterling'
                    ? '斯特林家族'
                    : playerHouse.houseName === 'House Valen'
                    ? '瓦伦家族'
                    : '莫温家族'
                  : playerHouse.houseName}
              </span>
              <span className="text-[11px] text-[#d4af37] font-medium hidden sm:inline">
                {language === 'zh'
                  ? playerHouse.houseName === 'House Sterling'
                    ? '高港大都督'
                    : playerHouse.houseName === 'House Valen'
                    ? '铁峰守望者'
                    : '河谷女主公'
                  : playerHouse.leaderTitle}
              </span>
            </div>
            <div className="text-[11px] text-[#e2d5b8]/70">
              {t.rulerLabel} <span className="text-[#faf6ed] font-medium">{playerHouse.leaderName}</span>
            </div>
          </div>
        </div>

        {/* Center: Realm Resources */}
        <div className="flex items-center gap-4 md:gap-6 flex-wrap justify-center text-xs">
          {/* Gold */}
          <div className="flex items-center gap-1.5" title={`${t.netGoldTooltip} ${goldNetChange >= 0 ? '+' : ''}${goldNetChange}`}>
            <Coins className="w-4 h-4 text-amber-400 shrink-0" />
            <div className="flex flex-col">
              <span className="font-semibold text-amber-300 tabular-nums">
                {resources.gold.toLocaleString()}
              </span>
              <span className={`text-[10px] ${goldNetChange >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {goldNetChange >= 0 ? `+${goldNetChange}` : goldNetChange}/s
              </span>
            </div>
          </div>

          {/* Food */}
          <div className="flex items-center gap-1.5" title={`${t.netFoodTooltip} ${foodNetChange >= 0 ? '+' : ''}${foodNetChange}`}>
            <Wheat className="w-4 h-4 text-emerald-400 shrink-0" />
            <div className="flex flex-col">
              <span className="font-semibold text-emerald-300 tabular-nums">
                {resources.food.toLocaleString()}
              </span>
              <span className={`text-[10px] ${foodNetChange >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {foodNetChange >= 0 ? `+${foodNetChange}` : foodNetChange}/s
              </span>
            </div>
          </div>

          {/* Population */}
          <div className="flex items-center gap-1.5" title={t.totalPopTooltip}>
            <Users className="w-4 h-4 text-sky-400 shrink-0" />
            <div className="flex flex-col">
              <span className="font-semibold text-sky-200 tabular-nums">
                {resources.population.toLocaleString()}
              </span>
              <span className="text-[10px] text-sky-400/80">{t.population}</span>
            </div>
          </div>

          {/* Soldiers */}
          <div className="flex items-center gap-1.5" title={t.soldiersTooltip}>
            <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
            <div className="flex flex-col">
              <span className="font-semibold text-red-300 tabular-nums">
                {resources.soldiers.toLocaleString()}
              </span>
              <span className="text-[10px] text-red-400/80">{t.soldiers}</span>
            </div>
          </div>

          {/* Prestige */}
          <div className="flex items-center gap-1.5" title={t.prestigeTooltip}>
            <Crown className="w-4 h-4 text-yellow-400 shrink-0" />
            <div className="flex flex-col">
              <span className="font-semibold text-yellow-300 tabular-nums">
                {resources.prestige.toLocaleString()}
              </span>
              <span className="text-[10px] text-yellow-400/80">{t.prestige}</span>
            </div>
          </div>

          {/* Stability */}
          <div className="hidden lg:flex items-center gap-2 pl-2 border-l border-[#d4af37]/20" title={`${t.stabilityTooltip} ${stability}%`}>
            <Flame className="w-4 h-4 text-orange-400 shrink-0" />
            <div className="w-20">
              <div className="flex justify-between text-[10px] text-[#e2d5b8]/80 mb-0.5">
                <span>{t.stability}</span>
                <span className="font-semibold">{stability}%</span>
              </div>
              <div className="w-full bg-[#1e293b] rounded-full h-1.5 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    stability > 60 ? 'bg-emerald-500' : stability > 35 ? 'bg-amber-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${stability}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right: Language Switcher, Date, Speed Controls & Next Season */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Language Switcher Segmented Control */}
          <div className="flex items-center bg-[#131c2e] border border-[#d4af37]/50 rounded-lg p-0.5 shadow-inner">
            <button
              onClick={() => onToggleLanguage('en')}
              className={`px-2 py-1 rounded text-xs font-semibold transition-all ${
                language === 'en'
                  ? 'bg-[#d4af37] text-[#090d16] shadow font-bold'
                  : 'text-[#e2d5b8]/70 hover:text-white'
              }`}
              title="Switch to English"
            >
              EN
            </button>
            <button
              onClick={() => onToggleLanguage('zh')}
              className={`px-2 py-1 rounded text-xs font-semibold transition-all ${
                language === 'zh'
                  ? 'bg-[#d4af37] text-[#090d16] shadow font-bold'
                  : 'text-[#e2d5b8]/70 hover:text-white'
              }`}
              title="切换为中文"
            >
              中文
            </button>
          </div>

          {/* Season / Year Badge */}
          <div className="text-right">
            <div className={`font-cinzel font-bold text-xs ${seasonColors[season]}`}>
              {seasonNames[season]}
            </div>
            <div className="text-[11px] text-[#e2d5b8]/70 tabular-nums font-semibold">
              {year} {t.ad}
            </div>
          </div>

          {/* Speed Toggles */}
          <div className="flex items-center bg-[#131c2e] border border-[#d4af37]/40 rounded-lg p-0.5 shadow-inner">
            <button
              onClick={() => onSetGameSpeed(0)}
              className={`p-1.5 rounded transition-colors ${
                gameSpeed === 0 ? 'bg-[#d4af37] text-[#090d16]' : 'text-[#e2d5b8] hover:text-white'
              }`}
              title={t.speedPaused}
            >
              <Pause className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onSetGameSpeed(1)}
              className={`p-1.5 rounded transition-colors ${
                gameSpeed === 1 ? 'bg-[#d4af37] text-[#090d16]' : 'text-[#e2d5b8] hover:text-white'
              }`}
              title={t.speedNormal}
            >
              <Play className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onSetGameSpeed(2)}
              className={`p-1.5 rounded transition-colors ${
                gameSpeed === 2 ? 'bg-[#d4af37] text-[#090d16]' : 'text-[#e2d5b8] hover:text-white'
              }`}
              title={t.speedFast}
            >
              <FastForward className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Advance Turn Button */}
          <button
            onClick={onAdvanceTurn}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-[#d4af37] to-[#b59226] text-[#090d16] font-cinzel font-bold text-xs rounded-lg shadow hover:brightness-110 active:scale-95 transition-all"
            title="Advance realm by one seasonal quarter"
          >
            <span>{t.nextSeason}</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
