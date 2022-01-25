'use strict';

const React = require('react');
const rB = require('react-bootstrap');
const cE = React.createElement;
const AppActions = require('../actions/AppActions');

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
        AppActions.setLocalState(this.props.ctx, {
            secret: e.target.value
        });
    }

    handleWebhookChange(e) {
        AppActions.setLocalState(this.props.ctx, {webhookActive: e});
    }

    doConfigure(ev) {
        if (this.props.webhookActive) {
            AppActions.registerWebhook(this.props.ctx,  this.props.appName,
                                       this.props.secret);
        } else {
            AppActions.registerWebhook(this.props.ctx,  this.props.appName);
        }
        this.doDismiss();
    }

    render() {
        const getURL = () => 'https://...';
        const whURL = `${getURL()}/webhooks/${this.props.fullName}-` +
              this.props.appName;
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
                        cE(rB.FormGroup, {controlId: 'url'},
                           cE(rB.Col, {sm:3, xs: 12},
                              cE(rB.ControlLabel, null, 'URL')
                             ),
                           cE(rB.Col, {sm:9, xs: 12},
                              cE(rB.FormControl.Static, null, whURL)
                             )
                          )
                       )
                    ),
                  cE(rB.Modal.Footer, null,
                     cE(rB.ButtonGroup,
                        cE(rB.Button, {onClick: this.doDismiss}, 'Cancel'),
                        cE(rB.Button, {onClick: this.doConfigure,
                                       bsStyle: 'danger'}, 'Configure')
                       )
                    )
                 );
    }
};

module.exports = DisplayWebhook;
