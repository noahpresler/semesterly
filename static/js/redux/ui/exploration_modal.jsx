import React from 'react';
import Modal from 'boron/DropModal';

export class ExplorationModal extends React.Component {
	componentWillReceiveProps(nextProps) { 
        if (this.props.isVisible) {
            this.refs.modal.show();
        }
    }
	render() {
        let modalStyle = {
            width: '100%',
            heigh: '80%'
        };
        let content = (
	        <div id="exploration-content">
	            <div id="exploration-header">
	                <h1></h1>
	                <h2></h2>
	                <div id="exploration-close"
	                	onMouseDown={() => this.refs.modal.hide()}>
	                    <i className="fa fa-times"></i>
	                </div>
	            </div>
	            <div id="modal-body">
	                <div className="cf">
	                    <div className="col-3-16">
	                        <div className="credits">
	                            <h3>3</h3>
	                            <h4>credits</h4>
	                        </div>
	                        <div className="rating-module">
	                            <h4>Average Course Rating</h4>
	                            <div className="sub-rating-wrapper">
	                                <div className="star-ratings-sprite">
	                                    <span></span>
	                                </div>
	                            </div>
	                        </div>
	                        <p></p>
	                        <div>
	                            <h3 className="modal-module-header">Prerequisites</h3>

	                        </div>
	                        <div>
	                            <h3 className="modal-module-header">Similar Courses</h3>

	                        </div>
	                    </div>
	                    <div className="col-8-16">
	                        <div>
	                            <h3 className="modal-module-header">Course Description</h3>
	                            <p></p>
	                        </div>
	                        <div>
	                            <h3 className="modal-module-header">Course Evaluations</h3>

	                        </div>
	                        <div>
	                            <h3 className="modal-module-header">Textbook</h3>

	                        </div>
	                    </div>
	                    <div id="modal-section-lists"
	                        className="col-5-16 cf">
	                    </div>
	                </div>
	            </div>
	        </div>
        );
        return (
            <Modal ref="modal"
                className="exploration-modal"
                modalStyle={modalStyle}
                onHide={this.props.toggleExplorationModal}
                >
                {content}
            </Modal>
        );
    }
}
