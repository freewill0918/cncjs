import _ from 'lodash';
import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';
import { ProgressBar } from 'react-bootstrap';
import mapGCodeToText from '../../lib/gcode-text';
import i18n from '../../lib/i18n';
import Panel from '../../components/Panel';
import Toggler from '../../components/Toggler';
import ControllerState from './ControllerState';
import ControllerSettings from './ControllerSettings';
import Toolbar from './Toolbar';
import Overrides from './Overrides';
import {
    MODAL_CONTROLLER_STATE,
    MODAL_CONTROLLER_SETTINGS
} from './constants';
import styles from './index.styl';

class Grbl extends PureComponent {
    static propTypes = {
        state: PropTypes.object,
        actions: PropTypes.object
    };

    // https://github.com/grbl/grbl/wiki/Interfacing-with-Grbl
    // Grbl v0.9: BLOCK_BUFFER_SIZE (18), RX_BUFFER_SIZE (128)
    // Grbl v1.1: BLOCK_BUFFER_SIZE (16), RX_BUFFER_SIZE (128)
    plannerBufferMax = 0;
    plannerBufferMin = 0;
    receiveBufferMax = 128;
    receiveBufferMin = 0;

    render() {
        const { state, actions } = this.props;
        const none = '–';
        const panel = state.panel;
        const controllerState = state.controller.state || {};
        const parserState = _.get(controllerState, 'parserstate', {});
        const activeState = _.get(controllerState, 'status.activeState') || none;
        const feedrate = _.get(controllerState, 'status.feedrate', _.get(parserState, 'feedrate', none));
        const spindle = _.get(controllerState, 'status.spindle', _.get(parserState, 'spindle', none));
        const tool = _.get(parserState, 'tool', none);
        const ov = _.get(controllerState, 'status.ov', []);
        const [ovF = 0, ovR = 0, ovS = 0] = ov;
        const buf = _.get(controllerState, 'status.buf', {});
        const modal = _.mapValues(parserState.modal || {}, mapGCodeToText);

        this.plannerBufferMax = Math.max(this.plannerBufferMax, buf.planner) || this.plannerBufferMax;
        this.receiveBufferMax = Math.max(this.receiveBufferMax, buf.rx) || this.receiveBufferMax;

        return (
            <div>
                {state.modal.name === MODAL_CONTROLLER_STATE &&
                <ControllerState state={state} actions={actions} />
                }
                {state.modal.name === MODAL_CONTROLLER_SETTINGS &&
                <ControllerSettings state={state} actions={actions} />
                }
                <Toolbar state={state} actions={actions} />
                <Overrides ovF={ovF} ovS={ovS} ovR={ovR} />
                {!_.isEmpty(buf) &&
                <Panel className={styles.panel}>
                    <Panel.Heading className={styles['panel-heading']}>
                        <Toggler
                            className="clearfix"
                            onToggle={actions.toggleQueueReports}
                            title={panel.queueReports.expanded ? i18n._('Hide') : i18n._('Show')}
                        >
                            <div className="pull-left">{i18n._('Queue Reports')}</div>
                            <Toggler.Icon
                                className="pull-right"
                                expanded={panel.queueReports.expanded}
                            />
                        </Toggler>
                    </Panel.Heading>
                    {panel.queueReports.expanded &&
                    <Panel.Body>
                        <div className="row no-gutters">
                            <div className="col col-xs-4">
                                {i18n._('Planner Buffer')}
                            </div>
                            <div className="col col-xs-8">
                                <ProgressBar
                                    style={{ marginBottom: 0 }}
                                    bsStyle="info"
                                    min={this.plannerBufferMin}
                                    max={this.plannerBufferMax}
                                    now={buf.planner}
                                    label={
                                        <span className={styles.progressbarLabel}>
                                            {buf.planner}
                                        </span>
                                    }
                                />
                            </div>
                        </div>
                        <div className="row no-gutters">
                            <div className="col col-xs-4">
                                {i18n._('Receive Buffer')}
                            </div>
                            <div className="col col-xs-8">
                                <ProgressBar
                                    style={{ marginBottom: 0 }}
                                    bsStyle="info"
                                    min={this.receiveBufferMin}
                                    max={this.receiveBufferMax}
                                    now={buf.rx}
                                    label={
                                        <span className={styles.progressbarLabel}>
                                            {buf.rx}
                                        </span>
                                    }
                                />
                            </div>
                        </div>
                    </Panel.Body>
                    }
                </Panel>
                }
                <Panel className={styles.panel}>
                    <Panel.Heading className={styles['panel-heading']}>
                        <Toggler
                            className="clearfix"
                            onToggle={() => {
                                actions.toggleStatusReports();
                            }}
                            title={panel.statusReports.expanded ? i18n._('Hide') : i18n._('Show')}
                        >
                            <div className="pull-left">{i18n._('Status Reports')}</div>
                            <Toggler.Icon
                                className="pull-right"
                                expanded={panel.statusReports.expanded}
                            />
                        </Toggler>
                    </Panel.Heading>
                    {panel.statusReports.expanded &&
                    <Panel.Body>
                        <div className="row no-gutters">
                            <div className="col col-xs-4">
                                {i18n._('State')}
                            </div>
                            <div className="col col-xs-8">
                                <div className={styles.well}>
                                    {activeState}
                                </div>
                            </div>
                        </div>
                        <div className="row no-gutters">
                            <div className="col col-xs-4">
                                {i18n._('Feed Rate')}
                            </div>
                            <div className="col col-xs-8">
                                <div className={styles.well}>
                                    {feedrate}
                                </div>
                            </div>
                        </div>
                        <div className="row no-gutters">
                            <div className="col col-xs-4">
                                {i18n._('Spindle')}
                            </div>
                            <div className="col col-xs-8">
                                <div className={styles.well}>
                                    {spindle}
                                </div>
                            </div>
                        </div>
                        <div className="row no-gutters">
                            <div className="col col-xs-4">
                                {i18n._('Tool Number')}
                            </div>
                            <div className="col col-xs-8">
                                <div className={styles.well}>
                                    {tool}
                                </div>
                            </div>
                        </div>
                    </Panel.Body>
                    }
                </Panel>
                <Panel className={styles.panel}>
                    <Panel.Heading className={styles['panel-heading']}>
                        <Toggler
                            className="clearfix"
                            onToggle={() => {
                                actions.toggleModalGroups();
                            }}
                            title={panel.modalGroups.expanded ? i18n._('Hide') : i18n._('Show')}
                        >
                            <div className="pull-left">{i18n._('Modal Groups')}</div>
                            <Toggler.Icon
                                className="pull-right"
                                expanded={panel.modalGroups.expanded}
                            />
                        </Toggler>
                    </Panel.Heading>
                    {panel.modalGroups.expanded &&
                    <Panel.Body>
                        <div className="row no-gutters">
                            <div className="col col-xs-4">
                                {i18n._('Motion')}
                            </div>
                            <div className="col col-xs-8">
                                <div className={styles.well} title={modal.motion}>
                                    {modal.motion || none}
                                </div>
                            </div>
                        </div>
                        <div className="row no-gutters">
                            <div className="col col-xs-4">
                                {i18n._('Coordinate')}
                            </div>
                            <div className="col col-xs-8">
                                <div className={styles.well} title={modal.coordinate}>
                                    {modal.coordinate || none}
                                </div>
                            </div>
                        </div>
                        <div className="row no-gutters">
                            <div className="col col-xs-4">
                                {i18n._('Plane')}
                            </div>
                            <div className="col col-xs-8">
                                <div className={styles.well} title={modal.plane}>
                                    {modal.plane || none}
                                </div>
                            </div>
                        </div>
                        <div className="row no-gutters">
                            <div className="col col-xs-4">
                                {i18n._('Distance')}
                            </div>
                            <div className="col col-xs-8">
                                <div className={styles.well} title={modal.distance}>
                                    {modal.distance || none}
                                </div>
                            </div>
                        </div>
                        <div className="row no-gutters">
                            <div className="col col-xs-4">
                                {i18n._('Feed Rate')}
                            </div>
                            <div className="col col-xs-8">
                                <div className={styles.well} title={modal.feedrate}>
                                    {modal.feedrate || none}
                                </div>
                            </div>
                        </div>
                        <div className="row no-gutters">
                            <div className="col col-xs-4">
                                {i18n._('Units')}
                            </div>
                            <div className="col col-xs-8">
                                <div className={styles.well} title={modal.units}>
                                    {modal.units || none}
                                </div>
                            </div>
                        </div>
                        <div className="row no-gutters">
                            <div className="col col-xs-4">
                                {i18n._('Program')}
                            </div>
                            <div className="col col-xs-8">
                                <div className={styles.well} title={modal.program}>
                                    {modal.program || none}
                                </div>
                            </div>
                        </div>
                        <div className="row no-gutters">
                            <div className="col col-xs-4">
                                {i18n._('Spindle')}
                            </div>
                            <div className="col col-xs-8">
                                <div className={styles.well} title={modal.spindle}>
                                    {modal.spindle || none}
                                </div>
                            </div>
                        </div>
                        <div className="row no-gutters">
                            <div className="col col-xs-4">
                                {i18n._('Coolant')}
                            </div>
                            <div className="col col-xs-8">
                                {!_.isPlainObject(modal.coolant) &&
                                <div className={styles.well} title={modal.coolant}>
                                    {modal.coolant || none}
                                </div>
                                }
                                {_.isPlainObject(modal.coolant) &&
                                <div className={styles.well}>
                                    <div title={modal.coolant.mist}>{modal.coolant.mist}</div>
                                    <div title={modal.coolant.flood}>{modal.coolant.flood}</div>
                                </div>
                                }
                            </div>
                        </div>
                    </Panel.Body>
                    }
                </Panel>
            </div>
        );
    }
}

export default Grbl;
