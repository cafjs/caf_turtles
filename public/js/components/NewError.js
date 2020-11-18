var React = require('react');
var rB = require('react-bootstrap');
var cE = React.createElement;
var AppActions = require('../actions/AppActions');

class NewError extends React.Component {
    constructor(props) {
        super(props);
        this.doDismissError = this.doDismissError.bind(this);
    }

    doDismissError(ev) {
        AppActions.resetError(this.props.ctx);
    }

    errorMessage() {
        if (this.props.error) {
            if (this.props.error.checkApp) {
                return 'Unknown app: Register the app first using the main' +
                    ' menu, i.e., the one in the top left corner.' +
                    ' Registration initiates regular payments to cover' +
                    ' infrastructure costs. To avoid future payments please' +
                    ' unregister your app after permanently deleting' +
                    ' it.';
            } else if (this.props.error.maxInstances) {
                return 'Max number of instances exceeded';
            } else {
                return this.props.error.message;
            }
        } else {
            return '';
        }
    }

    render() {
        return cE(rB.Modal,{show: !!this.props.error,
                            onHide: this.doDismissError,
                            animation: false},
                  cE(rB.Modal.Header, {
                      className : "bg-warning text-warning",
                      closeButton: true
                  }, cE(rB.Modal.Title, null, "Error")),
                  cE(rB.Modal.Body, null,
                     cE('p', null, 'Message:'),
                     cE(rB.Alert, {bsStyle: 'danger'},
                        this.errorMessage())
                    ),
                  cE(rB.Modal.Footer, null,
                     cE(rB.Button, {onClick: this.doDismissError}, "Continue")
                    )
                 );
    }
};

module.exports = NewError;
