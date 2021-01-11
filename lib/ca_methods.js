// Modifications copyright 2020 Caf.js Labs and contributors
/*!
Copyright 2013 Hewlett-Packard Development Company, L.P.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

'use strict';
const caf = require('caf_core');
const myUtils = caf.caf_components.myUtils;
const app = require('../public/js/app.js');
const assert = require('assert');
const deployerUtil = require('./ca_methods_util.js');
const APP_SESSION = 'default';

const notifyWebApp = function(self, msg) {
    self.$.session.notify([msg], APP_SESSION);
};

exports.methods = {
    async __ca_init__() {
        this.state.counter = -1;
        this.state.apps = {};
        this.state.pending = {};
        this.$.deploy.setHandleReplyMethod('handleReply');
        this.$.session.limitQueue(1, APP_SESSION); // only the last notification
        this.state.fullName = this.__ca_getAppName__() + '#' +
            this.__ca_getName__();
        this.state.privileged = (this.__ca_getName__().indexOf('root-') === 0);
        return [];
    },

    async __ca_pulse__() {
        try {
            this.$.log && this.$.log.debug(
                `calling PULSE: ${this.state.counter}`
            );

            this.state.counter = this.state.counter + 1;
            deployerUtil.cleanDeleted(this);
            deployerUtil.cleanPending(this);

            if (this.state.counter % this.$.props.pulsesForFlex === 0) {
                await deployerUtil.triggerFlex(this);
            }

            const [, appInfo] = await this.statApps();
            this.$.react.render(app.main, [appInfo]);

            if (!myUtils.deepEqual(this.scratch.oldApps, this.state.apps)) {
                notifyWebApp(this, this.state);
                this.scratch.oldApps = myUtils.deepClone(this.state.apps);
            }

            return [];
        } catch(err) {
            return [err];
        };
    },

    async handleReply(reqId, err, data) {
        if (err) {
            const errMsg = err.message || err;
            const message = `Request ID: ${reqId} message: ${errMsg}`;
            this.state.error = {message};
            this.$.log && this.$.log.debug(`Error: ${message}`);
            notifyWebApp(this, this.state);
        } else {
            this.$.log && this.$.log.debug(
                `Handle_OK ID: ${reqId} data: ${data}`
            );
        }
        delete this.state.pending[reqId];
        return [];
    },

    async hello(key, tokenStr) {
        this.$.react.setCacheKey(key);
         if (tokenStr) {
             this.scratch.tokenStr = tokenStr;
         }
        return this.getState();
    },

    async cleanError() {
        delete this.state.error;
        return this.getState();
    },

    async statApps() {
        const appNames = Object.keys(this.state.apps);
        const ids = appNames.map(x => this.state.apps[x].id);
        const all = this.$.deploy.statApps(ids);
        appNames.forEach((x, i) => this.state.apps[x].stat = all[i]);
        return [null, this.state];
    },

    async addApp(appLocalName, image, isUntrusted, disableCDN) {
        !this.state.privileged && assert(
            isUntrusted,
            'Insufficient privileges to add trusted app'
        );

        assert(this.scratch.tokenStr, 'Missing token, please login again');

        try {
            const [err, appArray] = await deployerUtil.getAppInfo(
                this, [appLocalName]
            );

            if (err) {
                err.checkApp = true;
                return [err];
            } else if (!Array.isArray(appArray) || (appArray.length !== 1) ||
                       (appArray[0] === null)) {
                const err = new Error('Application not registered');
                err.checkApp = true;
                return [err];
            } else {
                const [appInfo] = appArray;
                const {plan} = appInfo;
                const cdn = disableCDN ? {appCDN: '', appSubdirCDN: ''} : null;

                const id = this.$.deploy.createApp(
                    appLocalName, image, isUntrusted, plan, cdn, null
                );

                this.state.apps[appLocalName] = {
                    id, appLocalName, image, isUntrusted, disableCDN,
                    stat: null
                };
                this.state.pending[id] = this.state.counter;
                return this.getState();
            }
        } catch (err) {
            return [err];
        }
    },

    async deleteApp(appLocalName, keepData) {
        !this.state.privileged && assert(
            !keepData, 'Only privileged can delete an app and keep its volume'
        );

        const info = this.state.apps[appLocalName];
        if (info) {
            const reqId = this.$.deploy.deleteApp(info.id, keepData);
            info.deleting = true;
            this.state.pending[reqId] = this.state.counter;
        }
        return this.getState();
    },

    async restartApp(appLocalName) {
        const info = this.state.apps[appLocalName];
        if (info) {
            const reqId = this.$.deploy.restartApp(info.id);
            this.state.pending[reqId] = this.state.counter;
        } else {
            this.$.log && this.$.log.debug(
                `Cannot restart missing app: ${appLocalName}`
            );
        }
        return this.getState();
    },

    async setManualFlex(appLocalName, isON) {
        assert(this.state.privileged, 'setManualFlex() for privileged only');
        assert(typeof isON === 'boolean', "Invalid 'isON' type");

        const info = this.state.apps[appLocalName];
        if (info) {
            info.manual = isON;
            return this.getState();
        } else {
            const msg = `Cannot setManualFlex for ${appLocalName}, missing app`;
            this.$.log && this.$.log.debug(msg);
            return [new Error(msg)];
        }
    },

    async triggerFlex() {
        assert(this.state.privileged, 'triggerFlex() for privileged only');
        try {
            await deployerUtil.triggerFlex(this);
            return this.getState();
        } catch (err) {
            return [err];
        };
    },

    async flexApp(appLocalName, numberOfCAs) {
        assert(this.state.privileged, 'flexApp() for privileged only');

        try {
            const info = this.state.apps[appLocalName];
            if (info) {
                if (!info.manual) {
                    const msg = `Set manual mode to flex ${appLocalName}`;
                    this.$.log && this.$.log.debug(msg);
                    return [new Error(msg)];
                } else {
                    const [err, appArray] = await deployerUtil.getAppInfo(
                        this, [appLocalName]
                    );
                    if (err || !Array.isArray(appArray) ||
                        (appArray.length !== 1) || (appArray[0] === null)) {
                        return [err ||
                                (new Error('Application not registered'))];
                    } else {
                        const [appInfo] = appArray;
                        const {plan} = appInfo;
                        const reqId = this.$.deploy.flexApp(info.id, plan,
                                                            numberOfCAs);
                        this.state.pending[reqId] = this.state.counter;
                        return this.getState();
                    }
                }
            } else {
                const msg = `Cannot flex ${appLocalName}, missing app`;
                this.$.log && this.$.log.debug(msg);
                return [new Error(msg)];
            }
        } catch (err) {
            return [err];
        }
    },

    async getState() {
        this.$.react.coin();
        return [null, this.state];
    }
};

caf.init(module);
