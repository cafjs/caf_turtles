var React = require('react');
var rB = require('react-bootstrap');
var AppStore = require('../stores/AppStore');
var AppActions = require('../actions/AppActions');
var TableApps = require('./TableApps');
var AppStatus = require('./AppStatus');
var NewError = require('./NewError');

var cE = React.createElement;

var MyApp = {
    getInitialState: function() {
        return AppStore.getState();
    },
    componentDidMount: function() {
        AppStore.addChangeListener(this._onChange);
    },
    componentWillUnmount: function() {
        AppStore.removeChangeListener(this._onChange);
    },
    _onChange : function(ev) {
        this.setState(AppStore.getState());
    },
    doDeploy : function(ev) {
        if ((typeof this.state.appName === 'string') &&
            (typeof this.state.image === 'string') &&
            (typeof this.state.instances === 'number')) {
            AppActions.addApp(this.state.appName, this.state.image,
                              this.state.instances, null);
        } else {
            console.log('Error: cannot deploy, missing inputs ' +
                        JSON.stringify(this.state));
            AppActions.setError(new Error('Cannot deploy, missing inputs'));
        }
    },
    doFlex : function(ev) {
        if ((typeof this.state.appName === 'string') &&
            (typeof this.state.instances === 'number')) {
            AppActions.flexApp(this.state.appName, this.state.instances);
        } else {
            console.log('Error: cannot flex, missing inputs ' +
                        JSON.stringify(this.state));
            AppActions.setError(new Error('Cannot flex, missing inputs'));
        }
    },
    doDelete : function(ev) {
        if ((typeof this.state.appName === 'string')) {
            AppActions.deleteApp(this.state.appName);
        } else {
            console.log('Error: cannot delete, missing inputs ' +
                        JSON.stringify(this.state));
            AppActions.setError(new Error('Cannot delete, missing inputs'));
        }
    },
    doRestart : function(ev) {
        if ((typeof this.state.appName === 'string')) {
            AppActions.restartApp(this.state.appName);
        } else {
            console.log('Error: cannot delete, missing inputs ' +
                        JSON.stringify(this.state));
            AppActions.setError(new Error('Cannot restart, missing inputs'));
        }
    },
    handleAppNameChange : function() {
        AppActions.setLocalState({
            appName: this.refs.appName.getValue()
        });
    },
    handleImageChange : function() {
        AppActions.setLocalState({
            image: this.refs.image.getValue()
        });
    },
    handleInstancesChange : function() {
        var instances = parseInt(this.refs.instances.getValue());
        instances = (isNaN(instances) ? this.refs.instances.getValue() :
                     instances);
        AppActions.setLocalState({
            instances: instances
        });
    },
    render: function() {
        return cE("div", {className: "container-fluid"},
                  cE(NewError, {error: this.state.error}),
                  cE(rB.Panel, {header: cE(rB.Grid, {fluid: true},
                                           cE(rB.Row, null,
                                              cE(rB.Col, {sm:1, xs:1},
                                                 cE(AppStatus, {
                                                        isClosed:
                                                        this.state.isClosed
                                                    })
                                                ),
                                              cE(rB.Col, {
                                                     sm: 5,
                                                     xs:10,
                                                     className: 'text-right'
                                                 },
                                                 "Turtles Deployer"
                                                ),
                                              cE(rB.Col, {
                                                     sm: 5,
                                                     xs:11,
                                                     className: 'text-right'
                                                 },
                                                 this.state.fullName
                                                )
                                             )
                                          )
                               },
                     cE(rB.Panel, {header: "Manage Applications"},
                        cE(rB.Grid, {fluid: true},
                           cE(rB.Row, null,
                              cE(rB.Col, { xs:12, sm:4},
                                 cE(rB.Input, {
                                     type: 'text',
                                     value: this.state.appName,
                                     label: 'App Local Name',
                                     ref: 'appName',
                                     placeholder: 'helloworld',
                                     onChange: this.handleAppNameChange
                                 })
                                ),
                              cE(rB.Col, { xs:12, sm:4},
                                 cE(rB.Input, {
                                     type: 'text',
                                     value: this.state.image,
                                     label: 'Docker image',
                                     ref: 'image',
                                     placeholder: 'registry.cafjs.com:32000/root-helloworld',
                                     onChange: this.handleImageChange
                                 })
                                ),
                              cE(rB.Col, { xs:12, sm:4},
                                 cE(rB.Input, {
                                     type: 'text',
                                     value: this.state.instances,
                                     label: '# App Instances',
                                     ref: 'instances',
                                     placeholder: '1',
                                     onChange: this.handleInstancesChange
                                 })
                                )
                             ),
                           cE(rB.Row, null,
                              cE(rB.Col, { xs: 3, sm:3},
                                 cE(rB.Button, {
                                     onClick: this.doDeploy,
                                     bsStyle: 'primary'
                                 }, 'Deploy')
                                ),
                              cE(rB.Col, { xs: 3, sm:3},
                                 cE(rB.Button, {
                                     onClick: this.doFlex,
                                     bsStyle: 'primary'
                                 }, 'Flex')
                                ),
                              cE(rB.Col, { xs: 3, sm:3},
                                 cE(rB.Button, {
                                     onClick: this.doRestart,
                                     bsStyle: 'primary'
                                 }, 'Restart')
                                ),
                              cE(rB.Col, { xs: 3, sm:3},
                                 cE(rB.Button, {
                                     onClick: this.doDelete,
                                     bsStyle: 'danger'
                                 }, 'Delete')
                                )
                             )
                          )
                       ),
                     cE(rB.Panel, {header: "Deployed Applications"},
                        cE(TableApps, {apps :this.state.apps})
                       )
                    )
                 );
    }
};

module.exports = React.createClass(MyApp);
