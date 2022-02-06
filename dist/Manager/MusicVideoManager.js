"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MusicVideoManager = void 0;
const erela_js_1 = require("erela.js");
const undici_1 = require("undici");
const BaseManager_1 = require("./BaseManager");
class MusicVideoManager extends BaseManager_1.BaseManager {
    async fetch(id, requester) {
        try {
            await this.checkFromCache(id, requester);
            if (!this.resolver.token)
                await this.resolver.fetchAccessToken();
            const response = await (0, undici_1.fetch)(`https://amp-api.music.apple.com/v1/catalog/us/music-videos/${id}`, { headers: { Authorization: `Bearer ${this.resolver.token}` } });
            if (response.status === 401) {
                await this.resolver.fetchAccessToken();
                return this.fetch(id, requester);
            }
            const data = await response.json();
            if (data.errors && !data.data)
                return this.buildSearch("NO_MATCHES", undefined, "Could not find any suitable track(s), unexpected apple music response", undefined);
            const fileredData = data.data?.filter(x => x.type === "music-videos")[0];
            return this.buildSearch("TRACK_LOADED", this.resolver.plugin.options.convertUnresolved ? await this.autoResolveTrack([erela_js_1.TrackUtils.buildUnresolved(this.buildUnresolved({ name: fileredData.attributes.name, uri: fileredData.attributes.url, artist: fileredData.attributes.artistName, duration: fileredData.attributes.durationInMillis * 1000 }), requester)]) : [erela_js_1.TrackUtils.buildUnresolved(this.buildUnresolved({ name: fileredData.attributes.name, uri: fileredData.attributes.url, artist: fileredData.attributes.artistName, duration: fileredData.attributes.durationInMillis * 1000 }), requester)], undefined, undefined);
        }
        catch (e) {
            return this.buildSearch("NO_MATCHES", undefined, "Could not find any suitable track(s), unexpected apple music response", undefined);
        }
    }
}
exports.MusicVideoManager = MusicVideoManager;
