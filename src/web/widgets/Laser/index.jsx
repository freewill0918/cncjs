import includes from 'lodash/includes';
import isNumber from 'lodash/isNumber';
import classNames from 'classnames';
import React, { Component, PropTypes } from 'react';
import shallowCompare from 'react-addons-shallow-compare';
import Widget from '../../components/Widget';
import controller from '../../lib/controller';
import ensurePositiveNumber from '../../lib/ensure-positive-number';
import i18n from '../../lib/i18n';
import WidgetConfig from '../WidgetConfig';
import Laser from './Laser';
import {
    // Grbl
    GRBL,
    // Smoothie
    SMOOTHIE,
    // TinyG
    TINYG
} from '../../constants';
import styles from './index.styl';

class LaserWidget extends Component {
    static propTypes = {
        widgetId: PropTypes.string.isRequired,
        onFork: PropTypes.func.isRequired,
        onRemove: PropTypes.func.isRequired,
        sortable: PropTypes.object
    };

    config = new WidgetConfig(this.props.widgetId);
    state = this.getInitialState();
    actions = {
        toggleFullscreen: () => {
            const { minimized, isFullscreen } = this.state;
            this.setState({
                minimized: isFullscreen ? minimized : false,
                isFullscreen: !isFullscreen
            });
        },
        toggleMinimized: () => {
            const { minimized } = this.state;
            this.setState({ minimized: !minimized });
        },
        toggleLaserTest: () => {
            const expanded = this.state.panel.laserTest.expanded;

            this.setState({
                panel: {
                    ...this.state.panel,
                    laserTest: {
                        ...this.state.panel.laserTest,
                        expanded: !expanded
                    }
                }
            });
        },
        changeLaserTestPower: (value) => {
            const power = Number(value) || 0;
            this.setState({
                test: {
                    ...this.state.test,
                    power
                }
            });
        },
        changeLaserTestDuration: (event) => {
            const value = event.target.value;
            if (typeof value === 'string' && value.trim() === '') {
                this.setState({
                    test: {
                        ...this.state.test,
                        duration: ''
                    }
                });
            } else {
                this.setState({
                    test: {
                        ...this.state.test,
                        duration: ensurePositiveNumber(value)
                    }
                });
            }
        },
        changeLaserTestMaxS: (event) => {
            const value = event.target.value;
            if (typeof value === 'string' && value.trim() === '') {
                this.setState({
                    test: {
                        ...this.state.test,
                        maxS: ''
                    }
                });
            } else {
                this.setState({
                    test: {
                        ...this.state.test,
                        maxS: ensurePositiveNumber(value)
                    }
                });
            }
        },
        laserTestOn: () => {
            const { power, duration, maxS } = this.state.test;
            controller.command('lasertest:on', power, duration, maxS);
        },
        laserTestOff: () => {
            controller.command('lasertest:off');
        }
    };
    controllerEvents = {
        'serialport:open': (options) => {
            const { port } = options;
            this.setState({ port: port });
        },
        'serialport:close': (options) => {
            const initialState = this.getInitialState();
            this.setState({ ...initialState });
        },
        'Grbl:state': (state) => {
            this.setState({
                controller: {
                    ...this.state.controller,
                    type: GRBL,
                    state: state
                }
            });
        },
        'Grbl:settings': (settings) => {
            this.setState({
                controller: {
                    ...this.state.controller,
                    type: GRBL,
                    settings: settings
                }
            });
        },
        'Smoothie:state': (state) => {
            this.setState({
                controller: {
                    ...this.state.controller,
                    type: SMOOTHIE,
                    state: state
                }
            });
        },
        'Smoothie:settings': (settings) => {
            this.setState({
                controller: {
                    ...this.state.controller,
                    type: SMOOTHIE,
                    settings: settings
                }
            });
        },
        'TinyG:state': (state) => {
            this.setState({
                controller: {
                    ...this.state.controller,
                    type: TINYG,
                    state: state
                }
            });
        },
        'TinyG:settings': (settings) => {
            this.setState({
                controller: {
                    ...this.state.controller,
                    type: TINYG,
                    settings: settings
                }
            });
        }
    };

    componentDidMount() {
        this.addControllerEvents();
    }
    componentWillUnmount() {
        this.removeControllerEvents();
    }
    shouldComponentUpdate(nextProps, nextState) {
        return shallowCompare(this, nextProps, nextState);
    }
    componentDidUpdate(prevProps, prevState) {
        const {
            minimized,
            panel,
            test
        } = this.state;

        this.config.set('minimized', minimized);
        this.config.set('panel.laserTest.expanded', panel.laserTest.expanded);
        if (isNumber(test.power)) {
            this.config.set('test.power', test.power);
        }
        if (isNumber(test.duration)) {
            this.config.set('test.duration', test.duration);
        }
        if (isNumber(test.maxS)) {
            this.config.set('test.maxS', test.maxS);
        }
    }
    getInitialState() {
        return {
            minimized: this.config.get('minimized', false),
            isFullscreen: false,
            canClick: true, // Defaults to true
            port: controller.port,
            controller: {
                type: controller.type,
                state: controller.state,
                settings: controller.settings
            },
            panel: {
                laserTest: {
                    expanded: this.config.get('panel.laserTest.expanded')
                }
            },
            test: {
                power: this.config.get('test.power', 0),
                duration: this.config.get('test.duration', 0),
                maxS: this.config.get('test.maxS', 1000)
            }
        };
    }
    addControllerEvents() {
        Object.keys(this.controllerEvents).forEach(eventName => {
            const callback = this.controllerEvents[eventName];
            controller.on(eventName, callback);
        });
    }
    removeControllerEvents() {
        Object.keys(this.controllerEvents).forEach(eventName => {
            const callback = this.controllerEvents[eventName];
            controller.off(eventName, callback);
        });
    }
    canClick() {
        const { port, controller, test } = this.state;
        const controllerType = controller.type;

        if (!port) {
            return false;
        }
        if (!includes([GRBL, SMOOTHIE, TINYG], controllerType)) {
            return false;
        }
        if (!(isNumber(test.power) && isNumber(test.duration) && isNumber(test.maxS))) {
            return false;
        }

        return true;
    }
    render() {
        const { widgetId } = this.props;
        const { minimized, isFullscreen } = this.state;
        const isForkedWidget = widgetId.match(/\w+:[\w\-]+/);
        const state = {
            ...this.state,
            canClick: this.canClick()
        };
        const actions = {
            ...this.actions
        };

        return (
            <Widget fullscreen={isFullscreen}>
                <Widget.Header>
                    <Widget.Title>
                        <Widget.Sortable className={this.props.sortable.handleClassName}>
                            <i className="fa fa-bars" />
                            <span className="space" />
                        </Widget.Sortable>
                        {i18n._('Laser')}
                        {isForkedWidget &&
                        <i className="fa fa-code-fork" style={{ marginLeft: 5 }} />
                        }
                    </Widget.Title>
                    <Widget.Controls className={this.props.sortable.filterClassName}>
                        <Widget.Button
                            disabled={isFullscreen}
                            title={minimized ? i18n._('Expand') : i18n._('Collapse')}
                            onClick={actions.toggleMinimized}
                        >
                            <i
                                className={classNames(
                                    'fa',
                                    { 'fa-chevron-up': !minimized },
                                    { 'fa-chevron-down': minimized }
                                )}
                            />
                        </Widget.Button>
                        <Widget.DropdownButton
                            title={<i className="fa fa-ellipsis-v" />}
                            onSelect={(eventKey) => {
                                if (eventKey === 'fullscreen') {
                                    actions.toggleFullscreen();
                                } else if (eventKey === 'fork') {
                                    this.props.onFork();
                                } else if (eventKey === 'remove') {
                                    this.props.onRemove();
                                }
                            }}
                        >
                            <Widget.DropdownMenuItem eventKey="fullscreen">
                                <i
                                    className={classNames(
                                        'fa',
                                        'fa-fw',
                                        { 'fa-expand': !isFullscreen },
                                        { 'fa-compress': isFullscreen }
                                    )}
                                />
                                <span className="space space-sm" />
                                {!isFullscreen ? i18n._('Enter Full Screen') : i18n._('Exit Full Screen')}
                            </Widget.DropdownMenuItem>
                            <Widget.DropdownMenuItem eventKey="fork">
                                <i className="fa fa-fw fa-code-fork" />
                                <span className="space space-sm" />
                                {i18n._('Fork Widget')}
                            </Widget.DropdownMenuItem>
                            <Widget.DropdownMenuItem eventKey="remove">
                                <i className="fa fa-fw fa-times" />
                                <span className="space space-sm" />
                                {i18n._('Remove Widget')}
                            </Widget.DropdownMenuItem>
                        </Widget.DropdownButton>
                    </Widget.Controls>
                </Widget.Header>
                <Widget.Content
                    className={classNames(
                        styles.widgetContent,
                        { [styles.hidden]: minimized }
                    )}
                >
                    <Laser
                        state={state}
                        actions={actions}
                    />
                </Widget.Content>
            </Widget>
        );
    }
}

export default LaserWidget;
