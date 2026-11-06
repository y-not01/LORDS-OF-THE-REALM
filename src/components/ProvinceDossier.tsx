import React, { useState } from 'react';
import { Territory, BuildingType, RivalLord, PlayerHouse } from '../types/game';
import { BUILDING_DEFINITIONS } from '../game/initialData';
import { Language, TRANSLATIONS } from '../i18n/translations';
import {
  Castle,
  Shield,
  Coins,
  Wheat,
  Users,
  Swords,
  X,
  Hammer,
  ArrowUpRight,
  Send,
  AlertTriangle,
} from 'lucide-react';

interface ProvinceDossierProps {
  territory: Territory;
  playerHouse: PlayerHouse;
  rivalLords: RivalLord[];
  playerGold: number;
  allTerritories: Territory[];
  onClose: () => void;
  onUpgradeBuilding: (territoryId: string, building: BuildingType) => void;
  onChangeTaxRate: (territoryId: string, taxRate: 'low' | 'moderate' | 'harsh') => void;
  onRecruitLevy: (territoryId: string, count: number) => void;
  onStartMarchArmy: (territoryId: string) => void;
  onOpenDiplomacyWithLord: (lordId: string) => void;
  isDispatchingArmy?: boolean;
  language?: Language;
}

export const ProvinceDossier: React.FC<ProvinceDossierProps> = ({
  territory,
  playerHouse,
  rivalLords,
  playerGold,
  allTerritories,
  onClose,
  onUpgradeBuilding,
  onChangeTaxRate,
  onRecruitLevy,
  onStartMarchArmy,
  onOpenDiplomacyWithLord,
  isDispatchingArmy,
  language = 'en',
}) => {
  const [recruitCount, setRecruitCount] = useState<number>(30);
  const t = TRANSLATIONS[language];

  const isPlayerOwned = territory.ownerId === 'player';
  const ownerRival = rivalLords.find((r) => r.id === territory.ownerId);

  const getHouseDisplayName = (house: string) => {
    if (language !== 'zh') return house;
    if (house === 'House Sterling') return '斯特林家族';
    if (house === 'House Valen') return '瓦伦家族';
    if (house === 'House Morwen') return '莫温家族';
    if (house === 'House Boarcrest') return '野猪冠家族';
    if (house === 'House Swanreach') return '天鹅湾家族';
    if (house === 'House Ravenspire') return '渡鸦塔家族';
    if (house === 'House Royal Crown') return '皇家王冠家族';
    return house;
  };

  const getLordDisplayName = (name: string) => {
    if (language !== 'zh') return name;
    if (name === 'Lord Edmund') return '埃德蒙勋爵';
    if (name === 'Lady Eleanor') return '埃莉诺夫人';
    if (name === 'Lord Blackwood') return '黑木勋爵';
    if (name === 'King Aldric') return '阿尔德里克国王';
    return name;
  };

  const ownerName = isPlayerOwned
    ? getHouseDisplayName(playerHouse.houseName)
    : ownerRival
    ? `${getLordDisplayName(ownerRival.name)} (${getHouseDisplayName(ownerRival.houseName)})`
    : t.neutralBorderland;

  const ownerColor = isPlayerOwned
    ? playerHouse.color
    : ownerRival
    ? ownerRival.color
    : '#64748b';

  const biomeNames: Record<string, string> = {
    plains: language === 'zh' ? '平原' : 'plains',
    hills: language === 'zh' ? '丘陵' : 'hills',
    mountains: language === 'zh' ? '山岳' : 'mountains',
    riverland: language === 'zh' ? '河谷' : 'riverland',
    forest: language === 'zh' ? '林地' : 'forest',
    coast: language === 'zh' ? '沿海' : 'coast',
  };

  const buildingZhNames: Record<BuildingType, { name: string; desc: string }> = {
    castleKeep: {
      name: '封建主堡大厅',
      desc: '领地政务与号令中心。统领本地民心，强化驻军宿卫纪律。',
    },
    stoneWalls: {
      name: '环城花岗岩石墙',
      desc: '厚重女墙与箭垛望楼，在敌军围城时提供坚不可摧的防御掩护。',
    },
    marketSquare: {
      name: '商贾百工市集',
      desc: '热闹非凡的交易集市，吸引外邦行商与铁匠匠人络绎不绝。',
    },
    barracks: {
      name: '铁骑校场与兵营',
      desc: '弓兵、长矛手与重装骑士的严酷操演之地。',
    },
    granary: {
      name: '密封原木高架太仓',
      desc: '以石块衬砌的干燥粮仓，可储备丰年谷物以抵御酷冬饥馑。',
    },
  };

  const connectedTerritoryNames = territory.connectedTo
    .map((id) => allTerritories.find((item) => item.id === id)?.name || id)
    .join(', ');

  const recruitCost = recruitCount * 1; // 1 gold per soldier

  return (
    <div className="absolute top-16 right-4 bottom-24 z-20 w-80 sm:w-96 bg-[#0d1527]/95 border border-[#d4af37]/40 rounded-2xl shadow-2xl backdrop-blur-md flex flex-col overflow-hidden text-[#e2d5b8] animate-in slide-in-from-right duration-200">
      {/* Header Banner */}
      <div
        className="px-5 py-3.5 border-b border-[#d4af37]/30 flex items-center justify-between"
        style={{ borderTop: `4px solid ${ownerColor}` }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm text-white shadow"
            style={{ backgroundColor: ownerColor }}
          >
            {isPlayerOwned
              ? '⚔️'
              : ownerRival
              ? ownerRival.portraitIcon
              : '🛡️'}
          </div>
          <div>
            <h3 className="font-cinzel font-bold text-base text-[#faf6ed]">
              {territory.name}
            </h3>
            <span className="text-[11px] text-[#d4af37] capitalize font-medium">
              {biomeNames[territory.biome] || territory.biome} {t.fiefdom} · {ownerName}
            </span>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1 rounded-lg text-[#e2d5b8]/70 hover:text-white hover:bg-[#1a263d] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Content Scrollable Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
        {/* Core Province Vital Metrics */}
        <div className="grid grid-cols-2 gap-2 bg-[#131c2e]/70 p-3 rounded-xl border border-[#d4af37]/20">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-sky-400" />
            <div>
              <div className="text-[10px] text-[#e2d5b8]/60">{t.population}</div>
              <div className="font-semibold text-sky-200 tabular-nums">
                {territory.population.toLocaleString()}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-red-400" />
            <div>
              <div className="text-[10px] text-[#e2d5b8]/60">{t.fortDefense}</div>
              <div className="font-semibold text-red-200 tabular-nums">
                {territory.defense} / 100
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Coins className="w-4 h-4 text-amber-400" />
            <div>
              <div className="text-[10px] text-[#e2d5b8]/60">{t.goldYield}</div>
              <div className="font-semibold text-amber-200 tabular-nums">
                +{territory.goldYield} / season
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Wheat className="w-4 h-4 text-emerald-400" />
            <div>
              <div className="text-[10px] text-[#e2d5b8]/60">{t.foodHarvest}</div>
              <div className="font-semibold text-emerald-200 tabular-nums">
                +{territory.foodYield} / season
              </div>
            </div>
          </div>
        </div>

        {/* Garrison Status */}
        <div className="bg-[#131c2e]/50 p-3 rounded-xl border border-[#d4af37]/20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Castle className="w-4 h-4 text-[#d4af37]" />
            <div>
              <div className="text-[11px] font-semibold text-[#faf6ed]">{t.garrisonedTroops}</div>
              <div className="text-[10px] text-[#e2d5b8]/70">
                {t.connectedRoads} {connectedTerritoryNames}
              </div>
            </div>
          </div>
          <span className="font-bold text-sm text-[#faf6ed] tabular-nums">
            {territory.garrison}
          </span>
        </div>

        {/* PLAYER COMMANDS: If owned by player */}
        {isPlayerOwned && (
          <>
            {/* Tax Rate Management */}
            <div>
              <label className="block text-[11px] font-cinzel font-semibold text-[#d4af37] mb-1.5">
                {t.feudalTaxPolicy}
              </label>
              <div className="grid grid-cols-3 gap-1 p-1 bg-[#131c2e] rounded-lg border border-[#d4af37]/20">
                {(['low', 'moderate', 'harsh'] as const).map((rate) => (
                  <button
                    key={rate}
                    onClick={() => onChangeTaxRate(territory.id, rate)}
                    className={`py-1 text-[11px] font-semibold capitalize rounded transition-colors ${
                      territory.taxRate === rate
                        ? 'bg-[#d4af37] text-[#090d16]'
                        : 'text-[#e2d5b8]/70 hover:text-white'
                    }`}
                  >
                    {rate === 'low' ? t.taxLow : rate === 'moderate' ? t.taxModerate : t.taxHarsh}
                  </button>
                ))}
              </div>
            </div>

            {/* Recruit Levies Section */}
            <div className="bg-[#131c2e]/60 p-3 rounded-xl border border-[#d4af37]/20 space-y-2">
              <div className="flex justify-between items-center text-[11px]">
                <span className="font-cinzel font-semibold text-[#d4af37]">{t.musterLevies}</span>
                <span className="text-[#e2d5b8]/70 tabular-nums">{t.cost} {recruitCost} {t.gold}</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min={10}
                  max={100}
                  step={10}
                  value={recruitCount}
                  onChange={(e) => setRecruitCount(parseInt(e.target.value, 10))}
                  className="flex-1 accent-[#d4af37]"
                />
                <span className="font-bold w-8 text-right tabular-nums">{recruitCount}</span>
              </div>
              <button
                disabled={playerGold < recruitCost}
                onClick={() => onRecruitLevy(territory.id, recruitCount)}
                className="w-full py-1.5 bg-[#d4af37]/20 hover:bg-[#d4af37]/30 disabled:opacity-40 disabled:pointer-events-none text-[#faf6ed] border border-[#d4af37]/50 rounded-lg font-cinzel font-semibold text-xs transition-colors flex items-center justify-center gap-1.5"
              >
                <Swords className="w-3.5 h-3.5 text-[#d4af37]" />
                <span>{t.enlistSoldiers.replace('{count}', String(recruitCount))}</span>
              </button>
            </div>

            {/* Dispatch Army Button */}
            <button
              onClick={() => onStartMarchArmy(territory.id)}
              className={`w-full py-2 rounded-xl font-cinzel font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-lg ${
                isDispatchingArmy
                  ? 'bg-red-600 text-white animate-pulse'
                  : 'bg-gradient-to-r from-red-800 to-red-700 hover:from-red-700 hover:to-red-600 text-white'
              }`}
            >
              <Send className="w-4 h-4" />
              <span>{isDispatchingArmy ? t.clickTargetProvincePrompt : t.marchArmyFromFief}</span>
            </button>

            {/* Fiefdom Buildings & Upgrades */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-cinzel font-semibold text-[#d4af37] text-[11px]">
                  {t.fiefdomStructures}
                </span>
                <span className="text-[10px] text-[#e2d5b8]/60">
                  {territory.buildings.length} {t.activeLabel}
                </span>
              </div>

              <div className="space-y-2">
                {(Object.keys(BUILDING_DEFINITIONS) as BuildingType[]).map((bType) => {
                  const bDef = BUILDING_DEFINITIONS[bType];
                  const hasBuilt = territory.buildings.includes(bType);
                  const localizedName = language === 'zh' ? buildingZhNames[bType]?.name : bDef.name;
                  const localizedDesc = language === 'zh' ? buildingZhNames[bType]?.desc : bDef.description;

                  return (
                    <div
                      key={bType}
                      className={`p-2.5 rounded-xl border transition-all ${
                        hasBuilt
                          ? 'bg-[#1e293b]/50 border-emerald-500/30'
                          : 'bg-[#131c2e]/60 border-[#d4af37]/20'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-[11px] text-[#faf6ed]">
                          {localizedName}
                        </span>
                        {hasBuilt ? (
                          <span className="text-[10px] text-emerald-400 font-semibold">
                            {t.constructed}
                          </span>
                        ) : (
                          <span className="text-[10px] text-amber-300 tabular-nums">
                            {bDef.cost} {t.gold}
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-[#e2d5b8]/70 mb-1.5 leading-relaxed">
                        {localizedDesc}
                      </p>
                      <div className="text-[9px] text-[#d4af37] font-medium mb-1">
                        {t.bonusLabel} {bDef.bonus}
                      </div>

                      {!hasBuilt && (
                        <button
                          disabled={playerGold < bDef.cost}
                          onClick={() => onUpgradeBuilding(territory.id, bType)}
                          className="w-full py-1 bg-[#d4af37]/20 hover:bg-[#d4af37]/30 disabled:opacity-30 disabled:pointer-events-none text-[#faf6ed] border border-[#d4af37]/40 rounded font-semibold text-[10px] transition-colors flex items-center justify-center gap-1"
                        >
                          <Hammer className="w-3 h-3 text-[#d4af37]" />
                          <span>{t.constructForGold.replace('{cost}', String(bDef.cost))}</span>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {/* RIVAL OR NEUTRAL COMMANDS: If owned by rival */}
        {!isPlayerOwned && ownerRival && (
          <div className="space-y-3">
            <div className="bg-[#131c2e] p-3 rounded-xl border border-[#d4af37]/30">
              <div className="text-[10px] text-[#e2d5b8]/70 mb-1 font-medium">{t.lordDisposition}</div>
              <p className="italic text-[11px] text-[#faf6ed] mb-2">"{ownerRival.quote}"</p>
              <div className="flex justify-between items-center text-[11px]">
                <span>{t.diplomaticStatus}</span>
                <span className={`font-semibold capitalize ${
                  ownerRival.diplomaticStatus === 'war' ? 'text-red-400' :
                  ownerRival.diplomaticStatus === 'alliance' ? 'text-emerald-400' : 'text-amber-300'
                }`}>
                  {ownerRival.diplomaticStatus.replace('_', ' ')}
                </span>
              </div>
            </div>

            <button
              onClick={() => onOpenDiplomacyWithLord(ownerRival.id)}
              className="w-full py-2 bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-600 hover:to-indigo-600 text-white font-cinzel font-bold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-1.5"
            >
              <span>{t.dispatchEnvoyTo.replace('{name}', getLordDisplayName(ownerRival.name))}</span>
              <ArrowUpRight className="w-4 h-4" />
            </button>

            {ownerRival.diplomaticStatus !== 'war' && (
              <div className="p-2.5 rounded-lg bg-amber-950/40 border border-amber-600/30 text-[10px] text-amber-200/90 flex items-start gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>{t.warWarning.replace('{house}', getHouseDisplayName(ownerRival.houseName))}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
