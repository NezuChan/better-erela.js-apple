"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppleMusic = void 0;
const erela_js_1 = require("erela.js");
const resolver_1 = require("./resolver");
class AppleMusic extends erela_js_1.Plugin {
    constructor(options = { cacheTrack: true, maxCacheLifeTime: 360000 }) {
        super();
        this.options = options;
        this.resolver = new resolver_1.resolver(this);
        this.appleMusicMatch = /(?:https:\/\/music\.apple\.com\/)(?:.+)?(artist|album|music-video|playlist)\/([\w\-\.]+(\/)+[\w\-\.]+|[^&]+)\/([\w\-\.]+(\/)+[\w\-\.]+|[^&]+)/;
    }
    async load(manager) {
        this.manager = manager;
        this._search = manager.search.bind(manager);
        manager.search = this.search.bind(this);
        await this.resolver.fetchAccessToken();
    }
    async search(query, requester) {
        const finalQuery = query.query || query;
        const [, type, , , id] = this.appleMusicMatch.exec(finalQuery) ?? [];
        if (type in this.resolver.resolveManager) {
            return this.resolver.resolveManager[type].fetch(id, requester);
        }
        return this._search(query, requester);
    }
}
exports.AppleMusic = AppleMusic;
