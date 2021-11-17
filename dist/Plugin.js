"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppleMusic = void 0;
const erela_js_1 = require("erela.js");
const petitio_1 = __importDefault(require("petitio"));
const cheerio_1 = __importDefault(require("cheerio"));
class AppleMusic extends erela_js_1.Plugin {
    constructor() {
        super(...arguments);
        this.regex = /(?:https:\/\/music\.apple\.com\/)(?:.+)?(artist|album|music-video|playlist)\/([\w\-\.]+(\/)+[\w\-\.]+|[^&]+)/;
        this.functions = {
            artist: this.getArtist.bind(this),
            album: this.getAlbum.bind(this),
            playlist: this.getPlaylist.bind(this),
            "music-video": this.getTrack.bind(this)
        };
    }
    load(manager) {
        this.manager = manager;
        this._search = manager.search.bind(manager);
        manager.search = this.search.bind(this);
    }
    async search(query, requester) {
        const finalQuery = query.query || query;
        const [url, type] = this.regex.exec(finalQuery) ?? [];
        if (type in this.functions) {
            try {
                const func = this.functions[type];
                if (func) {
                    //@ts-expect-error
                    const searchTrack = await func(url);
                    const loadType = type === "music-video" ? "TRACK_LOADED" : "PLAYLIST_LOADED";
                    const name = ["artist", "album", "playlist"].includes(type) ? searchTrack.name : null;
                    const tracks = searchTrack.tracks.map(x => erela_js_1.TrackUtils.buildUnresolved(x, requester));
                    //@ts-expect-error type mabok
                    return AppleMusic.buildSearch(loadType, tracks, null, name);
                }
                const msg = "Incorrect type for AppleMusic URL, must be one of \"music-video\", \"album\", \"artist\", or \"playlist\".";
                //@ts-expect-error type mabok
                return AppleMusic.buildSearch("LOAD_FAILED", [], msg, null);
            }
            catch (e) {
                //@ts-expect-error type mabok
                return AppleMusic.buildSearch(e.loadType ?? "LOAD_FAILED", [], e.message ?? null, null);
            }
        }
        return this._search(query, requester);
    }
    async getAlbum(url) {
        const html = await (0, petitio_1.default)(url).text();
        const $ = cheerio_1.default.load(html);
        const trackName = $(".songs-list-row__song-container")
            .toArray()
            .map(x => ({
            title: cheerio_1.default.load(x)(".songs-list-row__song-name").text().trim(),
            artist: $(".product-creator").text().trim(),
            duration: $(".songs-list-row__length").eq(Number(cheerio_1.default.load(x)(".songs-list-row__song-index").text().trim()) - 1).text()
                .trim()
                .split(":")
                /* eslint no-mixed-operators: "off" */
                .reduce((acc, cur, ind, arr) => acc + Math.pow(60, arr.length - ((ind + 1) || 1)) * Number(cur), 0) * 1000
        }));
        return {
            tracks: trackName.map(x => AppleMusic.convertToUnresolved(x)),
            name: $(".product-name").eq(0).text()
                .trim()
        };
    }
    async getArtist(url) {
        const html = await (0, petitio_1.default)(`${url}/see-all?section=top-songs`).text();
        const $ = cheerio_1.default.load(html);
        const trackName = $(".songs-list-row__song-container")
            .toArray()
            .map(x => ({
            title: cheerio_1.default.load(x)(".songs-list-row__song-name").text().trim(),
            artist: cheerio_1.default.load(x)(".songs-list-row__by-line").text().trim(),
            duration: $(".songs-list-row__length").eq(Number(cheerio_1.default.load(x)(".songs-list-row__song-index").text().trim()) - 1).text()
                .trim()
                .split(":")
                /* eslint no-mixed-operators: "off" */
                .reduce((acc, cur, ind, arr) => acc + Math.pow(60, arr.length - ((ind + 1) || 1)) * Number(cur), 0) * 1000
        }));
        return {
            tracks: trackName.map(x => AppleMusic.convertToUnresolved(x)),
            name: $(".titled-box-header").eq(0).text()
                .trim()
        };
    }
    async getPlaylist(url) {
        const html = await (0, petitio_1.default)(url).text();
        const $ = cheerio_1.default.load(html);
        const trackName = $(".songs-list-row__song-container")
            .toArray()
            .map(x => ({
            title: cheerio_1.default.load(x)(".songs-list-row__song-name").text().trim(),
            artist: cheerio_1.default.load(x)(".songs-list-row__by-line").text().trim(),
            duration: $(".songs-list-row__length").eq(Number(cheerio_1.default.load(x)(".songs-list-row__song-index").text().trim()) - 1).text()
                .trim()
                .split(":")
                /* eslint no-mixed-operators: "off" */
                .reduce((acc, cur, ind, arr) => acc + Math.pow(60, arr.length - ((ind + 1) || 1)) * Number(cur), 0) * 1000
        }));
        return {
            tracks: trackName.map(x => AppleMusic.convertToUnresolved(x)),
            name: $(".product-name").eq(0).text()
                .trim()
        };
    }
    async getTrack(url) {
        const html = await (0, petitio_1.default)(url).text();
        const $ = cheerio_1.default.load(html);
        const trackName = $(".artist-info")
            .toArray()
            .map(x => ({
            title: cheerio_1.default.load(x)(".video-name").text().trim(),
            artist: cheerio_1.default.load(x)(".video-artist-name").text().trim(),
            duration: $('meta[property="og:description"]').attr("content")?.split("-")[2].trim().trim().split(":")
                /* eslint no-mixed-operators: "off" */
                .reduce((acc, cur, ind, arr) => acc + Math.pow(60, arr.length - ((ind + 1) || 1)) * Number(cur), 0) * 1000
        }));
        return { tracks: trackName.map(x => AppleMusic.convertToUnresolved(x)) };
    }
    static convertToUnresolved(track) {
        if (!track) {
            throw new ReferenceError("The Apple music track object was not provided");
        }
        if (!track.title) {
            throw new ReferenceError("The track name was not provided");
        }
        if (typeof track.title !== "string") {
            throw new TypeError(`The track title must be a string, received type ${typeof track.title}`);
        }
        return {
            title: track.title,
            author: String(track.artist).trim(),
            duration: track.duration,
        };
    }
    static buildSearch(loadType, tracks, error, name) {
        return {
            loadType: loadType,
            //@ts-expect-error type mabok
            tracks: tracks ?? [],
            //@ts-expect-error type mabok
            playlist: name ? {
                name,
                duration: tracks?.reduce((acc, cur) => acc + (cur.duration || 0), 0)
            } : null,
            //@ts-expect-error type mabok
            exception: error ? {
                message: error,
                severity: "COMMON",
            } : null
        };
    }
}
exports.AppleMusic = AppleMusic;
