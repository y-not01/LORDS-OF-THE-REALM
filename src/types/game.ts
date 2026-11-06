export type BiomeType = 'plains' | 'hills' | 'mountains' | 'riverland' | 'forest' | 'coast';

export type BuildingType = 'castleKeep' | 'stoneWalls' | 'marketSquare' | 'barracks' | 'granary';

export interface BuildingInfo {
  type: BuildingType;
  name: string;
  level: number;
  cost: number;
  description: string;
  bonus: string;
}

export interface Territory {
  id: string;
  name: string;
  ownerId: string; // Lord ID
  position: { x: number; z: number };
  biome: BiomeType;
  population: number;
  defense: number; // 10 - 100
  taxRate: 'low' | 'moderate' | 'harsh';
  goldYield: number;
  foodYield: number;
  buildings: BuildingType[];
  garrison: number;
  connectedTo: string[]; // Neighboring territory IDs
}

export type LordPersonality = 'aggressive' | 'diplomatic' | 'opportunistic' | 'imperial';

export type DiplomaticStatus = 'alliance' | 'non_aggression' | 'peace' | 'truce' | 'war';

export interface RivalLord {
  id: string;
  name: string;
  title: string;
  houseName: string;
  color: string; // Hex color for territory & banners
  accentColor: string;
  personality: LordPersonality;
  personalityDesc: string;
  quote: string;
  strategicObjective: string;
  portraitIcon: string;
  opinion: number; // -100 to 100
  diplomaticStatus: DiplomaticStatus;
  gold: number;
  soldiers: number;
  territories: string[]; // territory IDs
  tradeActive: boolean;
  tributeReceived: number;
}

export interface PlayerHouse {
  id: string;
  houseName: string;
  leaderName: string;
  leaderTitle: string;
  color: string;
  accentColor: string;
  sigil: string;
  bonusTitle: string;
  bonusDescription: string;
  goldBonus: number; // Multiplier, e.g. 1.25
  militaryBonus: number;
  foodBonus: number;
}

export interface GameResources {
  gold: number;
  food: number;
  population: number;
  soldiers: number;
  prestige: number;
}

export interface Army {
  id: string;
  ownerId: string;
  name: string;
  size: number;
  morale: number; // 0 - 100
  veterancy: 'Levies' | 'Men-at-Arms' | 'Royal Knights';
  position: { x: number; z: number };
  targetTerritoryId: string | null;
  originTerritoryId: string;
  isMarching: boolean;
  marchProgress: number; // 0 to 1
  path: Array<{ x: number; z: number }>;
}

export interface BattleState {
  id: string;
  territoryId: string;
  territoryName: string;
  attackerOwnerId: string;
  defenderOwnerId: string;
  attackerArmyId?: string;
  defenderArmyId?: string;
  attackerName: string;
  defenderName: string;
  attackerColor: string;
  defenderColor: string;
  attackerCount: number;
  defenderCount: number;
  initialAttackerCount: number;
  initialDefenderCount: number;
  attackerMorale: number;
  defenderMorale: number;
  terrainType: BiomeType;
  wallLevel: number;
  attackerStance: 'charge' | 'flank' | 'skirmish' | 'balanced';
  defenderStance: 'shield_wall' | 'archers' | 'counter_attack' | 'balanced';
  round: number;
  log: string[];
  winner?: string; // Lord ID
  isResolved: boolean;
}

export interface EventOption {
  text: string;
  consequence: string;
  impact: {
    gold?: number;
    food?: number;
    soldiers?: number;
    prestige?: number;
    stability?: number;
    opinionTargetLordId?: string;
    opinionDelta?: number;
  };
}

export interface EventDilemma {
  id: string;
  title: string;
  description: string;
  category: string;
  options: EventOption[];
}

export interface ChronicleEntry {
  id: string;
  year: number;
  season: 'Spring' | 'Summer' | 'Autumn' | 'Winter';
  title: string;
  detail: string;
  category: 'war' | 'diplomacy' | 'event' | 'conquest' | 'economic';
}
