import { AppleMusic } from "./Plugin";
import { MusicVideoManager } from "./Manager/index";
export declare class resolver {
    plugin: AppleMusic;
    constructor(plugin: AppleMusic);
    token: string | undefined;
    resolveManager: {
        "music-video": MusicVideoManager;
    };
    fetchAccessToken(): Promise<void>;
}
//# sourceMappingURL=resolver.d.ts.map