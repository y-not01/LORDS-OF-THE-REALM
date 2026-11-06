import React, { useState } from 'react';
import { Territory, Army, RivalLord, ChronicleEntry, GameResources, PlayerHouse } from '../types/game';
import { Language, TRANSLATIONS } from '../i18n/translations';
import {
  Castle,
  Coins,
  Swords,
  Wheat,
  X,
  BookOpen,
  MapPin,
} from 'lucide-react';
import { ActiveDockTab } from './BottomDock';

interface CouncilModalsProps {
  activeTab: ActiveDockTab;
  onClose: () => void;
  territories: Territory[];
  armies: Army[];
  rivalLords: RivalLord[];
  chronicle: ChronicleEntry[];
  resources: GameResources;
  playerHouse: PlayerHouse;
  onSelectTerritory: (territoryId: string) => void;
  onOpenDiplomacy: (lordId: string) => void;
  onMobilizeArmy: (territoryId: string, size: number) => void;
  language?: Language;
}

export const CouncilModals: React.FC<CouncilModalsProps> = ({
  activeTab,
  onClose,
  territories,
  armies,
  rivalLords,
  chronicle,
  resources,
  playerHouse,
  onSelectTerritory,
  onMobilizeArmy,
  language = 'en',
}) => {
  const [chronicleFilter, setChronicleFilter] = useState<'all' | 'war' | 'diplomacy' | 'event'>('all');
  const [selectedMobilizeTerritory, setSelectedMobilizeTerritory] = useState<string>(
    territories.find((t) => t.ownerId === 'player')?.id || ''
  );
  const [mobilizeSize, setMobilizeSize] = useState<number>(50);

  const t = TRANSLATIONS[language];

  if (activeTab === 'none' || activeTab === 'diplomacy') return null;

  const playerTerritories = territories.filter((t) => t.ownerId === 'player');
  const totalGarrison = playerTerritories.reduce((acc, item) => acc + item.garrison, 0);
  const totalPopulation = playerTerritories.reduce((acc, item) => acc + item.population, 0);

  const filteredChronicle = chronicle.filter(
    (item) => chronicleFilter === 'all' || item.category === chronicleFilter
  );

  const getLordDisplayName = (name: string) => {
    if (language !== 'zh') return name;
    if (name === 'Lord Edmund') return '埃德蒙勋爵';
    if (name === 'Lady Eleanor') return '埃莉诺夫人';
    if (name === 'Lord Blackwood') return '黑木勋爵';
    if (name === 'King Aldric') return '阿尔德里克国王';
    return name;
  };

  const getHouseDisplayName = (house: string) => {
    if (language !== 'zh') return house;
    if (house === 'House Sterling') return '斯特林家族';
    if (house === 'House Valen') return '瓦伦家族';
    if (house === 'House Morwen') return '莫温家族';
    return house;
  };

  const biomeNames: Record<string, string> = {
    plains: language === 'zh' ? '平原' : 'plains',
    hills: language === 'zh' ? '丘陵' : 'hills',
    mountains: language === 'zh' ? '山岳' : 'mountains',
    riverland: language === 'zh' ? '河谷' : 'riverland',
    forest: language === 'zh' ? '林地' : 'forest',
    coast: language === 'zh' ? '沿海' : 'coast',
  };

  return (
    <div className="fixed inset-0 z-40 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#0d1527] border border-[#d4af37]/60 rounded-3xl max-w-3xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[85vh] text-[#e2d5b8]">
        {/* Header */}
        <div className="px-6 py-4 bg-[#131c2e] border-b border-[#d4af37]/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {activeTab === 'realm' && <Castle className="w-6 h-6 text-[#d4af37]" />}
            {activeTab === 'economy' && <Coins className="w-6 h-6 text-amber-400" />}
            {activeTab === 'military' && <Swords className="w-6 h-6 text-red-400" />}
            {activeTab === 'chronicle' && <BookOpen className="w-6 h-6 text-yellow-400" />}

            <div>
              <h2 className="font-cinzel font-bold text-lg text-[#faf6ed] capitalize">
                {activeTab === 'realm' && t.sovereignFiefdomsTitle}
                {activeTab === 'economy' && t.economyTitle}
                {activeTab === 'military' && t.militaryTitle}
                {activeTab === 'chronicle' && t.chronicleTitle}
              </h2>
              <span className="text-xs text-[#e2d5b8]/70">
                {getHouseDisplayName(playerHouse.houseName)} · {playerHouse.leaderTitle}
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#e2d5b8]/70 hover:text-white hover:bg-[#1a263d] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* TAB 1: REALM OVERVIEW */}
          {activeTab === 'realm' && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3 text-xs">
                <div className="bg-[#131c2e] p-3 rounded-xl border border-[#d4af37]/20">
                  <div className="text-[10px] text-[#e2d5b8]/60">{t.sovereignProvinces}</div>
                  <div className="font-bold text-base text-[#faf6ed] tabular-nums">
                    {playerTerritories.length} {t.fiefdomsUnit}
                  </div>
                </div>
                <div className="bg-[#131c2e] p-3 rounded-xl border border-[#d4af37]/20">
                  <div className="text-[10px] text-[#e2d5b8]/60">{t.totalPopulationLabel}</div>
                  <div className="font-bold text-base text-sky-300 tabular-nums">
                    {totalPopulation.toLocaleString()}
                  </div>
                </div>
                <div className="bg-[#131c2e] p-3 rounded-xl border border-[#d4af37]/20">
                  <div className="text-[10px] text-[#e2d5b8]/60">{t.garrisonDefenseLabel}</div>
                  <div className="font-bold text-base text-red-300 tabular-nums">
                    {totalGarrison} {t.soldiers}
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-cinzel font-semibold text-xs text-[#d4af37] mb-2.5">
                  {t.provincesUnderBanner}
                </h4>
                <div className="space-y-2">
                  {playerTerritories.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 bg-[#131c2e]/60 hover:bg-[#1a263d] border border-[#d4af37]/20 rounded-xl flex items-center justify-between transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[#d4af37]/20 border border-[#d4af37]/40 flex items-center justify-center font-bold text-xs text-[#d4af37]">
                          🏰
                        </div>
                        <div>
                          <div className="font-cinzel font-bold text-sm text-[#faf6ed]">
                            {item.name}
                          </div>
                          <div className="text-[11px] text-[#e2d5b8]/70">
                            {biomeNames[item.biome] || item.biome} · {t.population}: {item.population.toLocaleString()} · {t.soldiers}: {item.garrison}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-amber-300 font-medium">
                          +{item.goldYield} {t.gold}
                        </span>
                        <button
                          onClick={() => {
                            onSelectTerritory(item.id);
                            onClose();
                          }}
                          className="px-3 py-1 bg-[#d4af37]/20 hover:bg-[#d4af37]/40 text-[#faf6ed] rounded-lg text-xs font-cinzel font-semibold transition-colors flex items-center gap-1"
                        >
                          <MapPin className="w-3.5 h-3.5" />
                          <span>{t.focusMap}</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ECONOMY */}
          {activeTab === 'economy' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-500/30 text-xs text-amber-200 leading-relaxed">
                <span className="font-bold text-[#faf6ed]">{t.houseSpecialty} </span>
                {playerHouse.bonusDescription}
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-[#131c2e] p-4 rounded-xl border border-[#d4af37]/20 space-y-2">
                  <div className="flex items-center gap-2">
                    <Coins className="w-5 h-5 text-amber-400" />
                    <span className="font-cinzel font-bold text-sm text-[#faf6ed]">
                      {t.treasuryBreakdown}
                    </span>
                  </div>
                  <div className="text-[11px] text-[#e2d5b8]/80 space-y-1 pt-1">
                    <div className="flex justify-between">
                      <span>{t.provincialTaxes}</span>
                      <span className="text-emerald-400 tabular-nums">
                        +{playerTerritories.reduce((acc, item) => acc + item.goldYield, 0)} {t.gold}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>{t.tradeRoutes}</span>
                      <span className="text-emerald-400 tabular-nums">
                        +{rivalLords.filter((r) => r.tradeActive).length * 25} {t.gold}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>{t.armyUpkeep}</span>
                      <span className="text-red-400 tabular-nums">
                        -{Math.floor(resources.soldiers * 0.15)} {t.gold}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-[#131c2e] p-4 rounded-xl border border-[#d4af37]/20 space-y-2">
                  <div className="flex items-center gap-2">
                    <Wheat className="w-5 h-5 text-emerald-400" />
                    <span className="font-cinzel font-bold text-sm text-[#faf6ed]">
                      {t.granaryHarvests}
                    </span>
                  </div>
                  <div className="text-[11px] text-[#e2d5b8]/80 space-y-1 pt-1">
                    <div className="flex justify-between">
                      <span>{t.seasonalHarvest}</span>
                      <span className="text-emerald-400 tabular-nums">
                        +{Math.floor(playerTerritories.reduce((acc, item) => acc + item.foodYield, 0) * playerHouse.foodBonus)} {t.food}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>{t.populationConsumption}</span>
                      <span className="text-red-400 tabular-nums">
                        -{Math.floor(totalPopulation * 0.008)} {t.food}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>{t.rationBuffer}</span>
                      <span className="text-emerald-300 font-semibold">{t.secure}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Active Trade Agreements */}
              <div>
                <h4 className="font-cinzel font-semibold text-xs text-[#d4af37] mb-2">
                  {t.activeTradeCompacts}
                </h4>
                {rivalLords.filter((r) => r.tradeActive).length === 0 ? (
                  <div className="p-4 bg-[#131c2e]/40 rounded-xl text-center text-xs text-[#e2d5b8]/60">
                    {t.noActiveTrade}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {rivalLords
                      .filter((r) => r.tradeActive)
                      .map((lord) => (
                        <div
                          key={lord.id}
                          className="p-3 bg-[#131c2e] rounded-xl border border-emerald-500/30 flex items-center justify-between"
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="text-lg">{lord.portraitIcon}</span>
                            <div>
                              <div className="font-cinzel font-semibold text-xs text-[#faf6ed]">
                                {language === 'zh' ? `与 ${getLordDisplayName(lord.name)} 的通商盟约` : `Trade Charter with ${lord.name}`}
                              </div>
                              <div className="text-[10px] text-emerald-400 font-medium">
                                +25 {t.gold} / {language === 'zh' ? '季' : 'season'}
                              </div>
                            </div>
                          </div>
                          <span className="text-xs text-[#e2d5b8]/70">{t.mutualTreaty}</span>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: MILITARY */}
          {activeTab === 'military' && (
            <div className="space-y-4">
              {/* Mobilize New Campaign Army */}
              <div className="bg-[#131c2e] p-4 rounded-2xl border border-[#d4af37]/30 space-y-3">
                <div className="flex items-center gap-2">
                  <Swords className="w-5 h-5 text-red-400" />
                  <span className="font-cinzel font-bold text-sm text-[#faf6ed]">
                    {t.mobilizeFieldArmy}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-[11px] text-[#e2d5b8]/70 mb-1">
                      {t.originGarrison}
                    </label>
                    <select
                      value={selectedMobilizeTerritory}
                      onChange={(e) => setSelectedMobilizeTerritory(e.target.value)}
                      className="w-full px-3 py-2 bg-[#090d16] border border-[#d4af37]/40 rounded-xl text-xs text-[#faf6ed]"
                    >
                      {playerTerritories.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name} ({t.garrisonedCount.replace('{count}', String(item.garrison))})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] text-[#e2d5b8]/70 mb-1">
                      <span>{t.troopCount}</span>
                      <span className="font-bold text-[#faf6ed]">{mobilizeSize} {t.soldiers}</span>
                    </div>
                    <input
                      type="range"
                      min={20}
                      max={Math.max(30, territories.find((item) => item.id === selectedMobilizeTerritory)?.garrison || 50)}
                      step={10}
                      value={mobilizeSize}
                      onChange={(e) => setMobilizeSize(parseInt(e.target.value, 10))}
                      className="w-full accent-[#d4af37]"
                    />
                  </div>
                </div>

                <button
                  onClick={() => {
                    if (selectedMobilizeTerritory) {
                      onMobilizeArmy(selectedMobilizeTerritory, mobilizeSize);
                      onClose();
                    }
                  }}
                  className="w-full py-2 bg-gradient-to-r from-red-800 to-red-700 hover:from-red-700 hover:to-red-600 text-white font-cinzel font-bold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
                >
                  <Swords className="w-4 h-4" />
                  <span>{t.raiseAndDeploy}</span>
                </button>
              </div>

              {/* Active Armies on the Map */}
              <div>
                <h4 className="font-cinzel font-semibold text-xs text-[#d4af37] mb-2.5">
                  {t.armiesDeployedMap}
                </h4>
                {armies.length === 0 ? (
                  <div className="p-4 bg-[#131c2e]/40 rounded-xl text-center text-xs text-[#e2d5b8]/60">
                    {t.noActiveArmies}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {armies.map((army) => (
                      <div
                        key={army.id}
                        className="p-3 bg-[#131c2e] rounded-xl border border-[#d4af37]/20 flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="text-lg">🛡️</span>
                          <div>
                            <div className="font-cinzel font-bold text-sm text-[#faf6ed]">
                              {army.name}
                            </div>
                            <div className="text-[10px] text-[#e2d5b8]/70">
                              {t.armyStrength
                                .replace('{size}', String(army.size))
                                .replace('{morale}', String(army.morale))
                                .replace('{status}', army.isMarching ? t.marchingToDest : t.encampedOnTerritory)}
                            </div>
                          </div>
                        </div>

                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          army.isMarching ? 'bg-amber-500/20 text-amber-300' : 'bg-emerald-500/20 text-emerald-300'
                        }`}>
                          {army.isMarching ? t.statusMarching : t.statusStationed}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: CHRONICLE */}
          {activeTab === 'chronicle' && (
            <div className="space-y-4">
              <div className="flex items-center gap-1.5 p-1 bg-[#131c2e] rounded-xl border border-[#d4af37]/20 text-xs">
                {(['all', 'war', 'diplomacy', 'event'] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setChronicleFilter(filter)}
                    className={`flex-1 py-1 rounded-lg font-cinzel font-semibold capitalize transition-colors ${
                      chronicleFilter === filter
                        ? 'bg-[#d4af37] text-[#090d16]'
                        : 'text-[#e2d5b8]/70 hover:text-white'
                    }`}
                  >
                    {filter === 'all' ? t.filterAll : filter === 'war' ? t.filterWar : filter === 'diplomacy' ? t.filterDiplomacy : t.filterEvent}
                  </button>
                ))}
              </div>

              <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                {filteredChronicle.length === 0 ? (
                  <div className="p-6 text-center text-xs text-[#e2d5b8]/50">
                    {t.noChronicleEntries}
                  </div>
                ) : (
                  filteredChronicle.map((entry) => (
                    <div
                      key={entry.id}
                      className="p-3.5 bg-[#131c2e]/60 rounded-xl border border-[#d4af37]/20 space-y-1"
                    >
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-cinzel font-bold text-[#faf6ed]">
                          {entry.title}
                        </span>
                        <span className="text-[#d4af37] font-mono tabular-nums">
                          {entry.season === 'Spring' ? t.spring : entry.season === 'Summer' ? t.summer : entry.season === 'Autumn' ? t.autumn : t.winter}, {entry.year} {t.ad}
                        </span>
                      </div>
                      <p className="text-xs text-[#e2d5b8]/80 leading-relaxed">
                        {entry.detail}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
