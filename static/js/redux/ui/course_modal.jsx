import React from 'react';
import ReactDOM from 'react-dom';

let Modal = require('boron/WaveModal');
class CourseModal extends React.Component {
	constructor(props) {
		super(props);
	}
    showModal() {
        this.refs.modal.show();
    }
    hideModal() {
        this.refs.modal.hide();
    }
    render() {
        return (
            <Modal ref="modal" onHide={() => 
                ReactDOM.unmountComponentAtNode(document.getElementById(this.props.mountNode))}>
                <h2>I am a dialog: {this.props.code}</h2>
                <h3>In Roster? {String(this.props.in_roster)}</h3>
                <button onClick={() => this.refs.modal.hide()}>Close</button>
            </Modal>
        );
    }
    componentDidMount() {
        this.showModal();
    }
}

export const renderCourseModal = (code, inRoster) => {
    let mountNode = "semesterly-modal";
    ReactDOM.render(<CourseModal code={code} inRoster={inRoster} mountNode={mountNode}/>, 
        document.getElementById(mountNode));
};

// renderCourseModal("CSC343H1");
