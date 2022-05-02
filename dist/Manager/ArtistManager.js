"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ArtistManager = void 0;
const erela_js_1 = require("erela.js");
const undici_1 = require("undici");
const BaseManager_1 = require("./BaseManager");
class ArtistManager extends BaseManager_1.BaseManager {
    async fetch(id, requester) {
        try {
            if (this.cache.has(id)) {
                const result = await this.checkFromCache(id, requester);
                if (result)
                    return result;
            }
            if (!this.resolver.token)
                await this.resolver.fetchAccessToken();
            const response = await (0, undici_1.fetch)(`${this.baseURL}/artists/${id}?views=top-songs`, { headers: { Authorization: this.resolver.token ?? '', referer: 'https://music.apple.com', origin: 'https://music.apple.com' } });
            if (response.status === 401) {
                await this.resolver.fetchAccessToken();
                return this.fetch(id, requester);
            }
            const data = await response.json();
            if (data.errors && !data.data)
                return this.buildSearch('NO_MATCHES', undefined, 'Could not find any suitable track(s), unexpected apple music response', undefined);
            const fileredData = data.data?.filter((x) => x.type === 'artists')[0].views['top-songs'].data.filter((x) => x.type === 'songs');
            while (data.data && data.data[0].views['top-songs'].next) {
                const nextUrl = `${this.baseURL}/${data.data[0].views['top-songs'].next.split('/').slice(4).join('/')}`;
                const nextResponse = await (0, undici_1.fetch)(nextUrl, { headers: { Authorization: this.resolver.token ?? '', referer: 'https://music.apple.com', origin: 'https://music.apple.com' } });
                const nextData = await nextResponse.json();
                data.data[0].views['top-songs'].next = nextData.next;
                fileredData.push(...nextData.data.filter((x) => x.type === 'songs'));
            }
            if (this.resolver.plugin.options.cacheTrack) {
                this.cache.set(id, {
                    tracks: fileredData.map((x) => ({
                        name: x.attributes.name, uri: x.attributes.url, artist: x.attributes.artistName, duration: x.attributes.durationInMillis
                    })),
                    name: data.data?.filter((x) => x.type === 'artists')[0].attributes.name
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
exports.ArtistManager = ArtistManager;
