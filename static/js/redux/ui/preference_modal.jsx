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
                    <div style={{ marginRight: 'auto', marginLeft: '15%' }}>
                        <p style={{ margin: 0 }}>Conflicts: </p>
                    </div>
                    <div style={{ marginLeft: 'auto', marginRight: '15%'}}>
                        <div className="bootstrap-switch-square">
                            <input type="checkbox" 
                                    name="square-switch"
                                    dataToggle="switch"
                                    dataOnColor="primary"
                                    dataOffColor="default"
                                    defaultChecked={false}
                                    onChange={this.props.toggleConflicts} />
                        </div>
                    </div>
                </div>
                <hr style={{ marginTop: 0, width: '80%' }}/>
                <SortMenuContainer />
                <div className="preference-footer">
                    <button className="btn btn-primary"
                        style={{ marginLeft: 'auto' }}>
                        Cancel
                    </button>
                    <button className="btn btn-primary"
                        style={{ marginLeft: '5px', marginRight: '10%' }}>
                        Apply
                    </button>
                </div>
            </Modal>
        );
    }
}
