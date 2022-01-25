'use strict';

const React = require('react');
const rB = require('react-bootstrap');
const cE = React.createElement;
const AppActions = require('../actions/AppActions');
const json_rpc = require('caf_transport').json_rpc;

class DisplayWebhook extends React.Component {

    constructor(props) {
        super(props);
        this.doDismiss = this.doDismiss.bind(this);
        this.handleSecret = this.handleSecret.bind(this);
        this.handleWebhookChange = this.handleWebhookChange.bind(this);
        this.doConfigure = this.doConfigure.bind(this);
    }

    doDismiss(ev) {
        AppActions.setLocalState(this.props.ctx, {showWebhook: false});
    }

    handleSecret(e) {
        AppActions.setLocalState(this.props.ctx, {secret: e.target.value});
    }

    handleWebhookChange(e) {
        AppActions.setLocalState(this.props.ctx, {webhookActive: e});
    }

    doConfigure(ev) {
        if (this.props.webhookActive) {
            AppActions.registerWebhook(this.props.ctx, this.props.appName,
                                       this.props.secret);
        } else {
            AppActions.unregisterWebhook(this.props.ctx, this.props.appName);
        }
        this.doDismiss();
    }

    render() {
        const caName = json_rpc.splitName(this.props.fullName || 'p#q',
                                          json_rpc.APP_SEPARATOR)[1];
        const thisURL = (typeof window !== 'undefined') ?
             window.location.origin :
            'https://root-turtles.cafjs.com';
        const whURL = `${thisURL}/webhook/${caName}-${this.props.appName}`;

        return cE(rB.Modal, {show: !!this.props.showWebhook,
                             onHide: this.doDismiss,
                             animation: false},
                  cE(rB.Modal.Header, {
                      className : 'bg-warning text-warning',
                      closeButton: true},
                     cE(rB.Modal.Title, null, 'Configure Webhook')
                    ),
                  cE(rB.ModalBody, null,
                     cE(rB.Form, {horizontal: true},
                        [
                            cE(rB.FormGroup, {controlId: 'url', key: 12},
                               cE(rB.Col, {sm: 4, xs: 12},
                                  cE(rB.ControlLabel, null, 'URL')
                                 ),
                               cE(rB.Col, {sm: 8, xs: 12},
                                  cE(rB.FormControl.Static, null, whURL)
                                 )
                              ),
                            cE(rB.FormGroup, {controlId: 'eventId', key: 32},
                               cE(rB.Col, {sm: 4, xs: 12},
                                  cE(rB.ControlLabel, null, 'GitHub Event')
                                 ),
                               cE(rB.Col, {sm: 8, xs: 12},
                                  cE(rB.FormControl.Static, null,
                                     'Workflow Runs')
                                 )
                              ),
                            this.props.webhookActive ?
                                cE(rB.FormGroup, {controlId: 'secret', key: 42},
                                   cE(rB.Col, {sm: 4, xs: 12},
                                      cE(rB.ControlLabel, null, 'Secret')
                                     ),
                                   cE(rB.Col, {sm: 8, xs: 12},
                                      cE(rB.FormControl, {
                                          type: 'password',
                                          value: this.props.secret,
                                          onChange: this.handleSecret
                                      })
                                     )
                                  ) : null,
                            cE(rB.FormGroup, {controlId: 'switchId', key: 62},
                               cE(rB.Col, {sm: 4, xs: 12},
                                  cE(rB.ControlLabel, null, 'Webhook Active')
                                 ),
                               cE(rB.Col, {sm: 8, xs: 12},
                                  cE(rB.ButtonToolbar, null,
                                     cE(rB.ToggleButtonGroup, {
                                         type: 'radio',
                                         name: 'sandbox',
                                         value: this.props.webhookActive,
                                         onChange: this.handleWebhookChange
                                     },
                                        cE(rB.ToggleButton, {value: true},
                                           'On'),
                                        cE(rB.ToggleButton, {value: false},
                                           'Off')
                                       )
                                    )
                                 )
                              )
                        ].filter(x => !!x)
                       )
                    ),
                  cE(rB.Modal.Footer, null,
                     cE(rB.ButtonGroup, null,
                        cE(rB.Button, {onClick: this.doDismiss}, 'Cancel'),
                        cE(rB.Button, {onClick: this.doConfigure,
                                       bsStyle: 'danger'}, 'Configure')
                       )
                    )
                 );
    }
};

module.exports = DisplayWebhook;
