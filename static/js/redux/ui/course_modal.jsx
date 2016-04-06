import React from 'react';
let Modal = require('boron/WaveModal');
export class CourseModal extends React.Component {
	constructor(props) {
		super(props);
	}
    showModal() {
    	console.log("show", this);
        this.refs.modal.show();
    }
    hideModal() {
    	console.log(this);
        this.refs.modal.hide();
    }
    render() {
    	console.log(this);
        return (
            <div>
                <button onClick={() => this.refs.modal.show()}>Open</button>
                <Modal ref="modal">
                    <h2>I am a dialog</h2>
                    <button onClick={() => this.refs.modal.hide()}>Close</button>
                </Modal>
            </div>
        );
    }
}
