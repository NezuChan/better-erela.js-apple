import AppleMusic from "../index";
import { Manager } from "erela.js";

test("Get apple music video ", (done) => {
    const manager = new Manager({
        plugins: [
            new AppleMusic()
        ],
        nodes: [
            {
                host: "lava.link",
                password: "youshallnotpass",
                port: 80
            }
        ],
        send: () => {
    
        }
    });
    
    manager.search("https://music.apple.com/us/music-video/%E5%A4%9C%E3%81%AB%E9%A7%86%E3%81%91%E3%82%8B/1544228709").then(x => {
        expect(x.loadType).toBe("TRACK_LOADED");
        done();
    }).catch(e => expect(e).toBeUndefined());
}, 30_000)

