import { AppleMusic } from "./Plugin";
import { MusicVideoManager, PlaylistManager } from "./Manager/index";
export declare class resolver {
    plugin: AppleMusic;
    constructor(plugin: AppleMusic);
    token: string | undefined;
    resolveManager: {
        "music-video": MusicVideoManager;
        playlist: PlaylistManager;
    };
    fetchAccessToken(): Promise<void>;
}
//# sourceMappingURL=resolver.d.ts.map