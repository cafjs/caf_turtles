var AppConstants = require('../constants/AppConstants');
var OpConstants = require('../constants/OpConstants');

var AppReducer = function(state, action) {
    if (typeof state === 'undefined') {
        return  {counter: -1, apps: {}, numberOfCAs: 0, isClosed: false,
                 image: '', appName: '', op: OpConstants.DEPLOY,
                 keepData: false, isManual: false,
                 privileged: false, isUntrusted: true};
    } else {
        switch(action.type) {
        case AppConstants.APP_UPDATE:
        case AppConstants.APP_NOTIFICATION:
            return Object.assign({}, state, action.state);
        case AppConstants.APP_ERROR:
            return Object.assign({}, state, {error: action.error});
        case AppConstants.WS_STATUS:
            return Object.assign({}, state, {isClosed: action.isClosed});
        default:
            return state;
        }
    };
};

module.exports = AppReducer;
