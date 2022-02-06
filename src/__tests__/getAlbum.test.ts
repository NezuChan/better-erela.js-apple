import AppleMusic from "../index";
import { Manager } from "erela.js";

test("Get apple album video ", (done) => {
    const manager = new Manager({
        plugins: [
            new AppleMusic()
        ],
        send: () => {
    
        }
    });
    
    manager.search("https://music.apple.com/us/album/whenever-you-need-somebody/1558533900").then(x => {
        expect(x.loadType).toBe("PLAYLIST_LOADED");
        done();
    }).catch(e => expect(e).toBeUndefined());
}, 30_000)

