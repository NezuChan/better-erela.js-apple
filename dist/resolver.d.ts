import { AppleMusic } from "./Plugin";
import { MusicVideoManager, PlaylistManager, AlbumManager, ArtistManager } from "./Manager/index";
export declare class resolver {
    plugin: AppleMusic;
    constructor(plugin: AppleMusic);
    token: string | undefined;
    resolveManager: {
        "music-video": MusicVideoManager;
        playlist: PlaylistManager;
        album: AlbumManager;
        artist: ArtistManager;
    };
    fetchAccessToken(): Promise<void>;
}
//# sourceMappingURL=resolver.d.ts.map