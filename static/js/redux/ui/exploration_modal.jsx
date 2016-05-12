import React from 'react';
import Modal from 'boron/DropModal';
import classNames from 'classnames';

export class ExplorationModal extends React.Component {
	constructor(props){
        super(props);
        this.state = {
			showDepartments: false,
			showAreas: false,
			showTimes: false,
			showLevels: false
		};
        this.toggleDepartments = this.toggleDepartments.bind(this);
        this.toggleAreas = this.toggleAreas.bind(this);
        this.toggleTimes = this.toggleTimes.bind(this);
        this.toggleLevels = this.toggleLevels.bind(this);
    }
	componentWillReceiveProps(nextProps) { 
		if (this.props.isVisible) {
			this.refs.modal.show();
		}
	}
	toggleDepartments() {
    	this.setState({showDepartments: !this.state.showDepartments});
    }
	toggleAreas() {
    	this.setState({showAreas: !this.state.showAreas});
    }
	toggleTimes() {
    	this.setState({showTimes: !this.state.showTimes});
    }
	toggleLevels() {
    	this.setState({showLevels: !this.state.showLevels});
    }
	render() {
		let modalStyle = {
			width: '100%',
			heigh: '80%'
		};
		let departmentFilter = (
			<div className={classNames("filter-pop-out", {'open' : this.state.showDepartments})}>
				<input placeholder="Department Search"/>
				<div className="fpo-list">
					<ul>
						<li>
							<i className="fa fa-check"></i>
							<h6>Applied Mathematics and Statistics</h6>
						</li>
						<li>
							<i className="fa fa-check"></i>
							<h6>Computer Science</h6>
						</li>
						<li>
							<i className="fa fa-check"></i>
							<h6>Computer Science</h6>
						</li>
						<li>
							<i className="fa fa-check"></i>
							<h6>Computer Science</h6>
						</li>
					</ul>
				</div>
			</div>
		);
		let courseModal = (
			<div id="modal-content">
				<div id="modal-header">
					<h1>Discrete Mathematics</h1>
					<h2>AS.122.123, Applied Mathematics and Statistics </h2>
					<div id="modal-share">
						<i className="fa fa-share-alt"></i>
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
						        <p> njkdlsandjkslanfjdklsancdklsjancd sallndsjla kncdkls ancdjklsa ncjkdlsa ncjkals ncjkadls ckslacjkdlsa cjdklsa cijldksa cijldksacklads cijsladk cildksa idjslak ijdlsakijdsal nijdls nijdsl anvdisla nvipan vdijvl a </p>
						    </div>
						    <div>
						        <h3 className="modal-module-header">Course Evaluations</h3>

						    </div>
						    <div>
						        <h3 className="modal-module-header">Textbook</h3>

						    </div>
						</div>
					</div>
				</div>
			</div>
		);
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
	                        <div className={classNames("exp-filter-section", {'open' : this.state.showDepartments})}>
								<h3 className="exp-header">
									<span>Departments Filter</span>
									<i className="fa fa-plus"
										onMouseDown={this.toggleDepartments.bind(this)}></i>
								</h3>
								<h6>
									<i className="fa fa-times"></i>
									<span>Computer Science</span>
								</h6>
	                        </div>
	                        <div className={classNames("exp-filter-section", {'open' : this.state.showAreas})}>
	                            <h3 className="exp-header">
									<span>Areas Filter</span>
									<i className="fa fa-plus"
										onMouseDown={this.toggleAreas.bind(this)}></i>
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
	                        <div className={classNames("exp-filter-section", {'open' : this.state.showTimes})}>
	                            <h3 className="exp-header">
									<span>Times Filter</span>
									<i className="fa fa-plus"
										onMouseDown={this.toggleTimes.bind(this)}></i>
								</h3>
								<h6>
									<i className="fa fa-times"></i>
									<span>M 9am-5pm</span>
								</h6>
	                        </div>
	                        <div className={classNames("exp-filter-section", {'open' : this.state.showLevels})}>
	                            <h3 className="exp-header">
									<span>Course Level Filter</span>
									<i className="fa fa-plus"
										onMouseDown={this.toggleLevels.bind(this)}></i>
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
	                    { departmentFilter }
	                    <div id="exp-modal"
	                        className="col-6-16 cf">
	                        { courseModal }
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
