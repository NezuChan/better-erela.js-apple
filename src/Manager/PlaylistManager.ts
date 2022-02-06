import { SearchResult, TrackUtils } from "erela.js";
import { fetch } from "undici";
import { BaseManager } from "./BaseManager";

export class PlaylistManager extends BaseManager {
    public async fetch(id: string, requester: unknown): Promise<SearchResult> {
        try {
            await this.checkFromCache(id, requester)!;
            if (!this.resolver.token) await this.resolver.fetchAccessToken();
            
            const response = await fetch(`https://amp-api.music.apple.com/v1/catalog/us/playlists/${id}`, { headers: { Authorization: `Bearer ${this.resolver.token}` } });
            
            if (response.status === 401) {
                await this.resolver.fetchAccessToken();
                return this.fetch(id, requester);
            }
            
            const data = await response.json() as MusicVideoAPIREsponse;
            if (data.errors && !data.data) return this.buildSearch("NO_MATCHES", undefined, "Could not find any suitable track(s), unexpected apple music response", undefined);
            const fileredData = data.data?.filter(x => x.type === "playlists")[0]!.relationships.tracks.data.filter(x => x.type === "songs")!;
            if (this.resolver.plugin.options.cacheTrack) this.cache.set(id, { tracks: fileredData.map(x => ({ name: x.attributes.name, uri: x.attributes.url, artist: x.attributes.artistName, duration: x.attributes.durationInMillis * 1000 })), name: data.data?.filter(x => x.type === "playlists")[0]!.attributes.name });
            return this.buildSearch("PLAYLIST_LOADED", this.resolver.plugin.options.convertUnresolved ? await this.autoResolveTrack(fileredData.map(x => TrackUtils.buildUnresolved(this.buildUnresolved({ name: x.attributes.name, uri: x.attributes.url, artist: x.attributes.artistName, duration: x.attributes.durationInMillis * 1000 }), requester))) : fileredData.map(x => TrackUtils.buildUnresolved(this.buildUnresolved({ name: x.attributes.name, uri: x.attributes.url, artist: x.attributes.artistName, duration: x.attributes.durationInMillis * 1000 }), requester)), undefined, data.data![0].attributes.name);
        } catch(e) {
            return this.buildSearch("NO_MATCHES", undefined, "Could not find any suitable track(s), unexpected apple music response", undefined);
        }
    }
}

interface MusicVideoAPIREsponse {
    errors?: unknown[];
    data?: {
        id: string;
        type: "playlists";
        attributes: {
            name: string;
        },
        relationships: {
            tracks: {
                data: {
                    type: "songs";
                    attributes: {
                        artwork: {
                            url: string;
                        }
                        artistName: string;
                        url: string;
                        name: string;
                        durationInMillis: number;
                    }
                }[]
            };
        }
    }[]
}