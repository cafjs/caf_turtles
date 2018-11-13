var React = require('react');
var rB = require('react-bootstrap');
var cE = React.createElement;
var AppActions = require('../actions/AppActions');
var OpConstants = require('../constants/OpConstants');

const EXAMPLE_IMAGE = 'gcr.io/cafjs-k8/root-helloworld';

class ManagementPanel extends React.Component {
    constructor(props) {
        super(props);

        this.visible = {};
        // Op -> [name, #instances, image]
        this.visible[OpConstants.DEPLOY] = [true, true, true];
        this.visible[OpConstants.FLEX] = [true, true, false];
        this.visible[OpConstants.RESTART] = [true, false, false];
        this.visible[OpConstants.DELETE] = [true, false, false];

        this.handleAppNameChange = this.handleAppNameChange.bind(this);
        this.handleImageChange = this.handleImageChange.bind(this);
        this.handleInstancesChange = this.handleInstancesChange.bind(this);
        this.handleChangeOp = this.handleChangeOp.bind(this);
        this.handleGo = this.handleGo.bind(this);
    }

    doDeploy(ev) {
        if (this.props.appName && (typeof this.props.appName === 'string') &&
            this.props.image && (typeof this.props.image === 'string') &&
            (typeof this.props.instances === 'number')) {
            AppActions.addApp(this.props.ctx, this.props.appName,
                              this.props.image,
                              this.props.instances, null);
        } else {
            console.log('Error: cannot deploy, missing inputs ' +
                        JSON.stringify({appName: this.props.appName,
                                        image: this.props.image,
                                        instances: this.props.instances}));
            AppActions.setError(this.props.ctx,
                                new Error('Cannot deploy, missing inputs'));
        }
    }

    doFlex(ev) {
        if (this.props.appName && (typeof this.props.appName === 'string') &&
            (typeof this.props.instances === 'number')) {
            AppActions.flexApp(this.props.ctx, this.props.appName,
                               this.props.instances);
        } else {
            console.log('Error: cannot flex, missing inputs ' +
                        JSON.stringify(this.props));
            AppActions.setError(this.props.ctx,
                                new Error('Cannot flex, missing inputs'));
        }
    }

    doDelete(ev) {
        if (this.props.appName && (typeof this.props.appName === 'string')) {
            AppActions.deleteApp(this.props.ctx, this.props.appName);
        } else {
            console.log('Error: cannot delete, missing inputs ' +
                        JSON.stringify(this.props));
            AppActions.setError(this.props.ctx,
                                new Error('Cannot delete, missing inputs'));
        }
    }

    doRestart(ev) {
        if (this.props.appName && (typeof this.props.appName === 'string')) {
            AppActions.restartApp(this.props.ctx, this.props.appName);
        } else {
            console.log('Error: cannot delete, missing inputs ' +
                        JSON.stringify(this.props));
            AppActions.setError(this.props.ctx,
                                new Error('Cannot restart, missing inputs'));
        }
    }

    handleGo(ev) {
        switch (this.props.op) {
        case OpConstants.DEPLOY:
            this.doDeploy(ev);
            break;
        case OpConstants.FLEX:
            this.doFlex(ev);
            break;
        case OpConstants.RESTART:
            this.doRestart(ev);
            break;
        case OpConstants.DELETE:
            this.doDelete(ev);
            break;
        default:
            console.log('Error: Invalid op ' + this.props.op);
        }
    }

    handleAppNameChange (ev) {
        AppActions.setLocalState(this.props.ctx, {
            appName: ev.target.value
        });
    }

    handleImageChange (ev) {
        AppActions.setLocalState(this.props.ctx, {
            image: ev.target.value
        });
    }

    handleInstancesChange (ev) {
        var instances = parseInt(ev.target.value);
        instances = (isNaN(instances) ? ev.target.value : instances);
        AppActions.setLocalState(this.props.ctx, {
            instances: instances
        });
    }

    handleChangeOp(e) {
        AppActions.setLocalState(this.props.ctx, { op: e });
    }

    render() {
        var isVisible = this.visible[this.props.op];
        var fields = [
            cE(rB.Col, { xs:12, sm:4, key:2355},
               cE(rB.FormGroup, {
                   controlId: 'appNameId'
               },
                  cE(rB.ControlLabel, null, 'App Local Name'),
                  cE(rB.FormControl, {
                      type: 'text',
                      value: this.props.appName,
                      placeholder: 'helloworld',
                      onChange: this.handleAppNameChange
                  })
                 )
              ),
            cE(rB.Col, { xs:12, sm:4, key:2356},
               cE(rB.FormGroup, {
                   controlId: 'instancesId'
               },
                  cE(rB.ControlLabel, null, '# App Instances'),
                  cE(rB.FormControl, {
                      type: 'text',
                      value: this.props.instances,
                      placeholder: '1',
                      onChange: this.handleInstancesChange
                  })
                 )
              ),
            cE(rB.Col, { xs:12, sm:4, key:2357},
               cE(rB.FormGroup, {
                   controlId: 'imageId'
               },
                  cE(rB.ControlLabel, null, 'Docker image'),
                  cE(rB.FormControl, {
                      type: 'text',
                      value: this.props.image,
                      placeholder: EXAMPLE_IMAGE,
                      onChange: this.handleImageChange
                  })
                 )
              )
        ].filter((x, i) => isVisible[i]);


        return cE(rB.Grid, {fluid: true},
                  cE(rB.Row, null,
                     cE(rB.Col, {xs:12, sm:12},
                        cE(rB.ButtonToolbar, {className: 'extra-margin-bottom'},
                           cE(rB.ToggleButtonGroup, {
                               type: 'radio',
                               name: 'operations',
                               value: this.props.op,
                               onChange: this.handleChangeOp
                           },
                              cE(rB.ToggleButton, {value: OpConstants.DEPLOY},
                                 'Deploy'),
                              cE(rB.ToggleButton, {value: OpConstants.FLEX},
                                 'Flex'),
                              cE(rB.ToggleButton, {value: OpConstants.RESTART},
                                 'Reset'),
                              cE(rB.ToggleButton, {value: OpConstants.DELETE},
                                 'Delete')
                             )
                          )
                       )
                    ),
                  cE(rB.Row, null, fields),
                  cE(rB.Row, null,
                     cE(rB.Col, {xs: 6, sm: 3},
                        cE(rB.Button, {
                            onClick: this.handleGo,
                            bsStyle: 'danger'
                        }, 'Go')
                       )
                    )
                 );
    }
};

module.exports = ManagementPanel;
