import type { CharacterId } from './opening-characters';

export type AppRoute = 'opening' | 'choose' | 'draw' | 'play' | 'atlas';

export function resolveAppRoute(hash: string, characterId: CharacterId | null): AppRoute {
  const routes: AppRoute[] = ['opening', 'choose', 'draw', 'play', 'atlas'];
  const route = routes.find(item => hash === `#/${item}`) ?? 'opening';
  return route === 'play' && !characterId ? 'opening' : route;
}
