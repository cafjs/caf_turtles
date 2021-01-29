const React = require('react');
const rB = require('react-bootstrap');
const cE = React.createElement;
const AppActions = require('../actions/AppActions');
const REGEXP_BASH_VAR = /^[a-zA-Z][a-zA-Z0-9_]*$/;

class EnvProps extends React.Component {

    constructor(props) {
        super(props);
        this.doHide = this.doHide.bind(this);
        this.doUpdateProps = this.doUpdateProps.bind(this);
        this.submit = this.submit.bind(this);
        this.handleProperties = this.handleProperties.bind(this);
    }

    doHide(ev) {
        AppActions.setLocalState(this.props.ctx, {showEnvProps: false});
    }

    handleProperties(ev) {
        AppActions.setLocalState(this.props.ctx, {
           envPropsStr: ev.target.value
        });
    }

    submit(ev) {
        if (ev.key === 'Enter') {
            ev.preventDefault();
            this.doUpdateProps(ev);
        }
    }

    doUpdateProps(ev) {
        if (this.props.envPropsStr) {
            let parseError = false;
            try {
                const obj = JSON.parse(this.props.envPropsStr);
                if (obj && (typeof obj === 'object')) {
                    const bad = Object.keys(obj)
                          .filter(k => !k.match(REGEXP_BASH_VAR) ||
                                  (typeof obj[k] !== 'string'));
                    parseError = bad.length > 0;
                } else {
                    parseError = true;
                }
            } catch (ex) {
                parseError = true;
            }
            if (parseError) {
                const msg = 'Invalid JSON or keys are not valid bash ' +
                      'variables, i.e., alphanumeric or `_` only, and ' +
                      'starting with a character, or values are not strings.' +
                      ` \n ${this.props.envPropsStr}`;
                AppActions.setError(this.props.ctx, new Error(msg));
            } else {
                this.doHide();
            }
        } else {
            this.doHide();
        }
    }

    render() {
        return cE(rB.Modal, {show: !!this.props.showEnvProps,
                             onHide: this.doHide,
                             animation: false},
                  cE(rB.Modal.Header, {
                         className : "bg-warning text-warning",
                         closeButton: true
                     },
                     cE(rB.Modal.Title, null, 'Application Properties')
                    ),
                  cE(rB.Modal.Body, null,
                     cE(rB.Form, {horizontal: true},
                        cE(rB.FormGroup, {controlId: 'propsId'},
                           cE(rB.Col, {sm:4, xs: 12},
                              cE(rB.ControlLabel, null,
                                 'Properties')
                             ),
                           cE(rB.Col, {sm:8, xs: 12},
                              cE(rB.FormControl, {
                                  type: 'text',
                                  style: {wordWrap: 'break-word'},
                                  value: this.props.envPropsStr || '',
                                  placeholder: '{"FOO_XX": "1", "BAR": "h1"}',
                                  onChange: this.handleProperties,
                                  onKeyPress: this.submit
                              })
                             )
                          )
                       )
                    ),
                  cE(rB.Modal.Footer, null,
                     cE(rB.ButtonGroup, null,
                        cE(rB.Button, {
                            bsStyle: 'primary',
                            onClick: this.doHide
                        }, 'Cancel'),
                        cE(rB.Button, {
                               onClick: this.doUpdateProps,
                               bsStyle: 'danger'
                        }, 'Update')
                       )
                    )
                 );
    }
};

module.exports = EnvProps;
