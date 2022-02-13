import { LoadType, SearchResult, UnresolvedTrack } from 'erela.js';
import { resolver } from '../resolver';
import { AppleMusicTrack } from '../types';
export declare abstract class BaseManager {
    resolver: resolver;
    baseURL: string;
    cache: Map<string, {
        tracks: AppleMusicTrack[];
        name?: string;
    }>;
    constructor(resolver: resolver);
    abstract fetch(id: string, requester: unknown): Promise<SearchResult>;
    checkFromCache(id: string, requester: unknown): Promise<SearchResult | undefined>;
    buildSearch(loadType: LoadType, tracks: UnresolvedTrack[] | undefined, error: string | undefined, name: string | undefined): SearchResult;
    autoResolveTrack(tracks: UnresolvedTrack[]): Promise<UnresolvedTrack[]>;
    buildUnresolved(track: AppleMusicTrack): Omit<UnresolvedTrack, 'resolve'>;
}
//# sourceMappingURL=BaseManager.d.ts.map