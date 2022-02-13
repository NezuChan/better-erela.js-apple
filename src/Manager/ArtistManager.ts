import { SearchResult, TrackUtils } from 'erela.js'
import { fetch } from 'undici'
import { BaseManager } from './BaseManager'

export class ArtistManager extends BaseManager {
  public async fetch (id: string, requester: unknown): Promise<SearchResult> {
    try {
      await this.checkFromCache(id, requester)!
      if (!this.resolver.token) await this.resolver.fetchAccessToken()

      const response = await fetch(`${this.baseURL}/artists/${id}?views=top-songs`, { headers: { Authorization: this.resolver.token ?? '' } })

      if (response.status === 401) {
        await this.resolver.fetchAccessToken()
        return this.fetch(id, requester)
      }

      const data = await response.json() as APIREsponse
      if (data.errors && !data.data) return this.buildSearch('NO_MATCHES', undefined, 'Could not find any suitable track(s), unexpected apple music response', undefined)
      const fileredData = data.data?.filter((x) => x.type === 'artists')[0]!.views['top-songs'].data.filter((x) => x.type === 'songs')!

      while (data.data && data.data[0].views['top-songs'].next) {
        const nextUrl = `${this.baseURL}/${data.data[0].views['top-songs'].next.split('/').slice(4).join('/')}`

        const nextResponse = await fetch(nextUrl, { headers: { Authorization: this.resolver.token ?? '' } })
        const nextData = await nextResponse.json() as AppleMusicPaginationTrack
        data.data[0].views['top-songs'].next = nextData.next
        fileredData.push(...nextData.data.filter((x) => x.type === 'songs'))
      }

      if (this.resolver.plugin.options.cacheTrack) {
        this.cache.set(id, {
          tracks: fileredData.map((x) => ({
            name: x.attributes.name, uri: x.attributes.url, artist: x.attributes.artistName, duration: x.attributes.durationInMillis
          })),
          name: data.data?.filter((x) => x.type === 'artists')[0]!.attributes.name
        })
      }
      return this.buildSearch('PLAYLIST_LOADED', this.resolver.plugin.options.convertUnresolved
        ? await this.autoResolveTrack(fileredData.map((x) => TrackUtils.buildUnresolved(this.buildUnresolved({
          name: x.attributes.name, uri: x.attributes.url, artist: x.attributes.artistName, duration: x.attributes.durationInMillis
        }), requester)))
        : fileredData.map((x) => TrackUtils.buildUnresolved(this.buildUnresolved({
          name: x.attributes.name, uri: x.attributes.url, artist: x.attributes.artistName, duration: x.attributes.durationInMillis
        }), requester)), undefined, data.data![0].attributes.name)
    } catch (e) {
      console.log(e)
      return this.buildSearch('NO_MATCHES', undefined, 'Could not find any suitable track(s), unexpected apple music response', undefined)
    }
  }
}

interface APIREsponse {
    errors?: unknown[];
    data?: {
        id: string;
        type: 'artists';
        attributes: {
            name: string;
        },
        views: {
            'top-songs': {
                next?: string;
                data: {
                    type: 'songs';
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
            };
        }
    }[]
}

interface AppleMusicPaginationTrack {
    next?: string;
    data: {
        type: 'songs';
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
