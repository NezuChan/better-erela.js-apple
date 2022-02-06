"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlaylistManager = void 0;
const erela_js_1 = require("erela.js");
const undici_1 = require("undici");
const BaseManager_1 = require("./BaseManager");
class PlaylistManager extends BaseManager_1.BaseManager {
    async fetch(id, requester) {
        try {
            await this.checkFromCache(id, requester);
            if (!this.resolver.token)
                await this.resolver.fetchAccessToken();
            const response = await (0, undici_1.fetch)(`https://amp-api.music.apple.com/v1/catalog/us/playlists/${id}`, { headers: { Authorization: `Bearer ${this.resolver.token}` } });
            if (response.status === 401) {
                await this.resolver.fetchAccessToken();
                return this.fetch(id, requester);
            }
            const data = await response.json();
            if (data.errors && !data.data)
                return this.buildSearch("NO_MATCHES", undefined, "Could not find any suitable track(s), unexpected apple music response", undefined);
            const fileredData = data.data?.filter(x => x.type === "playlists")[0].relationships.tracks.data.filter(x => x.type === "songs");
            return this.buildSearch("PLAYLIST_LOADED", this.resolver.plugin.options.convertUnresolved ? await this.autoResolveTrack(fileredData.map(x => erela_js_1.TrackUtils.buildUnresolved(this.buildUnresolved({ name: x.attributes.name, uri: x.attributes.url, artist: x.attributes.artistName, duration: x.attributes.durationInMillis * 1000 }), requester))) : fileredData.map(x => erela_js_1.TrackUtils.buildUnresolved(this.buildUnresolved({ name: x.attributes.name, uri: x.attributes.url, artist: x.attributes.artistName, duration: x.attributes.durationInMillis * 1000 }), requester)), undefined, data.data[0].attributes.name);
        }
        catch (e) {
            return this.buildSearch("NO_MATCHES", undefined, "Could not find any suitable track(s), unexpected apple music response", undefined);
        }
    }
}
exports.PlaylistManager = PlaylistManager;
