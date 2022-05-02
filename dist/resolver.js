"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolver = void 0;
const undici_1 = require("undici");
const cheerio_1 = __importDefault(require("cheerio"));
const index_1 = require("./Manager/index");
class resolver {
    constructor(plugin) {
        this.plugin = plugin;
        this.token = undefined;
        this.resolveManager = {
            'music-video': new index_1.MusicVideoManager(this),
            playlist: new index_1.PlaylistManager(this),
            album: new index_1.AlbumManager(this),
            artist: new index_1.ArtistManager(this)
        };
    }
    async fetchAccessToken() {
        try {
            const response = await (0, undici_1.fetch)('https://music.apple.com');
            const textResponse = await response.text();
            const $ = cheerio_1.default.load(textResponse);
            const token = JSON.parse(decodeURIComponent($('meta[name=desktop-music-app/config/environment]').attr('content')));
            this.token = `Bearer ${token.MEDIA_API.token}`;
        }
        catch (_e) {
            /* Do nothing. */
        }
    }
}
exports.resolver = resolver;
