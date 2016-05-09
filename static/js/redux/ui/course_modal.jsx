import React from 'react';
import ReactDOM from 'react-dom';
import fetch from 'isomorphic-fetch';
import { getSchool } from '../init.jsx';
import Modal from 'boron/DropModal';

export class CourseModal extends React.Component {
    componentWillReceiveProps(nextProps) {
        if (nextProps.id != null) {
            this.refs.modal.show();
        }
    }
    render() {
        let modalStyle = {
            width: '100%',
            heigh: '80%'
        };
        let content = this.props.isFetching ? <div className="modal-loader"></div> :
        (<div id="modal-content">
            <div id="modal-header">
                <h2>Course: {this.props.data.code}</h2>
                <h3>In Roster? {String(this.props.inRoster)}</h3>
            </div>
        </div>);
        return (
            <Modal ref="modal"
                className="course-modal"
                modalStyle={modalStyle}
                onHide={this.props.hideModal}
                >
                {content}
                <button onClick={() => this.refs.modal.hide()}>Close</button>
            </Modal>
        );
    }
}
