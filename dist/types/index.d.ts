export interface AppleMusicOptions {
    cacheTrack?: boolean;
    maxCacheLifeTime?: number;
    convertUnresolved?: boolean;
}
export interface AppleMusicTrack {
    name: string;
    duration: number;
    uri: string;
    artist: string;
}
export interface AppleMusicMetaTagResponse {
    MEDIA_API: {
        token: string;
    };
}
//# sourceMappingURL=index.d.ts.map