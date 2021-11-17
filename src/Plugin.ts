import options from "cheerio/lib/options";
import { LoadType, Manager, Plugin, SearchQuery, TrackUtils, SearchResult, UnresolvedTrack } from "erela.js";
import { Result } from "./types";
import fetch from 'petitio';
import cheerio from 'cheerio';

export class AppleMusic extends Plugin {
    public manager!: Manager;
    public regex = /(?:https:\/\/music\.apple\.com\/)(?:.+)?(artist|album|music-video|playlist)\/([\w\-\.]+(\/)+[\w\-\.]+|[^&]+)/;
    //@ts-expect-error _search is persistent
    private _search: (query: string | SearchQuery, requester?: unknown) => Promise<SearchResult>;
    
    private readonly functions = {
        artist: this.getArtist.bind(this),
        album: this.getAlbum.bind(this),
        playlist: this.getPlaylist.bind(this),
        "music-video": this.getTrack.bind(this)
    };


    public load(manager: Manager) {
        this.manager = manager;
        this._search = manager.search.bind(manager);
        manager.search = this.search.bind(this);
    }

    private async search(query: string | SearchQuery, requester?: unknown): Promise<SearchResult> {
        const finalQuery = (query as SearchQuery).query || query as string;
        const [url, type] = this.regex.exec(finalQuery) ?? [];
        if (type in this.functions) {
            try {
                const func = this.functions[type as keyof AppleMusic["functions"]];
                if(func) {
                    //@ts-expect-error type mabok
                    const searchTrack: Result = await func(url);
                    const loadType = type === "music-video" ? "TRACK_LOADED" : "PLAYLIST_LOADED";
                    const name = ["artist", "album", "playlist"].includes(type) ? searchTrack.name : null;
                    const tracks = searchTrack.tracks.map(x => TrackUtils.buildUnresolved(x, requester));
                    //@ts-expect-error type mabok
                    return AppleMusic.buildSearch(loadType, tracks, null, name);
                }
                const msg = "Incorrect type for Apple Music URL, must be one of \"music-video\", \"album\", \"artist\", or \"playlist\".";
                //@ts-expect-error type mabok
                return resolver.buildSearch("LOAD_FAILED", [], msg, null);
            } catch (e) {
                //@ts-expect-error type mabok
                return resolver.buildSearch(e.loadType ?? "LOAD_FAILED", [], e.message ?? null, null);
            }
        }
        return this.search(query, options);
    }

    private async getAlbum(url: string) {
        const html = await fetch(url).text();
        const $ = cheerio.load(html);
        const trackName = $(".songs-list-row__song-container")
            .toArray()
            .map(x => ({
                title: cheerio.load(x)(".songs-list-row__song-name").text().trim(),
                artist: $(".product-creator").text().trim(),
                duration: $(".songs-list-row__length").eq(Number(cheerio.load(x)(".songs-list-row__song-index").text().trim()) - 1).text()
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

    private async getArtist(url: string) {
        const html = await fetch(`${url}/see-all?section=top-songs`).text();
        const $ = cheerio.load(html);
        const trackName = $(".songs-list-row__song-container")
            .toArray()
            .map(x => ({
                title: cheerio.load(x)(".songs-list-row__song-name").text().trim(),
                artist: cheerio.load(x)(".songs-list-row__by-line").text().trim(),
                duration: $(".songs-list-row__length").eq(Number(cheerio.load(x)(".songs-list-row__song-index").text().trim()) - 1).text()
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

    private async getPlaylist(url: string) {
        const html = await fetch(url).text();
        const $ = cheerio.load(html);
        const trackName = $(".songs-list-row__song-container")
            .toArray()
            .map(x => ({
                title: cheerio.load(x)(".songs-list-row__song-name").text().trim(),
                artist: cheerio.load(x)(".songs-list-row__by-line").text().trim(),
                duration: $(".songs-list-row__length").eq(Number(cheerio.load(x)(".songs-list-row__song-index").text().trim()) - 1).text()
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

    private async getTrack(url: string) {
        const html = await fetch(url).text();
        const $ = cheerio.load(html);
        const trackName = $(".artist-info")
            .toArray()
            .map(x => ({
                title: cheerio.load(x)(".video-name").text().trim(),
                artist: cheerio.load(x)(".video-artist-name").text().trim(),
                duration: $('meta[property="og:description"]').attr("content")?.split("-")[2].trim().trim().split(":")
                /* eslint no-mixed-operators: "off" */
                    .reduce((acc, cur, ind, arr) => acc + Math.pow(60, arr.length - ((ind + 1) || 1)) * Number(cur), 0)! * 1000
            }));
        return { tracks: trackName.map(x => AppleMusic.convertToUnresolved(x)) };
    }

    private static convertToUnresolved(track: any) {
        if (!track) {
            throw new ReferenceError("The Apple music track object was not provided");
        }
        if (!track.title) {
            throw new ReferenceError("The track name was not provided");
        }
        if (typeof track.title !== "string") {
            throw new TypeError(
                `The track title must be a string, received type ${typeof track.title}`
            );
        }

        return {
            title: track.title,
            author: String(track.artist).trim(),
            duration: track.duration,
        };
    }

    public static buildSearch(loadType: LoadType, tracks: UnresolvedTrack[], error: string, name: string): SearchResult  {
        return {
            loadType: loadType,
            //@ts-expect-error type mabok
            tracks: tracks ?? [],
            //@ts-expect-error type mabok
            playlist: name ? {
                name,
                duration: tracks?.reduce((acc: number, cur: UnresolvedTrack) => acc + (cur.duration || 0), 0, )
            } : null,
            //@ts-expect-error type mabok
            exception: error ? {
                message: error,
                severity: "COMMON",
            } : null
        }
    }

}