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
const json_rpc = caf.caf_transport.json_rpc;
const myUtils = caf.caf_components.myUtils;
const app = require('../public/js/app.js');
const USER_APP = 'root-people';
const CA_USER_APP = json_rpc.DEFAULT_QUOTA_ID;
const assert = require('assert');


const cleanDeleted = function(self) {
    Object.keys(self.state.apps).forEach(function(app) {
        const info = self.state.apps[app];
        if (info.deleting && (!info.stat)) {
            delete self.state.apps[app];
        }
    });
};

const cleanPending = function(self) {
    Object.keys(self.state.pending).forEach(function(x) {
        const counter = self.state.pending[x];
        // if several timed out, just report one
        if (self.state.counter - counter > self.$.props.pulsesForTimeout) {
            self.state.error = {message: x + ':Error:Request timed out'};
            self.$.session.notify([self.state], 'default');
            delete self.state.pending[x];
        }
    });
};

exports.methods = {
    async __ca_init__() {
        this.state.counter = -1;
        this.state.apps = {};
        this.state.pending = {};
        this.$.deploy.setHandleReplyMethod('handleReply');
        this.$.session.limitQueue(1); // only the last notification
        this.state.fullName = this.__ca_getAppName__() + '#' +
            this.__ca_getName__();
        this.state.privileged = (this.__ca_getName__().indexOf('root-') === 0);
        return [];
    },
    async __ca_resume__(cp) {
        // repeat initialization to allow hot upgrade to new version
        this.state.pending = this.state.pending || {};
        // repeat for backwards compatibility...
        this.state.privileged = (this.__ca_getName__().indexOf('root-') === 0);
        this.$.deploy.setHandleReplyMethod('handleReply');
        return [];
    },
    async __ca_pulse__() {
        this.$.log && this.$.log.debug('calling PULSE!!! ' +
                                               this.state.counter);
        if (!myUtils.deepEqual(this.scratch.oldApps, this.state.apps)) {
            this.$.session.notify([this.state], 'default');
        }
        this.scratch.oldApps = myUtils.deepClone(this.state.apps);

        this.state.counter = this.state.counter + 1;
        cleanDeleted(this);
        cleanPending(this);
        try {
            const res = await this.statApps();
            this.$.react.render(app.main, [res[1]]);
            return res;
        } catch(err) {
            return [err];
        };
    },

    async handleReply(reqId, err, data) {
        if (err) {
            this.state.error = {message: ' Request ID:' + reqId + ' message:' +
                                err.message || err};
            this.$.log && this.$.log.debug('Handle id:' + reqId + ' err:' +
                                           this.state.error.message);
            this.$.session.notify([this.state], 'default');
        } else {
            this.$.log && this.$.log.debug('Handle OK id:' + reqId +
                                           ' data:' + data);
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

    async addApp(appLocalName, image, instances, isUntrusted, options) {
        if (!this.state.privileged) {
            assert(instances <= this.$.props.maxInstances, '#instances: ' +
                   instances + '  greater than ' + this.$.props.maxInstances);
            assert(!options, 'Insufficient privileges to set options');
            assert(!!isUntrusted, 'Insufficient privileges to add trusted app');
        }

        try {
            const username = json_rpc.splitName(this.__ca_getName__())[0];
            const userApp = json_rpc.joinNameArray([
                USER_APP,
                json_rpc.joinName(username, CA_USER_APP)
            ], json_rpc.APP_SEPARATOR);
            const app = json_rpc.joinName(username, appLocalName);
            const [err] = await this.$.crossapp.dirtyCall(
                userApp, json_rpc.DEFAULT_FROM, 'checkApp', [app]
            );
            if (err) {
                err.checkApp = true;
                return [err];
            } else {
                const extra = myUtils.clone(options || {});
                extra.instances = instances;
                extra.isUntrusted = !!isUntrusted;
                const id = this.$.deploy.createApp(appLocalName, image, extra);
                this.state.apps[appLocalName] = {
                    id: id,
                    appLocalName: appLocalName,
                    image: image,
                    instances: instances,
                    isUntrusted: !!isUntrusted,
                    options: options || null,
                    stat: null
                };
                this.state.pending[id] = this.state.counter;
                return this.getState();
            }
        } catch (err) {
            return [err];
        }
    },

    async deleteApp(appLocalName) {
        const info = this.state.apps[appLocalName];
        if (info) {
            const reqId = this.$.deploy.deleteApp(info.id);
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
            this.$.log && this.$.log.debug('Cannot restart missing app :' +
                                           appLocalName);
        }
        return this.getState();
    },

    async flexApp(appLocalName, instances) {
        if (!this.state.privileged) {
            assert(instances <= this.$.props.maxInstances, '#instances: ' +
                   instances + '  greater than ' + this.$.props.maxInstances);
        }

        const info = this.state.apps[appLocalName];
        if (info) {
            const reqId = this.$.deploy.flexApp(info.id, instances);
            this.state.pending[reqId] = this.state.counter;
            info.instances = instances;
        } else {
            this.$.log && this.$.log.debug('Cannot flex missing app :' +
                                           appLocalName);
        }
        return this.getState();
    },

    async getState() {
        this.$.react.coin();
        return [null, this.state];
    }
};

caf.init(module);
