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

"use strict";
var caf = require('caf_core');
var myUtils = caf.caf_components.myUtils;
var app = require('../public/js/app.js');


var cleanDeleted = function(self) {
    Object.keys(self.state.apps).forEach(function(app) {
        var info = self.state.apps[app];
        if (info.deleting  && (!info.stat)) {
            delete self.state.apps[app];
        }
    });
};

exports.methods = {
    '__ca_init__' : function(cb) {
        this.state.counter = -1;
        this.state.apps = {};
        this.$.session.limitQueue(1); // only the last notification
        this.state.fullName = this.$.security.getAppName() + '#' +
            this.__ca_getName__();
        cb(null);
    },

    '__ca_pulse__' : function(cb) {
        var self = this;
        this.$._.$.log && this.$._.$.log.debug('calling PULSE!!! ' +
                                               this.state.counter);
        if (!myUtils.deepEqual(this.scratch.oldApps, this.state.apps)) {
            this.$.session.notify([this.state.counter], 'default');
        }
        this.scratch.oldApps = myUtils.deepClone(this.state.apps);

        this.state.counter = this.state.counter + 1;
        cleanDeleted(this);
        this.statApps(function(err, data) {
            self.$.react.render(app.main, [data]);
            cb(err, data);
        });
    },

    hello : function(key, cb) {
        this.$.react.setCacheKey(key);
        this.getState(cb);
    },

    statApps: function(cb) {
        var self = this;
        var appNames = Object.keys(this.state.apps);
        var ids = appNames.map(function(x) {
            return  self.state.apps[x].id;
        });
        var all = this.$.deploy.statApps(ids);
        appNames.forEach(function(x, i) {
            self.state.apps[x].stat = all[i];
        });
        cb(null, this.state);
    },

    addApp : function(appLocalName, image, instances, options, cb) {
        var extra = myUtils.clone(options || {});
        extra.instances = instances;
        var id = this.$.deploy.createApp(appLocalName, image, extra);
        this.state.apps[appLocalName] = {
            id : id,
            appLocalName: appLocalName,
            image: image,
            instances : instances,
            options : options,
            stat : null
        };
        this.getState(cb);
    },

    deleteApp: function(appLocalName, cb) {
        var info =  this.state.apps[appLocalName];
        if (info) {
            this.$.deploy.deleteApp(info.id);
            info.deleting = true;
        }
        this.getState(cb);
    },

    restartApp: function(appLocalName, cb) {
        var info =  this.state.apps[appLocalName];
        if (info) {
            this.$.deploy.restartApp(info.id);
        } else {
            this.$.log && this.$.log.debug('Cannot restart missing app :' +
                                           appLocalName);
        }
        this.getState(cb);
    },

    flexApp:  function(appLocalName, instances, cb) {
        var info =  this.state.apps[appLocalName];
        if (info) {
            this.$.deploy.flexApp(info.id, instances);
            info.instances = instances;
        } else {
            this.$.log && this.$.log.debug('Cannot flex missing app :' +
                                           appLocalName);
        }
        this.getState(cb);
    },

    getState : function(cb) {
        this.$.react.coin();
        cb(null, this.state);
    }
};

caf.init(module);

