import React, { useState } from 'react';
import { PlayerHouse } from '../types/game';
import { PLAYER_HOUSES } from '../game/initialData';
import { Language, TRANSLATIONS } from '../i18n/translations';
import { Crown, Shield, Coins, Wheat, Check, Sparkles } from 'lucide-react';

interface HouseSelectionModalProps {
  onSelectHouse: (selectedHouse: PlayerHouse) => void;
  language?: Language;
  onToggleLanguage?: (lang: Language) => void;
}

export const HouseSelectionModal: React.FC<HouseSelectionModalProps> = ({
  onSelectHouse,
  language = 'en',
  onToggleLanguage,
}) => {
  const [selectedHouseId, setSelectedHouseId] = useState<string>('house_sterling');
  const [customLeaderName, setCustomLeaderName] = useState<string>('');

  const t = TRANSLATIONS[language];
  const activeHouse = PLAYER_HOUSES.find((h) => h.id === selectedHouseId) || PLAYER_HOUSES[0];

  const getHouseDisplayName = (id: string) => {
    if (language !== 'zh') {
      return id === 'house_sterling' ? 'House Sterling' : id === 'house_valen' ? 'House Valen' : 'House Morwen';
    }
    return id === 'house_sterling' ? '斯特林家族' : id === 'house_valen' ? '瓦伦家族' : '莫温家族';
  };

  const getHouseTitle = (id: string) => {
    if (language !== 'zh') {
      return id === 'house_sterling'
        ? 'High Bailiff of the Coast'
        : id === 'house_valen'
        ? 'Warden of the Iron Peaks'
        : 'Matron of the River Valley';
    }
    return id === 'house_sterling'
      ? '高港大都督'
      : id === 'house_valen'
      ? '铁峰守望者'
      : '河谷女主公';
  };

  const getHouseDesc = (id: string) => {
    if (language !== 'zh') {
      return id === 'house_sterling'
        ? '+25% Gold revenue from taxes and trade agreements.'
        : id === 'house_valen'
        ? '+20% Soldier attack strength and reduced troop upkeep.'
        : '+30% Granary harvest yields and faster population growth.';
    }
    return id === 'house_sterling'
      ? '沿海通商贸易之王：赋税与外贸路线金币收益增加 25%。'
      : id === 'house_valen'
      ? '山民军纪与坚阵：三军征召攻击力增加 20%，降低常备开销。'
      : '沃野千里万顷粮仓：当季田亩粮饷收获增加 30%，人口滋养繁盛。';
  };

  const handleConfirm = () => {
    const finalHouse: PlayerHouse = {
      ...activeHouse,
      leaderName: customLeaderName.trim() || activeHouse.leaderName,
    };
    onSelectHouse(finalHouse);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#090d16]/95 flex items-center justify-center p-4 backdrop-blur-xl animate-in fade-in duration-300">
      <div className="bg-[#0e1626] border-2 border-[#d4af37]/80 rounded-3xl max-w-4xl w-full shadow-2xl overflow-hidden flex flex-col text-[#e2d5b8] max-h-[95vh]">
        {/* Heraldic Title Header */}
        <div className="text-center py-6 px-6 bg-gradient-to-b from-[#182642] to-[#0e1626] border-b border-[#d4af37]/40 relative">
          {/* Language Switcher in Header */}
          {onToggleLanguage && (
            <div className="absolute top-4 right-6 flex items-center bg-[#131c2e] border border-[#d4af37]/50 rounded-lg p-0.5 shadow-md">
              <button
                onClick={() => onToggleLanguage('en')}
                className={`px-2 py-1 rounded text-xs font-semibold transition-all ${
                  language === 'en'
                    ? 'bg-[#d4af37] text-[#090d16] font-bold shadow'
                    : 'text-[#e2d5b8]/70 hover:text-white'
                }`}
              >
                EN
              </button>
              <button
                onClick={() => onToggleLanguage('zh')}
                className={`px-2 py-1 rounded text-xs font-semibold transition-all ${
                  language === 'zh'
                    ? 'bg-[#d4af37] text-[#090d16] font-bold shadow'
                    : 'text-[#e2d5b8]/70 hover:text-white'
                }`}
              >
                中文
              </button>
            </div>
          )}

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#d4af37]/20 border border-[#d4af37]/50 text-[#d4af37] text-xs font-cinzel font-bold mb-2">
            <Crown className="w-3.5 h-3.5" />
            <span>{t.grandStrategySandbox}</span>
          </div>
          <h1 className="font-cinzel font-black text-3xl sm:text-4xl text-[#faf6ed] tracking-wider">
            {t.gameTitle}
          </h1>
          <p className="text-xs sm:text-sm text-[#e2d5b8]/80 max-w-lg mx-auto mt-1">
            {t.selectHouseSubtitle}
          </p>
        </div>

        {/* 3 Houses Selector Grid */}
        <div className="p-6 overflow-y-auto space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {PLAYER_HOUSES.map((house) => {
              const isSelected = house.id === selectedHouseId;

              return (
                <div
                  key={house.id}
                  onClick={() => setSelectedHouseId(house.id)}
                  className={`relative p-5 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                    isSelected
                      ? 'bg-[#182642] border-[#d4af37] shadow-xl scale-[1.02]'
                      : 'bg-[#121c2e]/60 border-[#d4af37]/25 hover:border-[#d4af37]/60 hover:bg-[#152033]'
                  }`}
                >
                  {/* Selected check badge */}
                  {isSelected && (
                    <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-[#d4af37] text-[#090d16] flex items-center justify-center shadow">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  )}

                  <div>
                    {/* Sigil Icon */}
                    <div
                      className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shadow-lg border border-white/20 mb-4"
                      style={{ backgroundColor: house.color }}
                    >
                      {house.sigil === 'Eagle' ? '🦅' : house.sigil === 'Dragon' ? '🐉' : '🦌'}
                    </div>

                    <h3 className="font-cinzel font-bold text-lg text-[#faf6ed]">
                      {getHouseDisplayName(house.id)}
                    </h3>
                    <div className="text-xs text-[#d4af37] font-medium mb-3">
                      {getHouseTitle(house.id)}
                    </div>

                    <p className="text-xs text-[#e2d5b8]/70 leading-relaxed mb-4">
                      {getHouseDesc(house.id)}
                    </p>
                  </div>

                  {/* House Trait Specialty Badge */}
                  <div className="pt-3 border-t border-[#d4af37]/20 flex items-center gap-2 text-xs font-semibold">
                    {house.sigil === 'Eagle' && (
                      <span className="flex items-center gap-1.5 text-amber-300">
                        <Coins className="w-4 h-4" /> {language === 'zh' ? '+25% 金币收入' : '+25% Gold Income'}
                      </span>
                    )}
                    {house.sigil === 'Dragon' && (
                      <span className="flex items-center gap-1.5 text-red-300">
                        <Shield className="w-4 h-4" /> {language === 'zh' ? '+20% 军力攻击' : '+20% Attack & Levies'}
                      </span>
                    )}
                    {house.sigil === 'Stag' && (
                      <span className="flex items-center gap-1.5 text-emerald-300">
                        <Wheat className="w-4 h-4" /> {language === 'zh' ? '+30% 粮仓收获' : '+30% Granary Harvest'}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Customize Ruler Details */}
          <div className="bg-[#121c2e] p-4 rounded-2xl border border-[#d4af37]/30 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="w-full sm:w-auto">
              <label className="block text-xs font-cinzel font-semibold text-[#d4af37] mb-1">
                {t.rulerSovereignName}
              </label>
              <input
                type="text"
                placeholder={activeHouse.leaderName}
                value={customLeaderName}
                onChange={(e) => setCustomLeaderName(e.target.value)}
                className="w-full sm:w-72 px-3 py-2 bg-[#090d16] border border-[#d4af37]/40 rounded-xl text-sm text-[#faf6ed] focus:outline-none focus:border-[#d4af37]"
              />
            </div>

            <button
              onClick={handleConfirm}
              className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-[#d4af37] to-[#b59226] hover:brightness-110 active:scale-95 text-[#090d16] font-cinzel font-bold text-sm tracking-wide rounded-2xl shadow-2xl transition-all flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>{t.crownHouseButton}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
