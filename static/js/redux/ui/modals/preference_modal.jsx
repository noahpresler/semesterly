import PropTypes from 'prop-types';
import React from 'react';
import Modal from 'boron/FadeModal';
import SortMenuContainer from '../containers/sort_menu_container';

class PreferenceModal extends React.Component {
  componentDidUpdate() {
    if (this.props.isVisible) {
      this.modal.show();
    }
  }

  render() {
    const modalHeader =
            (<div className="modal-content">
              <div className="modal-header">
                <h1>Timetable Preferences</h1>
              </div>
            </div>);
    const modalStyle = {
      width: '100%',
    };
    return (
      <Modal
        ref={(c) => { this.modal = c; }}
        className="pref-modal max-modal"
        modalStyle={modalStyle}
        onHide={this.props.togglePreferenceModal}
      >
        <div id="perf-modal-wrapper">
          {modalHeader}
          <div className="conflict-row">
            <div style={{ marginRight: 'auto', marginLeft: '15%' }}>
              <p style={{ margin: 0 }}>Conflicts: </p>
            </div>
            <div style={{ marginLeft: 'auto', marginRight: '10%' }}>
              <label className="switch switch-slide" htmlFor="with-conflicts">
                <input
                  id="with-conflicts"
                  className="switch-input"
                  type="checkbox"
                  checked={this.props.withConflicts}
                  onChange={this.props.toggleConflicts}
                />
                <span
                  className="switch-label" data-on="Enabled"
                  data-off="Disabled"
                />
                <span className="switch-handle" />
              </label>
            </div>
          </div>
          <hr style={{ marginTop: 0, width: '80%' }} />
          <SortMenuContainer />
          <div className="preference-footer">
            <button
              className="btn btn-primary"
              style={{ marginLeft: 'auto', marginRight: '10%' }}
              onClick={() => this.modal.hide()}
            >
                            Save and Close
                        </button>
          </div>
        </div>
      </Modal>
    );
  }
}

PreferenceModal.propTypes = {
  toggleConflicts: PropTypes.func.isRequired,
  withConflicts: PropTypes.bool.isRequired,
  togglePreferenceModal: PropTypes.func.isRequired,
  isVisible: PropTypes.bool.isRequired,
};

export default PreferenceModal;

