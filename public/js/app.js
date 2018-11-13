'use strict';

var React = require('react');
var ReactDOM = require('react-dom');
var ReactServer = require('react-dom/server');
var AppSession = require('./session/AppSession');
var MyApp = require('./components/MyApp');
var AppActions = require('./actions/AppActions');
var redux = require('redux');
var AppReducer = require('./reducers/AppReducer');
var cE = React.createElement;

var main = exports.main = function(data) {
    var ctx =  {store: redux.createStore(AppReducer)};
    if (typeof window === 'undefined') {
        // server side rendering
        AppActions.initServer(ctx, data);
        return ReactServer.renderToString(cE(MyApp, {ctx: ctx}));
    } else {
        return (async function() {
            try {
                await AppSession.connect(ctx);
                ReactDOM.hydrate(cE(MyApp, {ctx: ctx}),
                                 document.getElementById('content'));
            } catch (err) {
                console.log('Cannot connect:' + err);
            }
        })();
    }
};
