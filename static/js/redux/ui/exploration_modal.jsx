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
	                    <div id="exp-filters">
	                        <div className="exp-filter-section">
								<h3 className="exp-header">
									<span>Departments Filter</span>
									<i className="fa fa-plus"></i>
								</h3>
								<h6>
									<i className="fa fa-times"></i>
									<span>Computer Science</span>
								</h6>
	                        </div>
	                        <div className="exp-filter-section">
	                            <h3 className="exp-header">
									<span>Areas Filter</span>
									<i className="fa fa-plus"></i>
								</h3>
								<h6>
									<i className="fa fa-times"></i>
									<span>Humanities</span>
								</h6>
								<h6>
									<i className="fa fa-times"></i>
									<span>Writing Intensive</span>
								</h6>
	                        </div>
	                        <div className="exp-filter-section">
	                            <h3 className="exp-header">
									<span>Times Filter</span>
									<i className="fa fa-plus"></i>
								</h3>
								<h6>
									<i className="fa fa-times"></i>
									<span>M 9am-5pm</span>
								</h6>
	                        </div>
	                        <div className="exp-filter-section">
	                            <h3 className="exp-header">
									<span>Course Level Filter</span>
									<i className="fa fa-plus"></i>
								</h3>
								<h6>
									<i className="fa fa-times"></i>
									<span>200</span>
								</h6>
	                        </div>
	                    </div>
	                    <div id="exp-search-results" 
	                    	className="col-6-16">
	                        <div id="exp-search-list">
	                    		<p>returned 157 Search Results</p>
								<div className="exp-s-result">
									<h4>Discrete Mathematics</h4>
									<h5>EN.650.113, Applied Mathematics & Statistics</h5>
								</div>
								<div className="exp-s-result">
									<h4>Discrete Mathematics</h4>
									<h5>EN.650.113, Applied Mathematics & Statistics</h5>
								</div>
								<div className="exp-s-result">
									<h4>Discrete Mathematics</h4>
									<h5>EN.650.113, Applied Mathematics & Statistics</h5>
								</div>
								<div className="exp-s-result">
									<h4>Discrete Mathematics</h4>
									<h5>EN.650.113, Applied Mathematics & Statistics</h5>
								</div>
								<div className="exp-s-result">
									<h4>Discrete Mathematics</h4>
									<h5>EN.650.113, Applied Mathematics & Statistics</h5>
								</div>
								<div className="exp-s-result">
									<h4>Discrete Mathematics</h4>
									<h5>EN.650.113, Applied Mathematics & Statistics</h5>
								</div>
								<div className="exp-s-result">
									<h4>Discrete Mathematics</h4>
									<h5>EN.650.113, Applied Mathematics & Statistics</h5>
								</div>
								<div className="exp-s-result">
									<h4>Discrete Mathematics</h4>
									<h5>EN.650.113, Applied Mathematics & Statistics</h5>
								</div>
								<div className="exp-s-result">
									<h4>Discrete Mathematics</h4>
									<h5>EN.650.113, Applied Mathematics & Statistics</h5>
								</div>
								<div className="exp-s-result">
									<h4>Discrete Mathematics</h4>
									<h5>EN.650.113, Applied Mathematics & Statistics</h5>
								</div>
								<div className="exp-s-result">
									<h4>Discrete Mathematics</h4>
									<h5>EN.650.113, Applied Mathematics & Statistics</h5>
								</div>
								<div className="exp-s-result">
									<h4>Discrete Mathematics</h4>
									<h5>EN.650.113, Applied Mathematics & Statistics</h5>
								</div>
								<div className="exp-s-result">
									<h4>Discrete Mathematics</h4>
									<h5>EN.650.113, Applied Mathematics & Statistics</h5>
								</div>
								<div className="exp-s-result">
									<h4>Discrete Mathematics</h4>
									<h5>EN.650.113, Applied Mathematics & Statistics</h5>
								</div>
								<div className="exp-s-result">
									<h4>Discrete Mathematics</h4>
									<h5>EN.650.113, Applied Mathematics & Statistics</h5>
								</div>
								<div className="exp-s-result">
									<h4>Discrete Mathematics</h4>
									<h5>EN.650.113, Applied Mathematics & Statistics</h5>
								</div>
								<div className="exp-s-result">
									<h4>Discrete Mathematics</h4>
									<h5>EN.650.113, Applied Mathematics & Statistics</h5>
								</div>
								<div className="exp-s-result">
									<h4>Discrete Mathematics</h4>
									<h5>EN.650.113, Applied Mathematics & Statistics</h5>
								</div>
								<div className="exp-s-result">
									<h4>Discrete Mathematics</h4>
									<h5>EN.650.113, Applied Mathematics & Statistics</h5>
								</div>
								<div className="exp-s-result">
									<h4>Discrete Mathematics</h4>
									<h5>EN.650.113, Applied Mathematics & Statistics</h5>
								</div>
								<div className="exp-s-result">
									<h4>Discrete Mathematics</h4>
									<h5>EN.650.113, Applied Mathematics & Statistics</h5>
								</div>
								<div className="exp-s-result">
									<h4>Discrete Mathematics</h4>
									<h5>EN.650.113, Applied Mathematics & Statistics</h5>
								</div>
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
