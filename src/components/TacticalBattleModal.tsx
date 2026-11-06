import React, { useEffect, useState, useRef } from 'react';
import { BattleState } from '../types/game';
import { Language, TRANSLATIONS } from '../i18n/translations';
import {
  Swords,
  Shield,
  Flag,
  Crosshair,
  Flame,
  Award,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';

interface TacticalBattleModalProps {
  battle: BattleState;
  onExecuteCommand: (command: 'charge' | 'flank' | 'skirmish' | 'shield_wall' | 'retreat') => void;
  onResolveBattle: (battleId: string, winnerOwnerId: string) => void;
  onClose: () => void;
  language?: Language;
}

export const TacticalBattleModal: React.FC<TacticalBattleModalProps> = ({
  battle,
  onExecuteCommand,
  onResolveBattle,
  onClose,
  language = 'en',
}) => {
  const logEndRef = useRef<HTMLDivElement>(null);
  const [, setCombatTicker] = useState(0);
  const t = TRANSLATIONS[language];

  // Auto-scroll combat log
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [battle.log]);

  // Automated tick simulation if unresolved
  useEffect(() => {
    if (battle.isResolved) return;

    const timer = setInterval(() => {
      setCombatTicker((prev) => prev + 1);
    }, 1500);

    return () => clearInterval(timer);
  }, [battle.isResolved]);

  const attackerPercent = Math.max(0, Math.min(100, (battle.attackerCount / Math.max(1, battle.initialAttackerCount)) * 100));
  const defenderPercent = Math.max(0, Math.min(100, (battle.defenderCount / Math.max(1, battle.initialDefenderCount)) * 100));

  const stanceTranslations: Record<string, string> = {
    charge: language === 'zh' ? '冲锋猛攻' : 'charge',
    flank: language === 'zh' ? '侧翼奇袭' : 'flank',
    skirmish: language === 'zh' ? '长弓游击' : 'skirmish',
    shield_wall: language === 'zh' ? '坚固盾墙' : 'shield wall',
    archers: language === 'zh' ? '箭雨覆盖' : 'archers',
    counter_attack: language === 'zh' ? '防守反击' : 'counter attack',
    balanced: language === 'zh' ? '攻守兼备' : 'balanced',
  };

  const terrainZh: Record<string, string> = {
    plains: '平原',
    hills: '丘陵',
    mountains: '险峻山岳',
    riverland: '河流险滩',
    forest: '密林隘口',
    coast: '沿海平滩',
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#0b101c] border-2 border-[#d4af37]/60 rounded-3xl max-w-3xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[92vh] text-[#e2d5b8]">
        {/* Banner Clash Header */}
        <div className="relative px-6 py-4 bg-gradient-to-r from-red-950 via-[#131c2e] to-blue-950 border-b border-[#d4af37]/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-600/30 rounded-xl border border-red-500/50">
              <Swords className="w-6 h-6 text-red-400 animate-pulse" />
            </div>
            <div>
              <h2 className="font-cinzel font-black text-xl text-[#faf6ed] tracking-wider">
                {t.siegeOf.replace('{territory}', battle.territoryName)}
              </h2>
              <div className="text-xs text-[#d4af37]">
                {t.terrain} <span className="capitalize font-semibold">{language === 'zh' ? (terrainZh[battle.terrainType] || battle.terrainType) : battle.terrainType}</span> · {t.fortDefense}: {battle.wallLevel}
              </div>
            </div>
          </div>

          <div className="text-right">
            <span className="px-2.5 py-1 bg-black/50 border border-[#d4af37]/30 rounded-lg text-xs font-cinzel font-bold text-[#faf6ed]">
              {t.round.replace('{round}', String(battle.round))}
            </span>
          </div>
        </div>

        {/* Combatants Battle Theater Meters */}
        <div className="grid grid-cols-2 gap-4 p-6 bg-[#090d16] border-b border-[#d4af37]/20">
          {/* Attacker (Left) */}
          <div className="bg-[#131c2e]/70 p-4 rounded-2xl border border-red-500/30 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="font-cinzel font-bold text-sm text-red-300">
                  {battle.attackerName} ({t.attacker})
                </span>
                <span className="text-xs font-semibold tabular-nums text-red-200">
                  {battle.attackerCount} {language === 'zh' ? '人' : 'Men'}
                </span>
              </div>
              <div className="w-full bg-[#1e293b] rounded-full h-3 overflow-hidden mb-3 border border-red-900/40">
                <div
                  className="h-full bg-gradient-to-r from-red-600 to-rose-500 transition-all duration-300"
                  style={{ width: `${attackerPercent}%` }}
                />
              </div>

              {/* Morale bar */}
              <div className="flex justify-between text-[11px] text-[#e2d5b8]/70 mb-1">
                <span>{t.armyMorale}</span>
                <span className="font-bold text-red-400 tabular-nums">{battle.attackerMorale}%</span>
              </div>
              <div className="w-full bg-[#1e293b] rounded-full h-1.5 overflow-hidden">
                <div
                  className="h-full bg-red-400 transition-all duration-300"
                  style={{ width: `${battle.attackerMorale}%` }}
                />
              </div>
            </div>

            <div className="mt-3 pt-2 border-t border-white/5 text-[11px] text-[#e2d5b8]/70">
              {t.currentStance} <span className="text-white font-semibold capitalize">{stanceTranslations[battle.attackerStance] || battle.attackerStance}</span>
            </div>
          </div>

          {/* Defender (Right) */}
          <div className="bg-[#131c2e]/70 p-4 rounded-2xl border border-blue-500/30 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="font-cinzel font-bold text-sm text-blue-300">
                  {battle.defenderName} ({t.defender})
                </span>
                <span className="text-xs font-semibold tabular-nums text-blue-200">
                  {battle.defenderCount} {language === 'zh' ? '人' : 'Men'}
                </span>
              </div>
              <div className="w-full bg-[#1e293b] rounded-full h-3 overflow-hidden mb-3 border border-blue-900/40">
                <div
                  className="h-full bg-gradient-to-r from-blue-600 to-indigo-500 transition-all duration-300"
                  style={{ width: `${defenderPercent}%` }}
                />
              </div>

              {/* Morale bar */}
              <div className="flex justify-between text-[11px] text-[#e2d5b8]/70 mb-1">
                <span>{t.armyMorale}</span>
                <span className="font-bold text-blue-400 tabular-nums">{battle.defenderMorale}%</span>
              </div>
              <div className="w-full bg-[#1e293b] rounded-full h-1.5 overflow-hidden">
                <div
                  className="h-full bg-blue-400 transition-all duration-300"
                  style={{ width: `${battle.defenderMorale}%` }}
                />
              </div>
            </div>

            <div className="mt-3 pt-2 border-t border-white/5 text-[11px] text-[#e2d5b8]/70">
              {t.currentStance} <span className="text-white font-semibold capitalize">{stanceTranslations[battle.defenderStance] || battle.defenderStance}</span>
            </div>
          </div>
        </div>

        {/* Live Battle Chronicle Log */}
        <div className="flex-1 overflow-y-auto p-4 bg-[#0a0f1d] min-h-[160px] max-h-[220px] font-mono text-xs space-y-1.5">
          <div className="text-[#d4af37] font-cinzel font-semibold mb-2">
            {t.combatChronicle}
          </div>
          {battle.log.map((entry, idx) => (
            <div
              key={idx}
              className={`leading-relaxed ${
                entry.includes('Victory') || entry.includes('Conquest') || entry.includes('全胜') || entry.includes('大捷')
                  ? 'text-emerald-400 font-bold'
                  : entry.includes('Retreat') || entry.includes('slain') || entry.includes('撤退') || entry.includes('溃退')
                  ? 'text-red-400'
                  : entry.includes('Charge') || entry.includes('Flank') || entry.includes('冲锋') || entry.includes('包抄')
                  ? 'text-amber-300 font-semibold'
                  : 'text-[#e2d5b8]/80'
              }`}
            >
              <span className="text-[#e2d5b8]/40 mr-1.5">›</span>
              {entry}
            </div>
          ))}
          <div ref={logEndRef} />
        </div>

        {/* Tactical Command Bar or Battle Outcome */}
        <div className="p-5 bg-[#131c2e] border-t border-[#d4af37]/30">
          {!battle.isResolved ? (
            <div>
              <div className="flex justify-between items-center mb-2.5">
                <span className="font-cinzel font-bold text-xs text-[#d4af37]">
                  {t.orderManeuver}
                </span>
                <span className="text-[11px] text-[#e2d5b8]/60">
                  {t.selectManeuverHint}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                <button
                  onClick={() => onExecuteCommand('charge')}
                  className="py-2.5 px-2 bg-gradient-to-b from-red-800 to-red-900 hover:from-red-700 hover:to-red-800 border border-red-500/50 rounded-xl font-cinzel font-bold text-xs text-white shadow transition-all flex flex-col items-center gap-1 active:scale-95"
                >
                  <Flame className="w-4 h-4 text-amber-300" />
                  <span>{t.chargeBtn}</span>
                  <span className="text-[9px] font-sans text-red-200">{t.chargeSub}</span>
                </button>

                <button
                  onClick={() => onExecuteCommand('shield_wall')}
                  className="py-2.5 px-2 bg-[#1e293b] hover:bg-[#283852] border border-[#d4af37]/40 rounded-xl font-cinzel font-bold text-xs text-[#faf6ed] shadow transition-all flex flex-col items-center gap-1 active:scale-95"
                >
                  <Shield className="w-4 h-4 text-sky-400" />
                  <span>{t.shieldWallBtn}</span>
                  <span className="text-[9px] font-sans text-sky-200">{t.shieldWallSub}</span>
                </button>

                <button
                  onClick={() => onExecuteCommand('flank')}
                  className="py-2.5 px-2 bg-[#1e293b] hover:bg-[#283852] border border-[#d4af37]/40 rounded-xl font-cinzel font-bold text-xs text-[#faf6ed] shadow transition-all flex flex-col items-center gap-1 active:scale-95"
                >
                  <Crosshair className="w-4 h-4 text-emerald-400" />
                  <span>{t.flankBtn}</span>
                  <span className="text-[9px] font-sans text-emerald-200">{t.flankSub}</span>
                </button>

                <button
                  onClick={() => onExecuteCommand('skirmish')}
                  className="py-2.5 px-2 bg-[#1e293b] hover:bg-[#283852] border border-[#d4af37]/40 rounded-xl font-cinzel font-bold text-xs text-[#faf6ed] shadow transition-all flex flex-col items-center gap-1 active:scale-95"
                >
                  <ShieldAlert className="w-4 h-4 text-yellow-400" />
                  <span>{t.skirmishBtn}</span>
                  <span className="text-[9px] font-sans text-yellow-200">{t.skirmishSub}</span>
                </button>

                <button
                  onClick={() => onExecuteCommand('retreat')}
                  className="py-2.5 px-2 bg-stone-900 hover:bg-stone-800 border border-stone-600/50 rounded-xl font-cinzel font-bold text-xs text-stone-300 shadow transition-all flex flex-col items-center gap-1 active:scale-95"
                >
                  <Flag className="w-4 h-4 text-stone-400" />
                  <span>{t.retreatBtn}</span>
                  <span className="text-[9px] font-sans text-stone-400">{t.retreatSub}</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 animate-in zoom-in-95 duration-200">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#d4af37] to-[#b59226] flex items-center justify-center text-[#090d16] font-bold text-xl shadow">
                  <Award className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="font-cinzel font-black text-lg text-[#faf6ed]">
                    {battle.winner === 'player'
                      ? t.gloriousVictory
                      : t.isVictorious.replace(
                          '{name}',
                          battle.winner === battle.attackerOwnerId ? battle.attackerName : battle.defenderName
                        )}
                  </h3>
                  <p className="text-xs text-[#e2d5b8]/80">
                    {battle.winner === battle.attackerOwnerId
                      ? (language === 'zh' ? `进攻军团攻克了 ${battle.territoryName}！全境版图已改写。` : `The attacker has conquered ${battle.territoryName}! The realm's borders have shifted.`)
                      : (language === 'zh' ? `${battle.territoryName} 守军击退了来犯之敌，城关坚不可摧！` : `The fortress of ${battle.territoryName} has held strong against the assault!`)}
                  </p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="px-6 py-2.5 bg-gradient-to-r from-[#d4af37] to-[#b59226] text-[#090d16] font-cinzel font-bold text-sm rounded-xl shadow-xl hover:brightness-110 transition-all flex items-center gap-1.5 shrink-0"
              >
                <span>{t.concludeReturn}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
