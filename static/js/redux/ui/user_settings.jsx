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
        return (
            <Modal ref="modal" className="course-modal" onHide={this.props.hideModal}>
                "YO"
                <button onClick={() => this.refs.modal.hide()}>Close</button>
            </Modal>
        );
    }
}
