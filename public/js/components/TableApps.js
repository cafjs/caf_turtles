const React = require('react');
const rB = require('react-bootstrap');
const cE = React.createElement;

class TableApps extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        const self = this;
        const renderOneRow = function(i, appName, app) {
            let tasksRunning = app.stat && parseInt(app.stat.tasksRunning);
            tasksRunning = ((typeof tasksRunning ===  'number') &&
                            !isNaN(tasksRunning) ? tasksRunning : '?');

            const appProps = app.stat && app.stat.props || null;

            const numberOfCAs = appProps && appProps.numberOfCAs || 0;

            let instances = appProps && appProps.app &&
                appProps.app.instances || 0;

            const runningStyle  = (instances === tasksRunning) ?
                {key:10*i+5, 'className':'text-success'} :
                {key:10*i+5, 'className':'text-danger'};

            const version = app.stat && app.stat.version || '?';

            const isIncubator = appProps && appProps.app &&
                appProps.app.isIncubator;
            if (isIncubator) {
                tasksRunning = tasksRunning / 10;
                instances = instances / 10;
            }

            const toTF = (x) => x ? 'T' : 'F';
            const isUntrusted = appProps && appProps.app &&
                toTF(appProps.app.isUntrusted) || '?';
            const disableCDN =  appProps && appProps.app &&
                  toTF(appProps.app.isCDN &&
                       (!appProps.app.appCDN || (appProps.app.appCDN === '""'))
                      ) || '?';
            const isDedicated = appProps && appProps.redis &&
                toTF(appProps.redis.isDedicatedVolume) || '?';
            const isManual = toTF(app.manual);
            const summary = `${isUntrusted}/${isDedicated}/${isManual}`;

            return  cE('tr', {key:10*i},
                       [
                           cE('td', {key:10*i+1}, appName),
                           cE('td', {key:10*i+4}, instances),
                           cE('td', runningStyle, tasksRunning),
                           cE('td', {key:10*i+8}, numberOfCAs),
                           cE('td', {key:10*i+2}, disableCDN),
                           self.props.privileged ?
                               cE('td', {key:10*i+7}, summary) :
                               null,
                           cE('td', {key:10*i+3}, app.image),
                           cE('td', {key:10*i+6}, version)
                       ].filter((x) => !!x)
                      );
        };
        const renderRows = function() {
            const sorted = Object.keys(self.props.apps || {}).sort();
            return sorted.map(function(x, i) {
                return renderOneRow(i+1, x, self.props.apps[x]);
            });
        };
        return cE(rB.Table, {striped: true, responsive: true, bordered: true,
                             condensed: true, hover: true},
                  cE('thead', {key:0},
                     cE('tr', {key:1}, [
                         cE('th', {key:2}, 'Name'),
                         cE('th', {key:5}, '#'),
                         cE('th', {key:6}, 'OK'),
                         cE('th', {key:8}, '#CAs'),
                         cE('th', {key: 3}, 'No CDN'),
                         this.props.privileged ?
                             cE('th', {key:9}, 'U/D/M') :
                             null,
                         cE('th', {key:4}, 'Image'),
                         cE('th', {key:7}, 'Version')
                     ].filter((x) => !!x)
                       )
                    ),
                  cE('tbody', {key:8}, renderRows())
                 );
    }
};

module.exports = TableApps;
