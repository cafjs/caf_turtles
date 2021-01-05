const React = require('react');
const rB = require('react-bootstrap');
const cE = React.createElement;
const AppActions = require('../actions/AppActions');
const OpConstants = require('../constants/OpConstants');

const EXAMPLE_IMAGE = 'gcr.io/cafjs-k8/root-helloworld';

class ManagementPanel extends React.Component {
    constructor(props) {
        super(props);

        this.visible = {};
        // Op -> [name, #CAs, image, untrusted, manual, keepData]
        this.visible[OpConstants.DEPLOY] = [
            [true, false, true, true, false, false], //privileged
            [true, false, true, false, false, false]
        ];
        this.visible[OpConstants.FLEX] = [
            [true, true, false, false, false, false], //privileged
            [false, false, false, false, false, false]
        ];
        this.visible[OpConstants.RESTART] = [
            [true, false, false, false, false, false], //privileged
            [true, false, false, false, false, false]
        ];
        this.visible[OpConstants.DELETE] = [
            [true, false, false, false, false, true], //privileged
            [true, false, false, false, false, false]
        ];
        this.visible[OpConstants.SET_MANUAL] = [
            [true, false, false, false, true, false], //privileged
            [false, false, false, false, false, false]
        ];
        this.visible[OpConstants.TRIGGER_FLEX] = [
            [false, false, false, false, false, false], //privileged
            [false, false, false, false, false, false]
        ];

        this.handleAppNameChange = this.handleAppNameChange.bind(this);
        this.handleImageChange = this.handleImageChange.bind(this);
        this.handleNumberOfCAsChange = this.handleNumberOfCAsChange.bind(this);
        this.handleIsUntrustedChange = this.handleIsUntrustedChange.bind(this);
        this.handleKeepDataChange = this.handleKeepDataChange.bind(this);
        this.handleManualChange = this.handleManualChange.bind(this);
        this.handleChangeOp = this.handleChangeOp.bind(this);
        this.handleGo = this.handleGo.bind(this);
    }

    doDeploy(ev) {
        if (this.props.appName && (typeof this.props.appName === 'string') &&
            this.props.image && (typeof this.props.image === 'string')) {
            const isUntrusted = this.props.privileged ?
                this.props.isUntrusted :
                true;

            AppActions.addApp(this.props.ctx, this.props.appName,
                              this.props.image, isUntrusted, null);
        } else {
            console.log('Error: cannot deploy, missing inputs ' +
                        JSON.stringify({appName: this.props.appName,
                                        image: this.props.image}));
            AppActions.setError(this.props.ctx,
                                new Error('Cannot deploy, missing inputs'));
        }
    }

    doFlex(ev) {
        if (this.props.appName && (typeof this.props.appName === 'string') &&
            (typeof this.props.numberOfCAs === 'number')) {
            AppActions.flexApp(this.props.ctx, this.props.appName,
                               this.props.numberOfCAs);
        } else {
            console.log('Error: cannot flex, missing inputs ' +
                        JSON.stringify(this.props));
            AppActions.setError(this.props.ctx,
                                new Error('Cannot flex, missing inputs'));
        }
    }

    doDelete(ev) {
        if ((this.props.appName && (typeof this.props.appName === 'string')) &&
            (typeof this.props.keepData === 'boolean')) {
            AppActions.deleteApp(this.props.ctx, this.props.appName,
                                 this.props.keepData);
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

    doSetManual(ev) {
        if (this.props.appName && (typeof this.props.appName === 'string')) {
            AppActions.setManualFlex(this.props.ctx, this.props.appName,
                                     this.props.isManual);
        } else {
            console.log('Error: cannot set manual flex, missing inputs ' +
                        JSON.stringify(this.props));
            AppActions.setError(this.props.ctx, new Error(
                'Cannot set manual flex, missing inputs'
            ));
        }
    }

    doTriggerFlex(ev) {
        AppActions.triggerFlex(this.props.ctx);
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
        case OpConstants.SET_MANUAL:
            this.doSetManual(ev);
            break;
        case OpConstants.TRIGGER_FLEX:
            this.doTriggerFlex(ev);
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

    handleNumberOfCAsChange(ev) {
        let numberOfCAs = parseInt(ev.target.value);
        numberOfCAs = (isNaN(numberOfCAs) ? ev.target.value : numberOfCAs);
        AppActions.setLocalState(this.props.ctx, {numberOfCAs});
    }

    handleIsUntrustedChange(e) {
        AppActions.setLocalState(this.props.ctx, {isUntrusted: e});
    }

    handleKeepDataChange(e) {
        AppActions.setLocalState(this.props.ctx, {keepData: e});
    }

    handleChangeOp(e) {
        AppActions.setLocalState(this.props.ctx, {op: e});
    }

    handleManualChange(e) {
        AppActions.setLocalState(this.props.ctx, {isManual: e});
    }

    render() {
        const visibleIndex = this.props.privileged ? 0 : 1;
        const isVisible = this.visible[this.props.op][visibleIndex];

        const fields = [
            cE(rB.Col, {xs:12, sm:3, key:2355},
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
            cE(rB.Col, {xs:12, sm:2, key:2356},
               cE(rB.FormGroup, {
                   controlId: 'numberOfCAsId'
               },
                  cE(rB.ControlLabel, null, '#CAs'),
                  cE(rB.FormControl, {
                      type: 'text',
                      value: this.props.numberOfCAs,
                      placeholder: '0',
                      onChange: this.handleNumberOfCAsChange
                  })
                 )
              ),
            cE(rB.Col, {xs:12, sm:4, key:2357},
               cE(rB.FormGroup, {
                   controlId: 'imageId'
               },
                  cE(rB.ControlLabel, null, 'Docker Image'),
                  cE(rB.FormControl, {
                      type: 'text',
                      value: this.props.image,
                      placeholder: EXAMPLE_IMAGE,
                      onChange: this.handleImageChange
                  })
                 )
              ),
            cE(rB.Col, {xs:12, sm:3, key:2358},
               cE(rB.FormGroup, {
                   controlId: 'untrustedId'
               },
                  cE(rB.ControlLabel, null, 'Untrusted'),
                  cE(rB.ButtonToolbar, {className: 'extra-margin-bottom-block'},
                     cE(rB.ToggleButtonGroup, {
                         type: 'radio',
                         name: 'sandbox',
                         value: this.props.isUntrusted,
                         onChange: this.handleIsUntrustedChange
                     },
                        cE(rB.ToggleButton, {value: true}, 'On'),
                        cE(rB.ToggleButton, {value: false}, 'Off')
                       )
                    )
                 )
              ),
            cE(rB.Col, {xs:12, sm:3, key:2359},
               cE(rB.FormGroup, {
                   controlId: 'manualId'
               },
                  cE(rB.ControlLabel, null, 'Manual Flex'),
                  cE(rB.ButtonToolbar, {className: 'extra-margin-bottom-block'},
                     cE(rB.ToggleButtonGroup, {
                         type: 'radio',
                         name: 'sandbox',
                         value: this.props.isManual,
                         onChange: this.handleManualChange
                     },
                        cE(rB.ToggleButton, {value: true}, 'On'),
                        cE(rB.ToggleButton, {value: false}, 'Off')
                       )
                    )
                 )
              ),
            cE(rB.Col, {xs:12, sm:3, key:2369},
               cE(rB.FormGroup, {
                   controlId: 'keepDataId'
               },
                  cE(rB.ControlLabel, null, 'Keep data'),
                  cE(rB.ButtonToolbar, {className: 'extra-margin-bottom-block'},
                     cE(rB.ToggleButtonGroup, {
                         type: 'radio',
                         name: 'sandbox',
                         value: this.props.keepData,
                         onChange: this.handleKeepDataChange
                     },
                        cE(rB.ToggleButton, {value: true}, 'On'),
                        cE(rB.ToggleButton, {value: false}, 'Off')
                       )
                    )
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
                           }, [
                               cE(rB.ToggleButton, {key: 423,
                                                    value: OpConstants.DEPLOY},
                                  'Deploy'),
                               this.props.privileged ?
                                   cE(rB.ToggleButton, {
                                       key: 424,
                                       value: OpConstants.FLEX
                                   }, 'Flex') :
                                   null,
                               cE(rB.ToggleButton, {key: 425,
                                                    value: OpConstants.RESTART},
                                  'Reset'),
                               cE(rB.ToggleButton, {key: 426,
                                                    value: OpConstants.DELETE},
                                  'Delete'),
                               this.props.privileged ?
                                   cE(rB.ToggleButton, {
                                       key: 427,
                                       value: OpConstants.SET_MANUAL
                                   }, 'ManualFlex') :
                                   null,
                               this.props.privileged ?
                                   cE(rB.ToggleButton, {
                                       key: 428,
                                       value: OpConstants.TRIGGER_FLEX
                                   }, 'TriggerFlex') :
                                   null
                           ].filter(x => !!x)
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
