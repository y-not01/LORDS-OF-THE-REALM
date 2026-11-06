import React from 'react';
import { EventDilemma, EventOption } from '../types/game';
import { Language, TRANSLATIONS } from '../i18n/translations';
import {
  Crown,
  ChevronRight,
  Coins,
  Wheat,
  Shield,
  Flame,
} from 'lucide-react';

interface EventDilemmaModalProps {
  event: EventDilemma;
  onSelectOption: (option: EventOption) => void;
  language?: Language;
}

export const EventDilemmaModal: React.FC<EventDilemmaModalProps> = ({
  event,
  onSelectOption,
  language = 'en',
}) => {
  const t = TRANSLATIONS[language];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#0e1626] border-2 border-[#d4af37] rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col text-[#e2d5b8]">
        {/* Top Ornate Medieval Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-[#17233d] to-[#0e1626] border-b border-[#d4af37]/40 flex items-center gap-3">
          <div className="p-2.5 bg-[#d4af37]/20 border border-[#d4af37]/60 rounded-2xl text-[#d4af37]">
            <Crown className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-cinzel font-semibold uppercase tracking-widest text-[#d4af37]">
              {t.royalDilemma} · {event.category}
            </span>
            <h2 className="font-cinzel font-bold text-xl text-[#faf6ed] mt-0.5">
              {event.title}
            </h2>
          </div>
        </div>

        {/* Narrative Vignette Prose */}
        <div className="p-6 bg-[#090d16] border-b border-[#d4af37]/20">
          <p className="text-sm text-[#e8dcbe] leading-relaxed font-serif italic border-l-2 border-[#d4af37]/40 pl-4 py-1">
            "{event.description}"
          </p>
        </div>

        {/* Decision Options */}
        <div className="p-6 space-y-3 bg-[#0e1626]">
          <div className="font-cinzel font-semibold text-xs text-[#d4af37] mb-2">
            {t.judgmentRequired}
          </div>

          {event.options.map((option, idx) => {
            const { gold, food, soldiers, prestige, stability } = option.impact;

            return (
              <button
                key={idx}
                onClick={() => onSelectOption(option)}
                className="w-full p-4 bg-[#141f36] hover:bg-[#1c2c4d] border border-[#d4af37]/30 hover:border-[#d4af37] rounded-2xl text-left transition-all group shadow-md flex items-center justify-between gap-4"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="font-cinzel font-semibold text-sm text-[#faf6ed] group-hover:text-[#d4af37] transition-colors">
                    {option.text}
                  </div>
                  <div className="text-xs text-[#e2d5b8]/70 italic">
                    {t.consequencePrefix} {option.consequence}
                  </div>

                  {/* Impact preview pill badges */}
                  <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px]">
                    {gold !== undefined && gold !== 0 && (
                      <span className={`flex items-center gap-1 font-semibold ${gold > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        <Coins className="w-3.5 h-3.5 text-amber-400" />
                        <span>{gold > 0 ? `+${gold}` : gold} {t.gold}</span>
                      </span>
                    )}

                    {food !== undefined && food !== 0 && (
                      <span className={`flex items-center gap-1 font-semibold ${food > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        <Wheat className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{food > 0 ? `+${food}` : food} {t.food}</span>
                      </span>
                    )}

                    {soldiers !== undefined && soldiers !== 0 && (
                      <span className={`flex items-center gap-1 font-semibold ${soldiers > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        <Shield className="w-3.5 h-3.5 text-red-400" />
                        <span>{soldiers > 0 ? `+${soldiers}` : soldiers} {t.soldiers}</span>
                      </span>
                    )}

                    {prestige !== undefined && prestige !== 0 && (
                      <span className={`flex items-center gap-1 font-semibold ${prestige > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        <Crown className="w-3.5 h-3.5 text-yellow-400" />
                        <span>{prestige > 0 ? `+${prestige}` : prestige} {t.prestige}</span>
                      </span>
                    )}

                    {stability !== undefined && stability !== 0 && (
                      <span className={`flex items-center gap-1 font-semibold ${stability > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        <Flame className="w-3.5 h-3.5 text-orange-400" />
                        <span>{stability > 0 ? `+${stability}%` : `${stability}%`} {t.stability}</span>
                      </span>
                    )}
                  </div>
                </div>

                <div className="w-8 h-8 rounded-full bg-[#1e293b] flex items-center justify-center text-[#d4af37] group-hover:bg-[#d4af37] group-hover:text-[#090d16] transition-all shrink-0">
                  <ChevronRight className="w-4 h-4" />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
