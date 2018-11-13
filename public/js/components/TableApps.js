var React = require('react');
var rB = require('react-bootstrap');
var cE = React.createElement;

class TableApps extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        var self = this;
        var renderOneRow = function(i, appName, app) {
            var tasksRunning = app.stat && parseInt(app.stat.tasksRunning);
            tasksRunning = ((typeof tasksRunning ===  'number') &&
                            (!isNaN(tasksRunning)) ? tasksRunning : '?');
            var runningStyle  = ((app.instances === tasksRunning) ?
                                 {key:10*i+5, 'className':'text-success'} :
                                 {key:10*i+5, 'className':'text-danger'});
            var version = app.stat && app.stat.version || '?';
            return  cE('tr', {key:10*i},
                       cE('td', {key:10*i+1}, appName),
//                       cE('td', {key:10*i+2}, app.id),
                       cE('td', {key:10*i+4}, app.instances),
                       cE('td', runningStyle, tasksRunning),
                       cE('td', {key:10*i+3}, app.image),
                       cE('td', {key:10*i+6}, version)
                      );
        };
        var renderRows = function() {
            var sorted = Object.keys(self.props.apps || {}).sort();
            return sorted.map(function(x, i) {
                return renderOneRow(i+1, x, self.props.apps[x]);
            });
        };
        return cE(rB.Table, {striped: true, responsive: true, bordered: true,
                             condensed: true, hover: true},
                  cE('thead', {key:0},
                     cE('tr', {key:1},
                        cE('th', {key:2}, 'Name'),
//                        cE('th', {key:3}, 'ID'),
                        cE('th', {key:5}, '#'),
                        cE('th', {key:6}, 'OK'),
                        cE('th', {key:4}, 'Image'),
                        cE('th', {key:7}, 'Version')
                       )
                    ),
                  cE('tbody', {key:8}, renderRows())
                 );
    }
};

module.exports = TableApps;
