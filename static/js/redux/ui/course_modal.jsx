import React from 'react';
import ReactDOM from 'react-dom';
import fetch from 'isomorphic-fetch';
import { getSchool } from '../init.jsx';
let Modal = require('boron/DropModal');

export class CourseModal extends React.Component {
    componentWillReceiveProps(nextProps) { 
        if (nextProps.id != null) {
            this.refs.modal.show();
        }
    }
    render() {
        let content = this.props.loading ? <div className="modal-loader"></div> :
        (<div>
            <h2>Course: {this.props.data.code}</h2><h3>In Roster? {String(this.props.inRoster)}</h3>
        </div>);
        return (
            <Modal ref="modal" className="course-modal" onHide={this.props.hideModal}>
                {content}
                <button onClick={() => this.refs.modal.hide()}>Close</button>
            </Modal>
        );
    }
}
