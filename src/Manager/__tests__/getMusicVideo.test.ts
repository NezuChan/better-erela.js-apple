import { Manager } from 'erela.js'
import AppleMusic from '../../index'

test('Get apple music video ', (done) => {
  const manager = new Manager({
    plugins: [
      new AppleMusic()
    ],
    send: () => {

    }
  })

  manager.search('https://music.apple.com/us/music-video/never-gonna-give-you-up/1559900284').then((x) => {
    expect(x.loadType).toBe('TRACK_LOADED')
    done()
  }).catch((e) => expect(e).toBeUndefined())
}, 30_000)
