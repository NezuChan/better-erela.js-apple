import { Manager, Plugin } from 'erela.js';
import { AppleMusicOptions } from './types';
import { resolver } from './resolver';
export declare class AppleMusic extends Plugin {
    options: AppleMusicOptions;
    constructor(options?: AppleMusicOptions);
    readonly resolver: resolver;
    manager: Manager | undefined;
    appleMusicMatch: RegExp;
    private _search;
    load(manager: Manager): Promise<void>;
    private search;
}
//# sourceMappingURL=Plugin.d.ts.map