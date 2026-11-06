import React, { useState } from 'react';
import { RivalLord, PlayerHouse, GameResources } from '../types/game';
import { Language, TRANSLATIONS } from '../i18n/translations';
import {
  Scroll,
  X,
  Swords,
  Coins,
  ShieldCheck,
  Handshake,
  AlertOctagon,
  Crown,
  Send,
  MessageSquare,
} from 'lucide-react';

interface DiplomacyModalProps {
  rivalLords: RivalLord[];
  activeLordId: string;
  playerHouse: PlayerHouse;
  playerResources: GameResources;
  onClose: () => void;
  onSendGift: (lordId: string, goldAmount: number) => void;
  onProposeTreaty: (lordId: string, treatyType: 'non_aggression' | 'alliance' | 'trade') => void;
  onDemandTribute: (lordId: string) => void;
  onDeclareWar: (lordId: string) => void;
  onSueForPeace: (lordId: string) => void;
  language?: Language;
}

export const DiplomacyModal: React.FC<DiplomacyModalProps> = ({
  rivalLords,
  activeLordId,
  playerHouse,
  playerResources,
  onClose,
  onSendGift,
  onProposeTreaty,
  onDemandTribute,
  onDeclareWar,
  onSueForPeace,
  language = 'en',
}) => {
  const [selectedLordId, setSelectedLordId] = useState<string>(activeLordId || rivalLords[0]?.id || '');
  const [lastDiplomaticMessage, setLastDiplomaticMessage] = useState<string | null>(null);

  const t = TRANSLATIONS[language];
  const activeLord = rivalLords.find((r) => r.id === selectedLordId) || rivalLords[0];

  if (!activeLord) return null;

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

  const getLordTitle = (title: string) => {
    if (language !== 'zh') return title;
    if (title === 'The Iron Boar') return '铁野猪';
    if (title === 'The Golden Swan') return '金天鹅';
    if (title === 'The Shadow Raven') return '幽鸦之影';
    if (title === 'The High Sovereign') return '至高君主';
    return title;
  };

  const getPersonalityZh = (p: string) => {
    if (language !== 'zh') return p;
    if (p === 'aggressive') return '骁勇好战';
    if (p === 'diplomatic') return '老练谋略';
    if (p === 'opportunistic') return '多疑伺隙';
    if (p === 'imperial') return '霸道君威';
    return p;
  };

  const getQuoteZh = (id: string, quote: string) => {
    if (language !== 'zh') return quote;
    if (id === 'lord_edmund') return '弱者寄望纸面条约，而强者用寒铁划定疆界。';
    if (id === 'lady_eleanor') return '一支商旅车队所系之两国同心，胜过千柄屯边矛戟。';
    if (id === 'lord_blackwood') return '利刃当磨，誓言如水。寒冬从不会怜悯多情之人。';
    if (id === 'king_aldric') return '王国的一草一木皆由王家敕令而立。按律纳贡，方保封邑长治久安。';
    return quote;
  };

  const handlePropose = (type: 'non_aggression' | 'alliance' | 'trade') => {
    const lordName = getLordDisplayName(activeLord.name);
    if (type === 'trade') {
      if (activeLord.personality === 'diplomatic' || activeLord.opinion >= 0) {
        setLastDiplomaticMessage(
          language === 'zh'
            ? `${lordName}: “愿黄金在两大家族间流淌！通商文书已签盖王家宝玺。”`
            : `${activeLord.name}: "Let royal gold flow between our houses! The trade charter is sealed."`
        );
        onProposeTreaty(activeLord.id, 'trade');
      } else {
        setLastDiplomaticMessage(
          language === 'zh'
            ? `${lordName}: “在信任建立之前，我们的市集不需要外邦商贩。”`
            : `${activeLord.name}: "Our markets have no need of foreign peddlers until our trust is proven."`
        );
      }
    } else if (type === 'non_aggression') {
      if (activeLord.opinion >= 10 || (activeLord.personality === 'opportunistic' && playerResources.soldiers >= activeLord.soldiers)) {
        setLastDiplomaticMessage(
          language === 'zh'
            ? `${lordName}: “甚好。边塞烽燧暂熄，愿两大家族恪守此誓约。”`
            : `${activeLord.name}: "Very well. Our borders shall remain inviolate for now. May both houses honor this oath."`
        );
        onProposeTreaty(activeLord.id, 'non_aggression');
      } else {
        setLastDiplomaticMessage(
          language === 'zh'
            ? `${lordName}: “若无压倒性军力与声望，本领主绝不轻易封鞘。”`
            : `${activeLord.name}: "A lord does not bind his sword unless compelled by overwhelming respect or steel."`
        );
      }
    } else if (type === 'alliance') {
      if (activeLord.opinion >= 45 && activeLord.diplomaticStatus !== 'war') {
        setLastDiplomaticMessage(
          language === 'zh'
            ? `${lordName}: “奉王冠与神圣祭坛之名，三军同袍，患难与共！同盟誓约已昭告天下！”`
            : `${activeLord.name}: "By the crown and the altar, our armies shall march as one! Our alliance is proclaimed."`
        );
        onProposeTreaty(activeLord.id, 'alliance');
      } else {
        setLastDiplomaticMessage(
          language === 'zh'
            ? `${lordName}: “缔结同盟需深厚情谊。若想并肩出征，请先提升主公之威望。”`
            : `${activeLord.name}: "An alliance requires deep fidelity. Raise your renown before seeking our holy standard."`
        );
      }
    }
  };

  const handleDemandTributeClick = () => {
    const lordName = getLordDisplayName(activeLord.name);
    if (playerResources.soldiers > activeLord.soldiers * 1.2) {
      setLastDiplomaticMessage(
        language === 'zh'
          ? `${lordName}: “迫于贵军兵威，我们暂且献上岁贡...但此等奇耻大辱，我等绝不会忘。”`
          : `${activeLord.name}: "Grudgingly, we offer this gold to preserve our lands from your legions... but we will remember this insult."`
      );
      onDemandTribute(activeLord.id);
    } else {
      setLastDiplomaticMessage(
        language === 'zh'
          ? `${lordName}: “狂妄匹夫！竟敢向${getHouseDisplayName(activeLord.houseName)}勒索岁贡？备好棺椁吧，战火将至！”`
          : `${activeLord.name}: "Insolent upstart! You dare demand tribute from ${activeLord.houseName}? Steel your garrison, for this insult invites war!"`
      );
    }
  };

  const handleGiftClick = () => {
    const lordName = getLordDisplayName(activeLord.name);
    if (playerResources.gold >= 50) {
      setLastDiplomaticMessage(
        language === 'zh'
          ? `${lordName}: “贵国使节送抵的沉甸金币已盛大陈列于议事大殿，两家关系已大为融洽。”`
          : `${activeLord.name}: "Your golden embassy has been graciously received at our great hall. Relations have softened."`
      );
      onSendGift(activeLord.id, 50);
    }
  };

  return (
    <div className="fixed inset-0 z-40 bg-black/70 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#0d1527] border border-[#d4af37]/50 rounded-2xl max-w-3xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-[#e2d5b8]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#d4af37]/30 flex items-center justify-between bg-[#131c2e]">
          <div className="flex items-center gap-3">
            <Scroll className="w-6 h-6 text-[#d4af37]" />
            <div>
              <h2 className="font-cinzel font-bold text-lg text-[#faf6ed]">
                {t.diplomaticChamber}
              </h2>
              <p className="text-xs text-[#e2d5b8]/70">
                {t.diplomaticDesc}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#e2d5b8]/70 hover:text-white hover:bg-[#1e293b] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Lord Selector Tabs */}
        <div className="grid grid-cols-4 border-b border-[#d4af37]/20 bg-[#090d16]">
          {rivalLords.map((lord) => {
            const isSelected = lord.id === selectedLordId;
            return (
              <button
                key={lord.id}
                onClick={() => {
                  setSelectedLordId(lord.id);
                  setLastDiplomaticMessage(null);
                }}
                className={`py-3 px-2 flex flex-col items-center gap-1 transition-all border-b-2 ${
                  isSelected
                    ? 'border-[#d4af37] bg-[#131c2e] text-[#faf6ed]'
                    : 'border-transparent text-[#e2d5b8]/60 hover:text-white hover:bg-[#0f172a]'
                }`}
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-sm shadow border border-white/20"
                  style={{ backgroundColor: lord.color }}
                >
                  {lord.portraitIcon}
                </div>
                <span className="font-cinzel font-semibold text-xs truncate max-w-[120px]">
                  {getLordDisplayName(lord.name)}
                </span>
                <span className="text-[10px] text-[#e2d5b8]/50 capitalize">
                  {lord.diplomaticStatus === 'war' ? (language === 'zh' ? '交战' : 'War') :
                   lord.diplomaticStatus === 'alliance' ? (language === 'zh' ? '同盟' : 'Alliance') :
                   lord.diplomaticStatus === 'non_aggression' ? (language === 'zh' ? '互不侵犯' : 'Non-aggression') :
                   (language === 'zh' ? '和平' : 'Peace')}
                </span>
              </button>
            );
          })}
        </div>

        {/* Selected Lord Dossier & Actions */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Lord Banner Summary */}
          <div
            className="p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            style={{
              backgroundColor: `${activeLord.color}15`,
              borderColor: `${activeLord.color}60`,
            }}
          >
            <div className="flex items-center gap-4">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-xl border-2 border-[#d4af37]"
                style={{ backgroundColor: activeLord.color }}
              >
                {activeLord.portraitIcon}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-cinzel font-bold text-lg text-[#faf6ed]">
                    {getLordDisplayName(activeLord.name)}
                  </h3>
                  <span className="text-xs px-2 py-0.5 rounded bg-black/40 border border-[#d4af37]/40 text-[#d4af37]">
                    {getLordTitle(activeLord.title)}
                  </span>
                </div>
                <div className="text-xs text-[#e2d5b8]/80 font-medium">
                  {getHouseDisplayName(activeLord.houseName)} · <span className="capitalize">{getPersonalityZh(activeLord.personality)}</span>
                </div>
                <p className="text-xs italic text-[#e2d5b8]/70 mt-1">"{getQuoteZh(activeLord.id, activeLord.quote)}"</p>
              </div>
            </div>

            {/* Opinion Meter */}
            <div className="w-full sm:w-44 bg-[#090d16]/70 p-3 rounded-xl border border-[#d4af37]/20">
              <div className="flex justify-between items-center text-xs mb-1">
                <span className="text-[#e2d5b8]/70">{t.lordsFavor}</span>
                <span className={`font-bold tabular-nums ${
                  activeLord.opinion > 30 ? 'text-emerald-400' : activeLord.opinion < -20 ? 'text-red-400' : 'text-amber-300'
                }`}>
                  {activeLord.opinion > 0 ? `+${activeLord.opinion}` : activeLord.opinion}
                </span>
              </div>
              <div className="w-full bg-[#1e293b] rounded-full h-2 overflow-hidden">
                <div
                  className={`h-full transition-all ${
                    activeLord.opinion > 30 ? 'bg-emerald-500' : activeLord.opinion < -20 ? 'bg-red-500' : 'bg-amber-500'
                  }`}
                  style={{ width: `${Math.max(5, Math.min(100, ((activeLord.opinion + 100) / 200) * 100))}%` }}
                />
              </div>
            </div>
          </div>

          {/* Strategic Stats */}
          <div className="grid grid-cols-3 gap-3 text-xs">
            <div className="bg-[#131c2e] p-3 rounded-xl border border-[#d4af37]/20">
              <div className="text-[10px] text-[#e2d5b8]/60">{t.militaryForce}</div>
              <div className="font-bold text-sm text-red-300 tabular-nums">
                {activeLord.soldiers} {t.soldiers}
              </div>
              <div className="text-[10px] text-[#e2d5b8]/50">
                vs {playerResources.soldiers}
              </div>
            </div>

            <div className="bg-[#131c2e] p-3 rounded-xl border border-[#d4af37]/20">
              <div className="text-[10px] text-[#e2d5b8]/60">{t.treasury}</div>
              <div className="font-bold text-sm text-amber-300 tabular-nums">
                {activeLord.gold} {t.gold}
              </div>
              <div className="text-[10px] text-[#e2d5b8]/50">
                {activeLord.tradeActive ? t.tradeActive : t.noTrade}
              </div>
            </div>

            <div className="bg-[#131c2e] p-3 rounded-xl border border-[#d4af37]/20">
              <div className="text-[10px] text-[#e2d5b8]/60">{t.navRealm}</div>
              <div className="font-bold text-sm text-sky-300">
                {activeLord.territories.length} {t.fiefdomsUnit}
              </div>
              <div className="text-[10px] text-[#e2d5b8]/50 capitalize">
                {activeLord.strategicObjective}
              </div>
            </div>
          </div>

          {/* Dynamic Dialogue Response Banner */}
          {lastDiplomaticMessage && (
            <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-500/40 text-xs text-amber-200 leading-relaxed flex items-start gap-2 animate-in fade-in">
              <MessageSquare className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span>{lastDiplomaticMessage}</span>
            </div>
          )}

          {/* Diplomatic Actions Grid */}
          <div>
            <h4 className="font-cinzel font-semibold text-xs text-[#d4af37] mb-2.5">
              {t.availableDecrees}
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Send Gift */}
              <button
                disabled={playerResources.gold < 50}
                onClick={handleGiftClick}
                className="p-3 bg-[#131c2e] hover:bg-[#1a263d] disabled:opacity-40 disabled:pointer-events-none border border-[#d4af37]/30 rounded-xl text-left flex items-center justify-between group transition-all"
              >
                <div className="flex items-center gap-2.5">
                  <Coins className="w-5 h-5 text-amber-400 group-hover:scale-110 transition-transform" />
                  <div>
                    <div className="font-cinzel font-semibold text-xs text-[#faf6ed]">
                      {t.sendGiftTitle}
                    </div>
                    <div className="text-[10px] text-[#e2d5b8]/60">{t.sendGiftDesc}</div>
                  </div>
                </div>
                <Send className="w-4 h-4 text-[#d4af37]" />
              </button>

              {/* Establish Trade */}
              <button
                disabled={activeLord.tradeActive}
                onClick={() => handlePropose('trade')}
                className="p-3 bg-[#131c2e] hover:bg-[#1a263d] disabled:opacity-40 disabled:pointer-events-none border border-[#d4af37]/30 rounded-xl text-left flex items-center justify-between group transition-all"
              >
                <div className="flex items-center gap-2.5">
                  <Handshake className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition-transform" />
                  <div>
                    <div className="font-cinzel font-semibold text-xs text-[#faf6ed]">
                      {activeLord.tradeActive ? t.tradeRouteActive : t.tradeRouteTitle}
                    </div>
                    <div className="text-[10px] text-[#e2d5b8]/60">{t.tradeRouteDesc}</div>
                  </div>
                </div>
                <Send className="w-4 h-4 text-emerald-400" />
              </button>

              {/* Non-Aggression Pact */}
              <button
                disabled={activeLord.diplomaticStatus === 'non_aggression' || activeLord.diplomaticStatus === 'alliance'}
                onClick={() => handlePropose('non_aggression')}
                className="p-3 bg-[#131c2e] hover:bg-[#1a263d] disabled:opacity-40 disabled:pointer-events-none border border-[#d4af37]/30 rounded-xl text-left flex items-center justify-between group transition-all"
              >
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="w-5 h-5 text-sky-400 group-hover:scale-110 transition-transform" />
                  <div>
                    <div className="font-cinzel font-semibold text-xs text-[#faf6ed]">
                      {t.nonAggressionTitle}
                    </div>
                    <div className="text-[10px] text-[#e2d5b8]/60">{t.nonAggressionDesc}</div>
                  </div>
                </div>
                <Send className="w-4 h-4 text-sky-400" />
              </button>

              {/* Military Alliance */}
              <button
                disabled={activeLord.diplomaticStatus === 'alliance'}
                onClick={() => handlePropose('alliance')}
                className="p-3 bg-[#131c2e] hover:bg-[#1a263d] disabled:opacity-40 disabled:pointer-events-none border border-[#d4af37]/30 rounded-xl text-left flex items-center justify-between group transition-all"
              >
                <div className="flex items-center gap-2.5">
                  <Crown className="w-5 h-5 text-yellow-400 group-hover:scale-110 transition-transform" />
                  <div>
                    <div className="font-cinzel font-semibold text-xs text-[#faf6ed]">
                      {t.allianceTitle}
                    </div>
                    <div className="text-[10px] text-[#e2d5b8]/60">{t.allianceDesc}</div>
                  </div>
                </div>
                <Send className="w-4 h-4 text-yellow-400" />
              </button>

              {/* Demand Tribute */}
              <button
                onClick={handleDemandTributeClick}
                className="p-3 bg-[#131c2e] hover:bg-[#1a263d] border border-amber-600/40 rounded-xl text-left flex items-center justify-between group transition-all"
              >
                <div className="flex items-center gap-2.5">
                  <AlertOctagon className="w-5 h-5 text-amber-500 group-hover:scale-110 transition-transform" />
                  <div>
                    <div className="font-cinzel font-semibold text-xs text-[#faf6ed]">
                      {t.demandTributeTitle}
                    </div>
                    <div className="text-[10px] text-[#e2d5b8]/60">{t.demandTributeDesc}</div>
                  </div>
                </div>
                <Send className="w-4 h-4 text-amber-400" />
              </button>

              {/* War / Peace */}
              {activeLord.diplomaticStatus === 'war' ? (
                <button
                  onClick={() => onSueForPeace(activeLord.id)}
                  className="p-3 bg-emerald-950/50 hover:bg-emerald-900/60 border border-emerald-500/50 rounded-xl text-left flex items-center justify-between transition-all"
                >
                  <div className="flex items-center gap-2.5">
                    <Handshake className="w-5 h-5 text-emerald-400" />
                    <div>
                      <div className="font-cinzel font-semibold text-xs text-emerald-200">
                        {t.sueForPeaceTitle}
                      </div>
                      <div className="text-[10px] text-emerald-300/70">{t.sueForPeaceDesc}</div>
                    </div>
                  </div>
                  <Send className="w-4 h-4 text-emerald-400" />
                </button>
              ) : (
                <button
                  onClick={() => onDeclareWar(activeLord.id)}
                  className="p-3 bg-red-950/60 hover:bg-red-900/70 border border-red-600/60 rounded-xl text-left flex items-center justify-between transition-all"
                >
                  <div className="flex items-center gap-2.5">
                    <Swords className="w-5 h-5 text-red-400" />
                    <div>
                      <div className="font-cinzel font-semibold text-xs text-red-200">
                        {t.declareWarTitle}
                      </div>
                      <div className="text-[10px] text-red-300/70">{t.declareWarDesc}</div>
                    </div>
                  </div>
                  <Send className="w-4 h-4 text-red-400" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
