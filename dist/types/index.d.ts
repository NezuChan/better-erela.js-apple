import { UnresolvedTrack } from "erela.js";
export interface Result {
    tracks: UnresolvedTrack[];
    name?: string;
}
export interface SearchResult {
    exception?: {
        severity: string;
        message: string;
    } | null;
    loadType: string;
    playlist?: {
        duration: number;
        name: string;
    } | null;
    tracks: UnresolvedTrack[];
}
//# sourceMappingURL=index.d.ts.map