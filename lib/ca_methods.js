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
var caf = require('caf_core');
var json_rpc = caf.caf_transport.json_rpc;
var myUtils = caf.caf_components.myUtils;
var app = require('../public/js/app.js');
var USER_APP = 'root-people';
var CA_USER_APP = json_rpc.DEFAULT_QUOTA_ID;


var cleanDeleted = function(self) {
    Object.keys(self.state.apps).forEach(function(app) {
        var info = self.state.apps[app];
        if (info.deleting && (!info.stat)) {
            delete self.state.apps[app];
        }
    });
};

var cleanPending = function(self) {
    Object.keys(self.state.pending).forEach(function(x) {
        var counter = self.state.pending[x];
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
            var res = await this.statApps();
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

    async hello(key) {
        this.$.react.setCacheKey(key);
        return this.getState();
    },

    async cleanError() {
        delete this.state.error;
        return this.getState();
    },

    async statApps() {
        var appNames = Object.keys(this.state.apps);
        var ids = appNames.map(x => this.state.apps[x].id);
        var all = this.$.deploy.statApps(ids);
        appNames.forEach((x, i) => this.state.apps[x].stat = all[i]);
        return [null, this.state];
    },

    async addApp(appLocalName, image, instances, options) {
        try {
            if ((!this.state.privileged) &&
                (instances > this.$.props.maxInstances)) {
                var err = new Error('#instances: ' + instances +
                                    '  greater than ' +
                                    this.$.props.maxInstances);
                err['maxInstances'] = this.$.props.maxInstances;
                return [err];
            } else {
                var username = json_rpc.splitName(this.__ca_getName__())[0];
                var userApp = json_rpc.joinNameArray([
                    USER_APP,
                    json_rpc.joinName(username, CA_USER_APP)
                ], json_rpc.APP_SEPARATOR);
                var app = json_rpc.joinName(username, appLocalName);
                var res = await this.$.crossapp.dirtyCall(userApp,
                                                          json_rpc.DEFAULT_FROM,
                                                          'checkApp', [app]);
                if (res[0]) {
                    res[0].checkApp = true;
                    return [res[0]];
                } else {
                    var extra = myUtils.clone(options || {});
                    extra.instances = instances;
                    var id = this.$.deploy.createApp(appLocalName, image,
                                                     extra);
                    this.state.apps[appLocalName] = {
                        id: id,
                        appLocalName: appLocalName,
                        image: image,
                        instances: instances,
                        options: options,
                        stat: null
                    };
                    this.state.pending[id] = this.state.counter;
                    return this.getState();
                }
            }
        } catch (err) {
            return [err];
        }
    },

    async deleteApp(appLocalName) {
        var info = this.state.apps[appLocalName];
        if (info) {
            var reqId = this.$.deploy.deleteApp(info.id);
            info.deleting = true;
            this.state.pending[reqId] = this.state.counter;
        }
        return this.getState();
    },

    async restartApp(appLocalName) {
        var info = this.state.apps[appLocalName];
        if (info) {
            var reqId = this.$.deploy.restartApp(info.id);
            this.state.pending[reqId] = this.state.counter;
        } else {
            this.$.log && this.$.log.debug('Cannot restart missing app :' +
                                           appLocalName);
        }
        return this.getState();
    },

    async flexApp(appLocalName, instances) {
        var info = this.state.apps[appLocalName];
        if (info) {
            var reqId = this.$.deploy.flexApp(info.id, instances);
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
