import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  GameResources,
  PlayerHouse,
  RivalLord,
  Territory,
  Army,
  BattleState,
  EventDilemma,
  EventOption,
  ChronicleEntry,
  BuildingType,
} from './types/game';
import { Language } from './i18n/translations';
import {
  PLAYER_HOUSES,
  INITIAL_RIVAL_LORDS,
  INITIAL_TERRITORIES,
  BUILDING_DEFINITIONS,
} from './game/initialData';
import { StrategyWorldMap } from './game/threeMap/StrategyWorldMap';
import { TopBar } from './components/TopBar';
import { BottomDock, ActiveDockTab } from './components/BottomDock';
import { ProvinceDossier } from './components/ProvinceDossier';
import { DiplomacyModal } from './components/DiplomacyModal';
import { TacticalBattleModal } from './components/TacticalBattleModal';
import { EventDilemmaModal } from './components/EventDilemmaModal';
import { HouseSelectionModal } from './components/HouseSelectionModal';
import { CouncilModals } from './components/CouncilModals';

export default function App() {
  // Internationalization State
  const [language, setLanguage] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem('lords_language');
      return saved === 'zh' || saved === 'en' ? (saved as Language) : 'en';
    } catch {
      return 'en';
    }
  });

  const handleToggleLanguage = (lang: Language) => {
    setLanguage(lang);
    try {
      localStorage.setItem('lords_language', lang);
    } catch {}
  };

  // Game Setup & Player House
  const [gameStarted, setGameStarted] = useState(false);
  const [playerHouse, setPlayerHouse] = useState<PlayerHouse>(PLAYER_HOUSES[0]);

  // Feudal Resources & Realm Vitality
  const [resources, setResources] = useState<GameResources>({
    gold: 320,
    food: 240,
    population: 7600,
    soldiers: 180,
    prestige: 60,
  });
  const [stability, setStability] = useState<number>(85);

  // Time & Simulation Speed
  const [season, setSeason] = useState<'Spring' | 'Summer' | 'Autumn' | 'Winter'>('Spring');
  const [year, setYear] = useState<number>(1192);
  const [gameSpeed, setGameSpeed] = useState<number>(1); // 0: pause, 1: 1x, 2: 2x

  // Territories & Rival Lords
  const [territories, setTerritories] = useState<Territory[]>(INITIAL_TERRITORIES);
  const [rivalLords, setRivalLords] = useState<RivalLord[]>(INITIAL_RIVAL_LORDS);

  // Armies & Tactical Battles
  const [armies, setArmies] = useState<Army[]>([]);
  const [activeBattles, setActiveBattles] = useState<BattleState[]>([]);
  const [selectedTerritoryId, setSelectedTerritoryId] = useState<string | null>('highport');
  const [isDispatchingArmy, setIsDispatchingArmy] = useState<boolean>(false);

  // Modals & Panels
  const [activeDockTab, setActiveDockTab] = useState<ActiveDockTab>('none');
  const [activeDiplomacyLordId, setActiveDiplomacyLordId] = useState<string | null>(null);
  const [activeDilemmaEvent, setActiveDilemmaEvent] = useState<EventDilemma | null>(null);

  // Historical Realm Annals
  const [chronicle, setChronicle] = useState<ChronicleEntry[]>([
    {
      id: 'c-0',
      year: 1192,
      season: 'Spring',
      title: 'Coronation of the Sovereign',
      detail: 'The bells of the high cathedral rang across the realm as the new sovereign was anointed upon the throne.',
      category: 'event',
    },
  ]);

  // Compute Seasonal Incomes
  const playerTerritories = territories.filter((t) => t.ownerId === 'player');
  const baseGoldIncome = Math.floor(
    playerTerritories.reduce((acc, t) => {
      let multiplier = 1.0;
      if (t.taxRate === 'low') multiplier = 0.75;
      if (t.taxRate === 'harsh') multiplier = 1.4;
      return acc + t.goldYield * multiplier;
    }, 0) * playerHouse.goldBonus
  );
  const tradeIncome = rivalLords.filter((r) => r.tradeActive).length * 25;
  const armyUpkeep = Math.floor(resources.soldiers * 0.12);
  const goldNetChange = baseGoldIncome + tradeIncome - armyUpkeep;

  const seasonFoodMultiplier = season === 'Winter' ? 0.45 : season === 'Autumn' ? 1.4 : 1.0;
  const baseFoodIncome = Math.floor(
    playerTerritories.reduce((acc, t) => acc + t.foodYield, 0) *
      playerHouse.foodBonus *
      seasonFoodMultiplier
  );
  const foodConsumption = Math.floor(resources.population * 0.0075);
  const foodNetChange = baseFoodIncome - foodConsumption;

  // Add Chronicle Helper
  const addChronicleEntry = useCallback(
    (title: string, detail: string, category: 'war' | 'diplomacy' | 'event' | 'conquest' | 'economic') => {
      setChronicle((prev) => [
        {
          id: `c-${Date.now()}-${Math.random()}`,
          year,
          season,
          title,
          detail,
          category,
        },
        ...prev,
      ]);
    },
    [year, season]
  );

  // Trigger Dynamic Narrative Event
  const triggerDynamicEvent = useCallback(async () => {
    try {
      const response = await fetch('/api/chronicle/event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameState: {
            playerHouse,
            resources,
            stability,
            season,
            year,
            rivalLords,
          },
          language,
        }),
      });
      const data = await response.json();
      if (data?.success && data?.event) {
        setActiveDilemmaEvent({
          id: `dilemma-${Date.now()}`,
          ...data.event,
        });
      }
    } catch (err) {
      console.warn('Could not fetch dilemma event:', err);
    }
  }, [playerHouse, resources, stability, season, year, rivalLords, language]);

  // Advance Season / Turn Execution
  const advanceTurn = useCallback(() => {
    const nextSeasons: Record<'Spring' | 'Summer' | 'Autumn' | 'Winter', 'Spring' | 'Summer' | 'Autumn' | 'Winter'> = {
      Spring: 'Summer',
      Summer: 'Autumn',
      Autumn: 'Winter',
      Winter: 'Spring',
    };
    const nextSeason = nextSeasons[season];
    const nextYear = season === 'Winter' ? year + 1 : year;

    setSeason(nextSeason);
    setYear(nextYear);

    // Apply Resource Changes
    setResources((prev) => {
      const newGold = Math.max(0, prev.gold + goldNetChange);
      const newFood = Math.max(0, prev.food + foodNetChange);

      // Population growth if food positive; famine if food 0
      let popDelta = Math.floor(prev.population * 0.015);
      if (newFood === 0) {
        popDelta = -Math.floor(prev.population * 0.04);
      }

      const newPop = Math.max(500, prev.population + popDelta);
      return {
        ...prev,
        gold: newGold,
        food: newFood,
        population: newPop,
      };
    });

    // Stability natural drift & famine check
    setStability((prev) => {
      let delta = 0;
      if (foodNetChange < 0) delta -= 4;
      if (goldNetChange < 0) delta -= 2;
      return Math.max(10, Math.min(100, prev + delta));
    });

    // AI Lord Turn Actions (recruitment, gold accumulation, occasional military maneuvers)
    setRivalLords((prevLords) =>
      prevLords.map((lord) => {
        const addedGold = 40 + (lord.tradeActive ? 25 : 0);
        const recruitedSoldiers = Math.floor(addedGold * 0.35);

        // Opportunistic Lord Blackwood / Aggressive Lord Edmund aggression check
        if (lord.diplomaticStatus === 'war' && Math.random() > 0.6) {
          // Find adjacent player territory to raid
          const targetTerritory = territories.find(
            (t) => t.ownerId === 'player' && t.connectedTo.some((cId) => lord.territories.includes(cId))
          );
          if (targetTerritory) {
            // Dispatch enemy raid army
            const enemyArmy: Army = {
              id: `enemy-army-${Date.now()}-${Math.random()}`,
              ownerId: lord.id,
              name: `${lord.houseName} Vanguard`,
              size: Math.min(lord.soldiers, 75),
              morale: 80,
              veterancy: 'Men-at-Arms',
              position: { x: targetTerritory.position.x + 2, z: targetTerritory.position.z + 2 },
              targetTerritoryId: targetTerritory.id,
              originTerritoryId: lord.territories[0] || '',
              isMarching: true,
              marchProgress: 0.1,
              path: [targetTerritory.position],
            };
            setArmies((armiesPrev) => [...armiesPrev, enemyArmy]);
            addChronicleEntry(
              `${lord.name} Mobilizes Invasion`,
              `Hostile banners of ${lord.houseName} march toward the borders of ${targetTerritory.name}!`,
              'war'
            );
          }
        }

        return {
          ...lord,
          gold: lord.gold + addedGold,
          soldiers: lord.soldiers + recruitedSoldiers,
        };
      })
    );

    // Dynamic Storytelling Event Trigger (Every 2-3 seasons or low stability)
    if (Math.random() > 0.4 || stability < 40) {
      triggerDynamicEvent();
    }
  }, [
    season,
    year,
    goldNetChange,
    foodNetChange,
    territories,
    stability,
    triggerDynamicEvent,
    addChronicleEntry,
  ]);

  // Real-time Army Marching & Game Speed Interval
  useEffect(() => {
    if (!gameStarted || gameSpeed === 0) return;

    // Seasonal clock tick based on speed
    const turnIntervalTime = gameSpeed === 1 ? 16000 : 8000;
    const turnTimer = setInterval(() => {
      advanceTurn();
    }, turnIntervalTime);

    // Fast movement ticker for armies (every 100ms)
    const marchTimer = setInterval(() => {
      setArmies((prevArmies) => {
        let hasChanges = false;
        const nextArmies: Army[] = [];

        prevArmies.forEach((army) => {
          if (!army.isMarching || !army.targetTerritoryId) {
            nextArmies.push(army);
            return;
          }

          const targetT = territories.find((t) => t.id === army.targetTerritoryId);
          if (!targetT) {
            nextArmies.push(army);
            return;
          }

          hasChanges = true;
          const newProgress = army.marchProgress + 0.04 * gameSpeed;

          // Interpolate coordinate toward target
          const currentX = army.position.x + (targetT.position.x - army.position.x) * 0.08;
          const currentZ = army.position.z + (targetT.position.z - army.position.z) * 0.08;

          if (newProgress >= 1.0) {
            // Army reached target destination!
            if (targetT.ownerId === army.ownerId || (army.ownerId === 'player' && targetT.ownerId === 'player')) {
              // Reinforce garrison
              setTerritories((prevT) =>
                prevT.map((t) => (t.id === targetT.id ? { ...t, garrison: t.garrison + army.size } : t))
              );
              addChronicleEntry(
                'Troops Arrive at Garrison',
                `${army.name} arrived at ${targetT.name} and reinforced the local garrison with ${army.size} men.`,
                'economic'
              );
            } else {
              // Hostile clash / siege!
              const defenderLord = rivalLords.find((r) => r.id === targetT.ownerId);
              const defenderName = targetT.ownerId === 'player'
                ? playerHouse.houseName
                : defenderLord
                ? defenderLord.houseName
                : 'Neutral Defenders';

              const attackerLord = rivalLords.find((r) => r.id === army.ownerId);
              const attackerName = army.ownerId === 'player' ? playerHouse.houseName : attackerLord ? attackerLord.houseName : 'Raiding Force';

              // If at peace, auto declare war
              if (army.ownerId === 'player' && defenderLord && defenderLord.diplomaticStatus !== 'war') {
                setRivalLords((lords) =>
                  lords.map((l) => (l.id === defenderLord.id ? { ...l, diplomaticStatus: 'war', opinion: -60 } : l))
                );
              }

              const newBattle: BattleState = {
                id: `battle-${Date.now()}`,
                territoryId: targetT.id,
                territoryName: targetT.name,
                attackerOwnerId: army.ownerId,
                defenderOwnerId: targetT.ownerId,
                attackerArmyId: army.id,
                attackerName,
                defenderName,
                attackerColor: army.ownerId === 'player' ? playerHouse.color : attackerLord?.color || '#b91c1c',
                defenderColor: targetT.ownerId === 'player' ? playerHouse.color : defenderLord?.color || '#2563eb',
                attackerCount: army.size,
                defenderCount: targetT.garrison,
                initialAttackerCount: army.size,
                initialDefenderCount: targetT.garrison,
                attackerMorale: 85,
                defenderMorale: 90,
                terrainType: targetT.biome,
                wallLevel: targetT.defense,
                attackerStance: 'balanced',
                defenderStance: 'shield_wall',
                round: 1,
                log: [
                  `War horns sound as ${attackerName} assaults the ramparts of ${targetT.name}!`,
                  `Defenders take positions along the palisades and stone keeps.`,
                ],
                isResolved: false,
              };

              setActiveBattles((prevBattles) => [...prevBattles, newBattle]);
              addChronicleEntry(
                `Siege of ${targetT.name}`,
                `A fierce engagement has commenced at ${targetT.name} between ${attackerName} and ${defenderName}!`,
                'war'
              );
            }
          } else {
            nextArmies.push({
              ...army,
              marchProgress: newProgress,
              position: { x: currentX, z: currentZ },
            });
          }
        });

        return hasChanges ? nextArmies : prevArmies;
      });
    }, 100);

    return () => {
      clearInterval(turnTimer);
      clearInterval(marchTimer);
    };
  }, [
    gameStarted,
    gameSpeed,
    advanceTurn,
    territories,
    rivalLords,
    playerHouse,
    addChronicleEntry,
  ]);

  // Tactical Battle Command Execution
  const handleExecuteBattleCommand = useCallback(
    (command: 'charge' | 'flank' | 'skirmish' | 'shield_wall' | 'retreat') => {
      setActiveBattles((prevBattles) =>
        prevBattles.map((battle) => {
          if (battle.isResolved) return battle;

          let atkLoss = 0;
          let defLoss = 0;
          let atkMoraleDelta = 0;
          let defMoraleDelta = 0;
          let actionLog = '';

          if (command === 'charge') {
            defLoss = Math.floor(Math.random() * 22 + 18);
            atkLoss = Math.floor(Math.random() * 16 + 12);
            defMoraleDelta = -14;
            atkMoraleDelta = -6;
            actionLog = `Heavy frontal charge crash! Steel clashes against shield; ${defLoss} defenders fell, while ${atkLoss} attackers were lost.`;
          } else if (command === 'shield_wall') {
            defLoss = Math.floor(Math.random() * 8 + 4);
            atkLoss = Math.floor(Math.random() * 14 + 8);
            defMoraleDelta = 4;
            atkMoraleDelta = -8;
            actionLog = `Shield wall locks tight! Pikes thrust outward, blunting the assault and inflicting ${atkLoss} casualties.`;
          } else if (command === 'flank') {
            defLoss = Math.floor(Math.random() * 26 + 14);
            atkLoss = Math.floor(Math.random() * 12 + 6);
            defMoraleDelta = -20;
            atkMoraleDelta = 2;
            actionLog = `Outflanking cavalry sweep through the rear! Defenders panic under the mounted charge.`;
          } else if (command === 'skirmish') {
            defLoss = Math.floor(Math.random() * 15 + 10);
            atkLoss = Math.floor(Math.random() * 6 + 2);
            defMoraleDelta = -10;
            atkMoraleDelta = 0;
            actionLog = `Rains of bodkin arrows fall from above! Steady attrition thins the enemy lines.`;
          } else if (command === 'retreat') {
            actionLog = `The commander sounds the horn of tactical retreat, preserving surviving forces!`;
            return {
              ...battle,
              isResolved: true,
              winner: battle.defenderOwnerId,
              log: [...battle.log, actionLog, `${battle.defenderName} successfully repelled the invaders!`],
            };
          }

          const newAtkCount = Math.max(0, battle.attackerCount - atkLoss);
          const newDefCount = Math.max(0, battle.defenderCount - defLoss);
          const newAtkMorale = Math.max(0, Math.min(100, battle.attackerMorale + atkMoraleDelta));
          const newDefMorale = Math.max(0, Math.min(100, battle.defenderMorale + defMoraleDelta));

          let isResolved = false;
          let winner: string | undefined = undefined;

          if (newDefCount <= 0 || newDefMorale <= 0) {
            isResolved = true;
            winner = battle.attackerOwnerId;
            actionLog += ` The defenders have broken! ${battle.attackerName} claims total victory!`;
          } else if (newAtkCount <= 0 || newAtkMorale <= 0) {
            isResolved = true;
            winner = battle.defenderOwnerId;
            actionLog += ` The attackers are routed and driven from the field!`;
          }

          return {
            ...battle,
            attackerCount: newAtkCount,
            defenderCount: newDefCount,
            attackerMorale: newAtkMorale,
            defenderMorale: newDefMorale,
            round: battle.round + 1,
            log: [...battle.log, actionLog],
            isResolved,
            winner,
          };
        })
      );
    },
    []
  );

  // Conclude Battle & Apply Territorial Conquest
  const handleResolveBattle = useCallback(
    (battleId: string, winnerOwnerId: string) => {
      const battle = activeBattles.find((b) => b.id === battleId);
      if (!battle) return;

      if (winnerOwnerId === battle.attackerOwnerId) {
        // Attacker conquers territory!
        setTerritories((prevT) =>
          prevT.map((t) =>
            t.id === battle.territoryId
              ? {
                  ...t,
                  ownerId: winnerOwnerId,
                  garrison: Math.max(25, battle.attackerCount),
                }
              : t
          )
        );

        if (winnerOwnerId === 'player') {
          setResources((r) => ({ ...r, prestige: r.prestige + 35 }));
          setStability((s) => Math.min(100, s + 10));
          addChronicleEntry(
            `Conquest of ${battle.territoryName}`,
            `The victorious banners of ${playerHouse.houseName} now fly proudly above the keep of ${battle.territoryName}!`,
            'conquest'
          );
        } else {
          addChronicleEntry(
            `Fall of ${battle.territoryName}`,
            `${battle.attackerName} has conquered ${battle.territoryName} after a brutal siege.`,
            'conquest'
          );
        }
      } else {
        // Defender held territory
        setTerritories((prevT) =>
          prevT.map((t) =>
            t.id === battle.territoryId
              ? { ...t, garrison: Math.max(15, battle.defenderCount) }
              : t
          )
        );
        addChronicleEntry(
          `Garrison Holds at ${battle.territoryName}`,
          `The defenders of ${battle.territoryName} held against the furious siege!`,
          'war'
        );
      }

      // Remove battle and army
      setActiveBattles((prev) => prev.filter((b) => b.id !== battleId));
      if (battle.attackerArmyId) {
        setArmies((prev) => prev.filter((a) => a.id !== battle.attackerArmyId));
      }
    },
    [activeBattles, playerHouse, addChronicleEntry]
  );

  // Mobilize / March Army from a province
  const handleStartMarchArmy = (territoryId: string) => {
    setIsDispatchingArmy(true);
    setSelectedTerritoryId(territoryId);
  };

  const handleDispatchArmyToTarget = (originId: string, targetId: string) => {
    setIsDispatchingArmy(false);
    if (originId === targetId) return;

    const originT = territories.find((t) => t.id === originId);
    const targetT = territories.find((t) => t.id === targetId);
    if (!originT || !targetT) return;

    // Check connectivity
    if (!originT.connectedTo.includes(targetId)) {
      alert(`Roads do not directly connect ${originT.name} to ${targetT.name}. March through neighboring territories.`);
      return;
    }

    const availableGarrison = originT.garrison;
    if (availableGarrison < 25) {
      alert(`Garrison too low to mobilize a campaign army. Recruit more levies first.`);
      return;
    }

    const marchSize = Math.floor(availableGarrison * 0.7);
    // Deduct garrison from origin
    setTerritories((prev) =>
      prev.map((t) => (t.id === originId ? { ...t, garrison: t.garrison - marchSize } : t))
    );

    const newArmy: Army = {
      id: `army-${Date.now()}`,
      ownerId: 'player',
      name: `${playerHouse.houseName} Royal Host`,
      size: marchSize,
      morale: 95,
      veterancy: 'Men-at-Arms',
      position: { ...originT.position },
      originTerritoryId: originId,
      targetTerritoryId: targetId,
      isMarching: true,
      marchProgress: 0,
      path: [originT.position, targetT.position],
    };

    setArmies((prev) => [...prev, newArmy]);
    addChronicleEntry(
      'Royal Host Dispatched',
      `${newArmy.name} (${marchSize} soldiers) dispatched from ${originT.name} toward ${targetT.name}.`,
      'war'
    );
  };

  // Province Upgrade Construction
  const handleUpgradeBuilding = (territoryId: string, building: BuildingType) => {
    const cost = BUILDING_DEFINITIONS[building].cost;
    if (resources.gold < cost) return;

    setResources((prev) => ({ ...prev, gold: prev.gold - cost }));
    setTerritories((prev) =>
      prev.map((t) => {
        if (t.id !== territoryId) return t;
        const newBuildings = [...t.buildings, building];
        let defBonus = 0;
        let goldBonus = 0;
        let foodBonus = 0;

        if (building === 'castleKeep') defBonus += 20;
        if (building === 'stoneWalls') defBonus += 30;
        if (building === 'marketSquare') goldBonus += 25;
        if (building === 'granary') foodBonus += 25;

        return {
          ...t,
          buildings: newBuildings,
          defense: Math.min(100, t.defense + defBonus),
          goldYield: t.goldYield + goldBonus,
          foodYield: t.foodYield + foodBonus,
        };
      })
    );

    addChronicleEntry(
      `Structure Completed in ${territories.find((t) => t.id === territoryId)?.name}`,
      `The master masons completed construction of ${BUILDING_DEFINITIONS[building].name}.`,
      'economic'
    );
  };

  // Change Tax Rate
  const handleChangeTaxRate = (territoryId: string, taxRate: 'low' | 'moderate' | 'harsh') => {
    setTerritories((prev) =>
      prev.map((t) => (t.id === territoryId ? { ...t, taxRate } : t))
    );
  };

  // Recruit Levies
  const handleRecruitLevy = (territoryId: string, count: number) => {
    const cost = count * 1;
    if (resources.gold < cost) return;

    setResources((prev) => ({
      ...prev,
      gold: prev.gold - cost,
      soldiers: prev.soldiers + count,
    }));

    setTerritories((prev) =>
      prev.map((t) => (t.id === territoryId ? { ...t, garrison: t.garrison + count } : t))
    );
  };

  // Diplomacy Actions
  const handleSendGift = (lordId: string, goldAmount: number) => {
    if (resources.gold < goldAmount) return;
    setResources((prev) => ({ ...prev, gold: prev.gold - goldAmount, prestige: prev.prestige + 10 }));
    setRivalLords((prev) =>
      prev.map((l) => (l.id === lordId ? { ...l, opinion: Math.min(100, l.opinion + 20) } : l))
    );
    const lord = rivalLords.find((r) => r.id === lordId);
    addChronicleEntry(
      `Diplomatic Gift to ${lord?.name}`,
      `A royal delegation delivered chests containing ${goldAmount} gold to ${lord?.houseName}, warming relations.`,
      'diplomacy'
    );
  };

  const handleProposeTreaty = (lordId: string, treatyType: 'non_aggression' | 'alliance' | 'trade') => {
    setRivalLords((prev) =>
      prev.map((l) => {
        if (l.id !== lordId) return l;
        if (treatyType === 'trade') return { ...l, tradeActive: true, opinion: l.opinion + 15 };
        if (treatyType === 'non_aggression') return { ...l, diplomaticStatus: 'non_aggression', opinion: l.opinion + 10 };
        if (treatyType === 'alliance') return { ...l, diplomaticStatus: 'alliance', opinion: l.opinion + 30 };
        return l;
      })
    );
    const lord = rivalLords.find((r) => r.id === lordId);
    addChronicleEntry(
      `Treaty Sealed with ${lord?.name}`,
      `The great seal of ${playerHouse.houseName} was affixed to a royal ${treatyType.replace('_', ' ')} with ${lord?.houseName}.`,
      'diplomacy'
    );
  };

  const handleDemandTribute = (lordId: string) => {
    const tribute = 40;
    setResources((r) => ({ ...r, gold: r.gold + tribute, prestige: r.prestige + 20 }));
    setRivalLords((prev) =>
      prev.map((l) =>
        l.id === lordId
          ? { ...l, gold: Math.max(0, l.gold - tribute), opinion: Math.max(-100, l.opinion - 30) }
          : l
      )
    );
    const lord = rivalLords.find((r) => r.id === lordId);
    addChronicleEntry(
      `Tribute Extracted from ${lord?.name}`,
      `Under threat of arms, ${lord?.name} grudgingly yielded ${tribute} gold in tribute to our crown!`,
      'diplomacy'
    );
  };

  const handleDeclareWar = (lordId: string) => {
    setRivalLords((prev) =>
      prev.map((l) =>
        l.id === lordId
          ? { ...l, diplomaticStatus: 'war', opinion: -80, tradeActive: false }
          : l
      )
    );
    const lord = rivalLords.find((r) => r.id === lordId);
    addChronicleEntry(
      `Declaration of War on ${lord?.name}`,
      `Heralds galloped to the court of ${lord?.houseName} declaring holy and feudal warfare!`,
      'war'
    );
  };

  const handleSueForPeace = (lordId: string) => {
    setRivalLords((prev) =>
      prev.map((l) => (l.id === lordId ? { ...l, diplomaticStatus: 'peace', opinion: -10 } : l))
    );
    const lord = rivalLords.find((r) => r.id === lordId);
    addChronicleEntry(
      `Truce with ${lord?.name}`,
      `Weapons were sheathed as a negotiated peace was declared between ${playerHouse.houseName} and ${lord?.houseName}.`,
      'diplomacy'
    );
  };

  // Dilemma Option Selection
  const handleSelectDilemmaOption = (option: EventOption) => {
    const { gold, food, soldiers, prestige, stability: stabMod } = option.impact;

    setResources((prev) => ({
      ...prev,
      gold: Math.max(0, prev.gold + (gold || 0)),
      food: Math.max(0, prev.food + (food || 0)),
      soldiers: Math.max(0, prev.soldiers + (soldiers || 0)),
      prestige: Math.max(0, prev.prestige + (prestige || 0)),
    }));

    if (stabMod) {
      setStability((prev) => Math.max(0, Math.min(100, prev + stabMod)));
    }

    if (activeDilemmaEvent) {
      addChronicleEntry(
        `Royal Decree: ${activeDilemmaEvent.title}`,
        option.consequence,
        'event'
      );
    }

    setActiveDilemmaEvent(null);
  };

  const selectedTerritory = territories.find((t) => t.id === selectedTerritoryId);
  const activeWarCount = rivalLords.filter((l) => l.diplomaticStatus === 'war').length;

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#090d16] text-[#e2d5b8] flex flex-col font-sans select-none">
      {/* Starting House Selection Modal */}
      {!gameStarted && (
        <HouseSelectionModal
          language={language}
          onToggleLanguage={handleToggleLanguage}
          onSelectHouse={(house) => {
            setPlayerHouse(house);
            setGameStarted(true);
            addChronicleEntry(
              language === 'zh' ? '开创封建王朝' : 'Dynasty Established',
              language === 'zh'
                ? `${house.leaderName} 登临王位，统御 ${house.houseName}。${house.bonusDescription}`
                : `${house.leaderName} of ${house.houseName} assumed sovereign rule. ${house.bonusDescription}`,
              'event'
            );
          }}
        />
      )}

      {/* Top HUD Bar */}
      <TopBar
        resources={resources}
        season={season}
        year={year}
        gameSpeed={gameSpeed}
        stability={stability}
        playerHouse={playerHouse}
        onSetGameSpeed={setGameSpeed}
        onAdvanceTurn={advanceTurn}
        goldNetChange={goldNetChange}
        foodNetChange={foodNetChange}
        language={language}
        onToggleLanguage={handleToggleLanguage}
      />

      {/* 3D World Map (Main Center Viewport) */}
      <main className="relative flex-1 w-full h-full overflow-hidden">
        <StrategyWorldMap
          territories={territories}
          armies={armies}
          activeBattles={activeBattles}
          selectedTerritoryId={selectedTerritoryId}
          playerHouse={playerHouse}
          rivalLords={rivalLords}
          onSelectTerritory={(tId) => setSelectedTerritoryId(tId)}
          onDispatchArmy={handleDispatchArmyToTarget}
          isDispatchingArmy={isDispatchingArmy}
          language={language}
        />

        {/* Selected Province Dossier (Right Drawer) */}
        {selectedTerritory && (
          <ProvinceDossier
            territory={selectedTerritory}
            playerHouse={playerHouse}
            rivalLords={rivalLords}
            playerGold={resources.gold}
            allTerritories={territories}
            onClose={() => setSelectedTerritoryId(null)}
            onUpgradeBuilding={handleUpgradeBuilding}
            onChangeTaxRate={handleChangeTaxRate}
            onRecruitLevy={handleRecruitLevy}
            onStartMarchArmy={handleStartMarchArmy}
            onOpenDiplomacyWithLord={(lordId) => setActiveDiplomacyLordId(lordId)}
            isDispatchingArmy={isDispatchingArmy}
            language={language}
          />
        )}
      </main>

      {/* Collapsible Unified Bottom Dock (Zero Center Viewport Occlusion) */}
      <BottomDock
        activeTab={activeDockTab}
        onSelectTab={(tab) => {
          if (tab === 'diplomacy') {
            setActiveDiplomacyLordId(rivalLords[0].id);
          } else {
            setActiveDockTab(tab);
          }
        }}
        activeWarCount={activeWarCount}
        language={language}
      />

      {/* Realm / Economy / Military / Chronicle Modals */}
      <CouncilModals
        activeTab={activeDockTab}
        onClose={() => setActiveDockTab('none')}
        territories={territories}
        armies={armies}
        rivalLords={rivalLords}
        chronicle={chronicle}
        resources={resources}
        playerHouse={playerHouse}
        onSelectTerritory={(tId) => setSelectedTerritoryId(tId)}
        onOpenDiplomacy={(lordId) => {
          setActiveDockTab('none');
          setActiveDiplomacyLordId(lordId);
        }}
        onMobilizeArmy={(territoryId, size) => {
          const originT = territories.find((t) => t.id === territoryId);
          if (!originT || originT.connectedTo.length === 0) return;
          const targetId = originT.connectedTo[0];
          handleDispatchArmyToTarget(territoryId, targetId);
        }}
        language={language}
      />

      {/* Feudal Diplomacy Modal with AI Rival Lords */}
      {activeDiplomacyLordId && (
        <DiplomacyModal
          rivalLords={rivalLords}
          activeLordId={activeDiplomacyLordId}
          playerHouse={playerHouse}
          playerResources={resources}
          onClose={() => setActiveDiplomacyLordId(null)}
          onSendGift={handleSendGift}
          onProposeTreaty={handleProposeTreaty}
          onDemandTribute={handleDemandTribute}
          onDeclareWar={handleDeclareWar}
          onSueForPeace={handleSueForPeace}
          language={language}
        />
      )}

      {/* Real-time Tactical Battle Theater Modal */}
      {activeBattles.length > 0 && (
        <TacticalBattleModal
          battle={activeBattles[0]}
          onExecuteCommand={handleExecuteBattleCommand}
          onResolveBattle={handleResolveBattle}
          onClose={() => {
            const b = activeBattles[0];
            if (b.isResolved && b.winner) {
              handleResolveBattle(b.id, b.winner);
            } else {
              handleExecuteBattleCommand('retreat');
            }
          }}
          language={language}
        />
      )}

      {/* Dynamic Feudal Dilemma Modal */}
      {activeDilemmaEvent && (
        <EventDilemmaModal
          event={activeDilemmaEvent}
          onSelectOption={handleSelectDilemmaOption}
          language={language}
        />
      )}
    </div>
  );
}
