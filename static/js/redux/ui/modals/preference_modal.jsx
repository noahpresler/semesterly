/*
Copyright (C) 2017 Semester.ly Technologies, LLC

Semester.ly is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

Semester.ly is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.
*/

import PropTypes from 'prop-types';
import React from 'react';
import { FadeModal } from 'boron-15';
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
      <FadeModal
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
      </FadeModal>
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

