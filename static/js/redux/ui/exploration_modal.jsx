import React from 'react';
import Modal from 'boron/DropModal';
import classNames from 'classnames';
import { CourseModalBody } from './course_modal_body.jsx';

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
        this.fetchAdvancedSearchResults = this.fetchAdvancedSearchResults.bind(this);
        this.addOrRemoveCourse = this.addOrRemoveCourse.bind(this);
        this.changeTimer = false;
    }
    addOrRemoveCourse(id, section='') {
        this.props.addOrRemoveCourse(id, section);
        this.refs.modal.hide();
    }
	componentDidUpdate(nextProps) {
		if (this.props.isVisible) {
			this.refs.modal.show();
		}
	}
	toggleDepartments() {
    	this.setState({ showDepartments: !this.state.showDepartments });
    }
	toggleAreas() {
    	this.setState({ showAreas: !this.state.showAreas });
    }
	toggleTimes() {
    	this.setState({ showTimes: !this.state.showTimes });
    }
	toggleLevels() {
    	this.setState({ showLevels: !this.state.showLevels });
    }
    fetchAdvancedSearchResults() {
        if (this.changeTimer) clearTimeout(this.changeTimer);
        let query = this.refs.input.value;
        this.changeTimer = setTimeout( () => {
            this.props.fetchAdvancedSearchResults(query);
            this.changeTimer = false;
        }, 200);
    }
	render() {
		let modalStyle = {
			width: '100%',
			backgroundColor: 'transparent'
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
		let { advancedSearchResults, course } = this.props;
		let numSearchResults = advancedSearchResults.length > 0 ? 
		<p>returned { advancedSearchResults.length } Search Results</p> : null;
		let searchResults = advancedSearchResults.map( (c, i) => {
			return <ExplorationSearchResult 
					key={i} code={c.code} name={c.name} 
					onClick={() => this.props.setAdvancedSearchResultIndex(i)}/>
		});
		let courseModal = null;
		if (course) {
			let lectureSections = [];
			let tutorialSections = [];
			let practicalSections = [];
			if (course.sections) {
				lectureSections = course.sections['L'];
				tutorialSections = course.sections['T'];
				practicalSections = course.sections['P'];
			}
			courseModal = <div id="modal-content">
				<div id="modal-header">
					<h1>{ course.name }</h1>
					<h2>{ course.code }</h2>
					<div id="modal-share">
						<i className="fa fa-share-alt"></i>
					</div>
				</div>
				<CourseModalBody {...course} 
					{...this.props}
					lectureSections={lectureSections}
					tutorialSections={tutorialSections}
					practicalSections={practicalSections}
					data={course}
					addOrRemoveCourse={this.addOrRemoveCourse}
				/>
			</div>
		}

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
						<input ref="input" onInput={this.fetchAdvancedSearchResults} />
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
	                    <div id="exp-search-results">
	                        <div id="exp-search-list">
	                    		{ numSearchResults }
								{ searchResults }
	                        </div>
	                    </div>
	                    { departmentFilter }
	                    <div id="exp-modal">
	                        { courseModal }
	                    </div>
	                </div>
	            </div>
	        </div>
        );
        return (
            <Modal ref="modal"
                className={classNames("exploration-modal", {"trans": this.props.hasHoveredResult})}
                modalStyle={modalStyle}
                onHide={this.props.toggleExplorationModal}
                >
                {content}
            </Modal>
        );
    }
}

const ExplorationSearchResult = ({name, code, onClick}) => (
	<div className="exp-s-result" onClick={onClick}>
		<h4>{ name }</h4>
		<h5>{ code }</h5>
	</div>
);
