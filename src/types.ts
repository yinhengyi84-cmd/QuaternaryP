import type { Feature, MultiPolygon, Polygon } from 'geojson';
export type FactionId = 'D' | 'S' | 'B' | 'P' | 'J' | 'Q';
export interface GazetteerRecord { code: string; ids: string[]; faction: string; europe: string; china: string; geography: string; lore: string; confidence: string; }
export interface Territory { id: string; sourceName: string; name: string; chineseName: string; faction: FactionId; iso: string; recordIds: string[]; match: 'direct' | 'inherited' | 'review'; note: string; }
export type TerritoryFeature = Feature<Polygon | MultiPolygon, { id: string }>;
export interface Source { iso: string; country: string; year: string; boundaryId: string; url: string; license: string; source: string; download: string; }
export interface AtlasData { schemaVersion: number; title: string; records: GazetteerRecord[]; territories: Territory[]; sources: Source[]; reconciliation: { code: string; territoryIds: string[]; status: string; note: string }[]; }
export interface AtlasGeometry { type: 'FeatureCollection'; features: TerritoryFeature[]; }
export interface City { id: string; territoryId: string; recordCode: string; name: string; europe: string; coordinates: [number, number]; role: 'capital' | 'major'; }
export interface CityData { schemaVersion: number; cities: City[]; }
