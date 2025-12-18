/**
 * @license
 * Originally licensed under MIT License
 *
 * Copyright (c) 2018 F-List
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 *
 * ---
 *
 * This file is now also licensed under GPLv3 (see LICENSE file).
 * Modifications made after the original MIT release are licensed under GPLv3.
 *
 * This license header applies to this file and all of the non-third-party assets it includes.
 * @file The entry point for the mobile version of F-Chat 3.0.
 * @copyright 2018 F-List
 * @author Maya Wolf <maya@f-list.net>
 * @version 3.0
 * @see {@link https://github.com/f-list/exported|GitHub repo}
 */
import Axios from 'axios';
import {init as initCore} from '../chat/core';
import {setupRaven} from '../chat/vue-raven';
import Socket from '../chat/WebSocket';
import Connection from '../fchat/connection';
import {appVersion, Logs, SettingsStore} from './filesystem';
import Index from './Index.vue';
import Notifications from './notifications';
import { GeneralSettings } from './filesystem'; // Updated import to use GeneralSettings from mobile filesystem

const version = (<{version: string}>require('./package.json')).version; //tslint:disable-line:no-require-imports

let connection: any;
let initialized = false;

(<any>window)['setupPlatform'] = (platform: string) => { //tslint:disable-line:no-any
    if(initialized) return;
    initialized = true;

    (window as any).__horizonPlatform = `mobile-${platform}`;
    Axios.defaults.params = { __fchat: `mobile-${platform}/${version}` };

    if(process.env.NODE_ENV === 'production')
        setupRaven('https://a9239b17b0a14f72ba85e8729b9d1612@sentry.f-list.net/2', `mobile-${version}`);

    connection = new Connection('F-Chat 3.0 (Mobile)', appVersion, Socket);
    initCore(connection, new GeneralSettings() as any, Logs, SettingsStore, Notifications); // Using GeneralSettings from mobile filesystem

    new Index({ //tslint:disable-line:no-unused-expression
        el: '#app'
    });
};
function startApp(platform: string) {
    if(initialized) return;
    initialized = true;

    (window as any).__horizonPlatform = `mobile-${platform}`;
    Axios.defaults.params = { __fchat: `mobile-${platform}/${version}` };

    if(process.env.NODE_ENV === 'production')
        setupRaven('https://a9239b17b0a14f72ba85e8729b9d1612@sentry.f-list.net/2', `mobile-${version}`);

    connection = new Connection('Horizon Mobile', appVersion, Socket);
    initCore(connection, new GeneralSettings() as any, Logs, SettingsStore, Notifications);

    new Index({ //tslint:disable-line:no-unused-expression
        el: '#app'
    });
}

(<any>window)['setupPlatform'] = (platform: string) => startApp(platform); //tslint:disable-line:no-any

// If Android called setupPlatform before chat.js loaded, it may have stored the arg on a known property.
// Initialize immediately if the queued arg exists.
const queued = (<any>window)['__queuedSetupPlatformArg'];
if (queued) startApp(queued);
