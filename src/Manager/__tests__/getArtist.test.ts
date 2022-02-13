import { Manager } from 'erela.js'
import AppleMusic from '../index'

test('Get apple playlist video ', (done) => {
  const manager = new Manager({
    plugins: [
      new AppleMusic()
    ],
    send: () => {

    }
  })

  manager.search('https://music.apple.com/us/artist/rick-astley/669771').then((x) => {
    expect(x.loadType).toBe('PLAYLIST_LOADED')
    done()
  }).catch((e) => expect(e).toBeUndefined())
}, 30_000)
