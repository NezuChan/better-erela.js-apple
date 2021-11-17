import { LoadType, Manager, Plugin, SearchResult, UnresolvedTrack } from "erela.js";
export declare class AppleMusic extends Plugin {
    manager: Manager;
    regex: RegExp;
    private _search;
    private readonly functions;
    load(manager: Manager): void;
    private search;
    private getAlbum;
    private getArtist;
    private getPlaylist;
    private getTrack;
    private static convertToUnresolved;
    static buildSearch(loadType: LoadType, tracks: UnresolvedTrack[], error: string, name: string): SearchResult;
}
//# sourceMappingURL=Plugin.d.ts.map