var React = require('react');
var rB = require('react-bootstrap');
var AppActions = require('../actions/AppActions');
var TableApps = require('./TableApps');
var AppStatus = require('./AppStatus');
var NewError = require('./NewError');
var ManagementPanel = require('./ManagementPanel');

var cE = React.createElement;

class MyApp extends React.Component {
    constructor(props) {
        super(props);
        this.state = this.props.ctx.store.getState();
    }

    componentDidMount() {
        if (!this.unsubscribe) {
            this.unsubscribe = this.props.ctx.store
                .subscribe(this._onChange.bind(this));
            this._onChange();
        }
    }

    componentWillUnmount() {
        if (this.unsubscribe) {
            this.unsubscribe();
            this.unsubscribe = null;
        }
    }

    _onChange() {
        if (this.unsubscribe) {
            this.setState(this.props.ctx.store.getState());
        }
    }

    render() {
        return cE("div", {className: "container-fluid"},
                  cE(NewError, {ctx: this.props.ctx, error: this.state.error}),
                  cE(rB.Panel, null,
                     cE(rB.Panel.Heading, null,
                        cE(rB.Panel.Title, null,
                           cE(rB.Grid, {fluid: true},
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
                                 }, "Turtles Deployer"),
                                 cE(rB.Col, {
                                     sm: 5,
                                     xs:11,
                                     className: 'text-right'
                                 }, this.state.fullName)
                                )
                             )
                          )
                       ),
                     cE(rB.Panel.Body, null,
                        cE(rB.Panel, null,
                           cE(rB.Panel.Heading, null,
                              cE(rB.Panel.Title, null, "Manage Applications")
                             ),
                           cE(rB.Panel.Body, null,
                              cE(ManagementPanel, {
                                  ctx: this.props.ctx,
                                  appName: this.state.appName,
                                  image: this.state.image,
                                  numberOfCAs: this.state.numberOfCAs,
                                  keepData: this.state.keepData,
                                  privileged: this.state.privileged,
                                  isUntrusted: this.state.isUntrusted,
                                  op: this.state.op
                              })
                             )
                          ),
                        cE(rB.Panel, null,
                           cE(rB.Panel.Heading, null,
                              cE(rB.Panel.Title, null, "Deployed Applications")
                             ),
                           cE(rB.Panel.Body, null,
                              cE(TableApps, {
                                  apps: this.state.apps,
                                  privileged: this.state.privileged
                              })
                             )
                          )
                       )
                    )
                 );
    }
};

module.exports = MyApp;
