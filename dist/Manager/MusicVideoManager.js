"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MusicVideoManager = void 0;
const erela_js_1 = require("erela.js");
const undici_1 = require("undici");
const BaseManager_1 = require("./BaseManager");
class MusicVideoManager extends BaseManager_1.BaseManager {
    async fetch(id, requester) {
        try {
            if (this.cache.has(id)) {
                const result = await this.checkFromCache(id, requester);
                if (result)
                    return result;
            }
            if (!this.resolver.token)
                await this.resolver.fetchAccessToken();
            const response = await (0, undici_1.fetch)(`${this.baseURL}/music-videos/${id}`, { headers: { Authorization: this.resolver.token ?? '', referer: 'https://music.apple.com', origin: 'https://music.apple.com' } });
            if (response.status === 401) {
                await this.resolver.fetchAccessToken();
                return this.fetch(id, requester);
            }
            const data = await response.json();
            if (data.errors && !data.data)
                return this.buildSearch('NO_MATCHES', undefined, 'Could not find any suitable track(s), unexpected apple music response', undefined);
            const fileredData = data.data?.filter((x) => x.type === 'music-videos')[0];
            if (this.resolver.plugin.options.cacheTrack) {
                this.cache.set(id, {
                    tracks: [{
                            name: fileredData.attributes.name, uri: fileredData.attributes.url, artist: fileredData.attributes.artistName, duration: fileredData.attributes.durationInMillis
                        }]
                });
            }
            return this.buildSearch('TRACK_LOADED', this.resolver.plugin.options.convertUnresolved
                ? await this.autoResolveTrack([erela_js_1.TrackUtils.buildUnresolved(this.buildUnresolved({
                        name: fileredData.attributes.name, uri: fileredData.attributes.url, artist: fileredData.attributes.artistName, duration: fileredData.attributes.durationInMillis
                    }), requester)])
                : [erela_js_1.TrackUtils.buildUnresolved(this.buildUnresolved({
                        name: fileredData.attributes.name, uri: fileredData.attributes.url, artist: fileredData.attributes.artistName, duration: fileredData.attributes.durationInMillis
                    }), requester)], undefined, undefined);
        }
        catch (e) {
            return this.buildSearch('NO_MATCHES', undefined, 'Could not find any suitable track(s), unexpected apple music response', undefined);
        }
    }
}
exports.MusicVideoManager = MusicVideoManager;
