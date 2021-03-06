import PropTypes from 'prop-types';
import React from 'react';
import Modal from '../../components/Modal';
import i18n from '../../lib/i18n';

const ControllerState = (props) => {
    const { state, actions } = props;
    const maxHeight = Math.max(window.innerHeight / 2, 200);

    return (
        <Modal
            onClose={actions.closeModal}
            size="lg"
        >
            <Modal.Header>
                <Modal.Title>{i18n._('Controller State')}</Modal.Title>
            </Modal.Header>
            <Modal.Body style={{ maxHeight: maxHeight }}>
                <pre><code>{JSON.stringify(state.controller.state, null, 2)}</code></pre>
            </Modal.Body>
            <Modal.Footer>
                <button
                    type="button"
                    className="btn btn-default"
                    onClick={actions.closeModal}
                >
                    {i18n._('Close')}
                </button>
            </Modal.Footer>
        </Modal>
    );
};

ControllerState.propTypes = {
    state: PropTypes.object,
    actions: PropTypes.object
};

export default ControllerState;
