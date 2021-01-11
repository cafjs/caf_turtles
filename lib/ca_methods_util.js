'use strict';
const caf = require('caf_core');
const json_rpc = caf.caf_transport.json_rpc;

const APP_SESSION = 'default';
const USER_APP = 'root-people';
const CA_USER_APP = json_rpc.DEFAULT_QUOTA_ID;

const notifyWebApp = function(self, msg) {
    self.$.session.notify([msg], APP_SESSION);
};

exports.cleanDeleted = function(self) {
    Object.keys(self.state.apps).forEach(function(app) {
        const info = self.state.apps[app];
        if (info.deleting && (!info.stat)) {
            delete self.state.apps[app];
        }
    });
};

exports.cleanPending = function(self) {
    Object.keys(self.state.pending).forEach(function(x) {
        const counter = self.state.pending[x];
        // if several timed out, just report one
        if (self.state.counter - counter > self.$.props.pulsesForTimeout) {
            self.state.error = {message: x + ':Error:Request timed out'};
            notifyWebApp(self, self.state);
            delete self.state.pending[x];
        }
    });
};

exports.triggerFlex = async function(self) {
    const appInfoNames = [];
    const appInfoKeys = [];
    Object.keys(self.state.apps).forEach(function(app) {
        const info = self.state.apps[app];
        if (!info.deleting && info.stat && !info.manual) {
            appInfoKeys.push(app);
            appInfoNames.push(info.appLocalName);
        }
    });

    if (appInfoNames.length === 0) {
        self.$.log && self.$.log.debug('No apps to autoFlex');
        return;
    }

    const [err, appsInfo] = await getAppInfo(self, appInfoNames);

    if (err) {
        self.$.log && self.$.log.debug(
            `autoFlex: Cannot flex ${appInfoNames} Error: ${err}`
        );
    } else {
        appsInfo.forEach((appInfo, i) => {
            const info = self.state.apps[appInfoKeys[i]];
            if (appInfo) {
                const {plan, usage} = appInfo;
                let numberOfCAs = 0;
                if (Array.isArray(usage) && (usage.length > 0)) {
                    numberOfCAs = usage[usage.length -1].count || 0;
                }
                self.$.log && self.$.log.warn(
                    `Flexing ${info.id}: plan ${plan} #CAs ${numberOfCAs}`
                );
                const reqId = self.$.deploy.flexApp(info.id, plan, numberOfCAs);
                self.state.pending[reqId] = self.state.counter;
            } else {
                self.$.log && self.$.log.debug(
                    `autoFlex: Cannot flex ${info.appLocalName}`
                );
            }
        });
    }
};

const getAppInfo = exports.getAppInfo = function(self, appLocalNames) {
    const username = json_rpc.splitName(self.__ca_getName__())[0];
    const userApp = json_rpc.joinNameArray([
        USER_APP,
        json_rpc.joinName(username, CA_USER_APP)
    ], json_rpc.APP_SEPARATOR);
    const apps = appLocalNames.map((x) => json_rpc.joinName(username, x));

    return self.$.crossapp.dirtyCall(
        userApp, json_rpc.DEFAULT_FROM, 'getDeploymentInfo',
        [self.scratch.tokenStr, apps], null, 0 // no retry
    );
};
