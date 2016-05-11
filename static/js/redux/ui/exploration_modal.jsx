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
	            <div id="exploration-header"
	            	className="cf">
	            	<div id="exp-title"
	            		className="col-4-16">
	            		<i className="fa fa-compass"></i>
						<h1>Course Discovery</h1>
					</div>
					<div className="col-6-16">
						<input />
					</div>
	                <div id="exploration-close"
	                	onMouseDown={() => this.refs.modal.hide()}>
	                    <i className="fa fa-times"></i>
	                </div>
	            </div>
	            <div id="exploration-body">
	                <div className="cf">
	                    <div id="exp-filters" 
	                    	className="col-4-16">
	                        <div>
	                            <h3 className="exp-header">Filter by Departments</h3>

	                        </div>
	                        <div>
	                            <h3 className="exp-header">Filter by Areas</h3>

	                        </div>
	                        <div>
	                            <h3 className="exp-header">Filter by Times</h3>

	                        </div>
	                    </div>
	                    <div className="col-6-16">
	                    	<p>returned 157 Search Results</p>
	                        <div className="exp-search-results">
								<div className="exp-s-result">
									<h4>Discrete Mathematics</h4>
									<h5>EN.650.113, Applied Mathematics & Statistics</h5>
								</div>
								<div className="exp-s-result">
									<h4>Discrete Mathematics</h4>
									<h5>EN.650.113, Applied Mathematics & Statistics</h5>
								</div>
	                        </div>
	                    </div>
	                    <div id="exp-modal"
	                        className="col-6-16 cf">

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
