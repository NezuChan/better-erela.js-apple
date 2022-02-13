import { SearchResult, TrackUtils } from 'erela.js'
import { fetch } from 'undici'
import { BaseManager } from './BaseManager'

export class MusicVideoManager extends BaseManager {
  public async fetch (id: string, requester: unknown): Promise<SearchResult> {
    try {
      await this.checkFromCache(id, requester)!
      if (!this.resolver.token) await this.resolver.fetchAccessToken()

      const response = await fetch(`${this.baseURL}/music-videos/${id}`, { headers: { Authorization: this.resolver.token ?? '' } })

      if (response.status === 401) {
        await this.resolver.fetchAccessToken()
        return this.fetch(id, requester)
      }

      const data = await response.json() as APIREsponse
      if (data.errors && !data.data) return this.buildSearch('NO_MATCHES', undefined, 'Could not find any suitable track(s), unexpected apple music response', undefined)
      const fileredData = data.data?.filter((x) => x.type === 'music-videos')[0]!
      if (this.resolver.plugin.options.cacheTrack) {
        this.cache.set(id, {
          tracks: [{
            name: fileredData.attributes.name, uri: fileredData.attributes.url, artist: fileredData.attributes.artistName, duration: fileredData.attributes.durationInMillis
          }]
        })
      }
      return this.buildSearch('TRACK_LOADED', this.resolver.plugin.options.convertUnresolved
        ? await this.autoResolveTrack([TrackUtils.buildUnresolved(this.buildUnresolved({
          name: fileredData.attributes.name, uri: fileredData.attributes.url, artist: fileredData.attributes.artistName, duration: fileredData.attributes.durationInMillis
        }), requester)])
        : [TrackUtils.buildUnresolved(this.buildUnresolved({
            name: fileredData.attributes.name, uri: fileredData.attributes.url, artist: fileredData.attributes.artistName, duration: fileredData.attributes.durationInMillis
          }), requester)], undefined, undefined)
    } catch (e) {
      return this.buildSearch('NO_MATCHES', undefined, 'Could not find any suitable track(s), unexpected apple music response', undefined)
    }
  }
}

interface APIREsponse {
    errors?: unknown[];
    data?: {
        id: string;
        type: 'music-videos';
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
}
