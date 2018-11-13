var React = require('react');
var rB = require('react-bootstrap');
var cE = React.createElement;

class AppStatus extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        var color = (this.props.isClosed ? 'text-danger' : 'text-success');
        return cE(rB.Glyphicon, {glyph: 'heart', className: color});
    }
};

module.exports = AppStatus;
