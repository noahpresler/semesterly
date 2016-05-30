import React from 'react';
import Modal from 'boron/DropModal';
import SortMenuContainer from './containers/sort_menu_container.jsx'

export class PreferenceModal extends React.Component {
  componentDidUpdate(nextProps) {
    if (this.props.isVisible) {
        this.refs.modal.show();
    }
  }
    render() {
        let modalStyle = {
            width: '60%',
            height: '85%'
        };
        return (
            <Modal ref="modal"
                    modalStyle={modalStyle}
                    onHide={this.props.togglePreferenceModal}>
                <div className="conflict-row">
                    <p> Conflicts: </p>
                    <input type="checkbox" 
                            dataToggle="switch"
                            defaultChecked={false}
                            onChange={this.props.toggleConflicts} />
                </div>
                <hr/>
                <SortMenuContainer />
                <div className="preference-footer">
                  <div className="signup-button">Cancel</div>
                  <div className="signup-button">Apply</div>
                </div>
            </Modal>
        );
    }
}
