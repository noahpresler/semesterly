import React from 'react';
import ReactDOM from 'react-dom';
import fetch from 'isomorphic-fetch';
import { getCourseInfoEndpoint } from '../constants.jsx';
import { getSchool } from '../init.jsx';
let Modal = require('boron/DropModal');
class CourseModal extends React.Component {
	constructor(props) {
		super(props);
        this.state = {loading: true, data: {}};
	}
    showModal() {
        this.refs.modal.show();
    }
    hideModal() {
        this.refs.modal.hide();
    }
    fetchCourseInfo() {
        fetch(getCourseInfoEndpoint(getSchool(), this.props.id))
        .then(response => response.json()) // TODO(rohan): error-check the response
        .then(json => {
            this.setState({loading: false, data: json});
        });
    }
    render() {
        let content = this.state.loading ? <div className="loader">Loading...</div> :
        (<div>
            <h2>Course: {this.state.data.code}</h2><h3>In Roster? {String(this.props.inRoster)}</h3>
        </div>);
        return (
            <Modal ref="modal" className="course-modal" onHide={() => 
                ReactDOM.unmountComponentAtNode(document.getElementById(this.props.mountNode))}>
                {content}
                <button onClick={() => this.refs.modal.hide()}>Close</button>
            </Modal>
        );
    }
    componentDidMount() {
        this.showModal();
        this.fetchCourseInfo();
    }
}

export const renderCourseModal = (id, inRoster) => {
    let mountNode = "semesterly-modal";
    ReactDOM.render(<CourseModal 
        id={id} inRoster={inRoster} mountNode={mountNode} />, 
        document.getElementById(mountNode));
};
