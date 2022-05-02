"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlaylistManager = void 0;
const erela_js_1 = require("erela.js");
const undici_1 = require("undici");
const BaseManager_1 = require("./BaseManager");
class PlaylistManager extends BaseManager_1.BaseManager {
    async fetch(id, requester) {
        try {
            if (this.cache.has(id)) {
                const result = await this.checkFromCache(id, requester);
                if (result)
                    return result;
            }
            if (!this.resolver.token)
                await this.resolver.fetchAccessToken();
            const response = await (0, undici_1.fetch)(`${this.baseURL}/playlists/${id}`, { headers: { Authorization: this.resolver.token ?? '', referer: 'https://music.apple.com', origin: 'https://music.apple.com' } });
            if (response.status === 401) {
                await this.resolver.fetchAccessToken();
                return this.fetch(id, requester);
            }
            const data = await response.json();
            if (data.errors && !data.data)
                return this.buildSearch('NO_MATCHES', undefined, 'Could not find any suitable track(s), unexpected apple music response', undefined);
            const fileredData = data.data?.filter((x) => x.type === 'playlists')[0].relationships.tracks.data.filter((x) => x.type === 'songs');
            if (this.resolver.plugin.options.cacheTrack) {
                this.cache.set(id, {
                    tracks: fileredData.map((x) => ({
                        name: x.attributes.name, uri: x.attributes.url, artist: x.attributes.artistName, duration: x.attributes.durationInMillis
                    })),
                    name: data.data?.filter((x) => x.type === 'playlists')[0].attributes.name
                });
            }
            return this.buildSearch('PLAYLIST_LOADED', this.resolver.plugin.options.convertUnresolved
                ? await this.autoResolveTrack(fileredData.map((x) => erela_js_1.TrackUtils.buildUnresolved(this.buildUnresolved({
                    name: x.attributes.name, uri: x.attributes.url, artist: x.attributes.artistName, duration: x.attributes.durationInMillis
                }), requester)))
                : fileredData.map((x) => erela_js_1.TrackUtils.buildUnresolved(this.buildUnresolved({
                    name: x.attributes.name, uri: x.attributes.url, artist: x.attributes.artistName, duration: x.attributes.durationInMillis
                }), requester)), undefined, data.data[0].attributes.name);
        }
        catch (e) {
            return this.buildSearch('NO_MATCHES', undefined, 'Could not find any suitable track(s), unexpected apple music response', undefined);
        }
    }
}
exports.PlaylistManager = PlaylistManager;
