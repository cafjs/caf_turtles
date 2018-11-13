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

    render() {
        return cE(rB.Modal,{show: !!this.props.error,
                            onHide: this.doDismissError,
                            animation: false},
                  cE(rB.Modal.Header, {
                      className : "bg-warning text-warning",
                      closeButton: true
                  }, cE(rB.Modal.Title, null, "Error")),
                  cE(rB.ModalBody, null,
                     cE('p', null, 'Message:'),
                     cE(rB.Alert, {bsStyle: 'danger'},
                        this.props.error && this.props.error.message)
                    ),
                  cE(rB.Modal.Footer, null,
                     cE(rB.Button, {onClick: this.doDismissError}, "Continue")
                    )
                 );
    }
};

module.exports = NewError;
