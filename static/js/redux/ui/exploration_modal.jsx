import React from 'react';
import Modal from 'boron/DropModal';
import classNames from 'classnames';
import { CourseModalBody } from './course_modal_body.jsx';
import ClickOutHandler from 'react-onclickout';

export class ExplorationModal extends React.Component {
	constructor(props){
		super(props);
		this.state = {
			showDepartments: false,
			showAreas: false,
			showTimes: false,
			showLevels: false,
			areas: [],
			departments: [],
			times: [],
			levels: []
		};
		this.toggleDepartments = this.toggleDepartments.bind(this);
		this.toggleAreas = this.toggleAreas.bind(this);
		this.toggleTimes = this.toggleTimes.bind(this);
		this.toggleLevels = this.toggleLevels.bind(this);
		this.fetchAdvancedSearchResults = this.fetchAdvancedSearchResults.bind(this);
		this.addOrRemoveCourse = this.addOrRemoveCourse.bind(this);
		this.changeTimer = false;
		this.hide = this.hide.bind(this);
		this.add = this.add.bind(this);
		this.hideAll = this.hideAll.bind(this);
	}
	addOrRemoveCourse(id, section='') {
		this.props.addOrRemoveCourse(id, section);
		this.hide();
	}
	componentWillReceiveProps(nextProps) {
		if (this.props.isVisible && !nextProps.isVisible) {
			this.refs.modal.hide()
		}
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
	hide() {
		this.props.unhoverSection();
		this.props.hideModal();
		this.refs.modal.hide();
	}
	fetchAdvancedSearchResults() {
		if (this.changeTimer) clearTimeout(this.changeTimer);
		let query = this.refs.input.value;
		this.changeTimer = setTimeout( () => {
			this.props.fetchAdvancedSearchResults(query);
			this.changeTimer = false;
		}, 200);
	}
	add(filterType, filter) {
		if (this.state[filterType].indexOf(filter) > -1) {
			return;
		}
		let updatedFilter = [...this.state[filterType], filter];
		this.setState({[filterType]: updatedFilter});
	}
	hideAll(){
		this.setState({
			showDepartments: false,
			showAreas: false,
			showTimes: false,
			showLevels: false
		})
	}
	render() {
		let modalStyle = {
			width: '100%',
			backgroundColor: 'transparent'
		};

	

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
					<div id="modal-save">
						<i className="fa fa-save"></i>
					</div>
					<div id="modal-add">
						<i className="fa fa-plus"></i>
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
		let areaFilter = this.state.showAreas ? (
            <Filter results={this.props.areas} 
            		onClickOut={this.hideAll}
            		filterType={"areas"} 
            		add={this.add}/>

		) : null;
		let selectedAreas = this.state.areas.map((a, i) => (
			<SelectedFilter name={a} key={i} />
		));	
		let selectedAreasSection = <SelectedFilterSection name={"Areas"} toggle={this.toggleAreas} children={selectedAreas} />;

		let departmentFilter = this.state.showDepartments ? (
			<Filter results={this.props.departments}
					onClickOut={this.hideAll}
					filterType={"departments"}
					add={this.add}/>
		) : null;
		let selectedDepartments = this.state.departments.map((a, i) => (
			<SelectedFilter name={a} key={i} />
		));
		let selectedDepartmentsSection = <SelectedFilterSection name={"Departments"} toggle={this.toggleDepartments} children={selectedDepartments} />;

		let content = (
			<div id="exploration-content">
				<div id="exploration-header"
					className="cf">
					<div id="exp-title"
						className="col-4-16">
						<i className="fa fa-compass"></i>
						<h1>Course Discovery</h1>
					</div>
					<div className="col-5-16">
						<input ref="input" onInput={this.fetchAdvancedSearchResults} />
					</div>
	                <div id="exploration-close"
	                	onMouseDown={() => this.refs.modal.hide()}>
	                    <i className="fa fa-times"></i>
	                </div>
	            </div>
	            <div id="exploration-body">
                    <div id="exp-filters" className="col-4-16">
                        { selectedDepartmentsSection }
                        { selectedAreasSection }
                        
                        <div className={classNames("exp-filter-section", {'open' : this.state.showLevels})}>
                            <h3 className="exp-header">
								<span>Course Level Filter</span>
								<i className="fa fa-plus"
									onClick={this.toggleLevels}></i>
							</h3>
							<h6>
								<i className="fa fa-times"></i>
								<span>200</span>
							</h6>
                        </div>
                        <div className={classNames("exp-filter-section", {'open' : this.state.showTimes})}>
                            <h3 className="exp-header">
								<span>Times Filter</span>
								<i className="fa fa-plus"
									onClick={this.toggleTimes}></i>
							</h3>
							<h6>
								<i className="fa fa-times"></i>
								<span>M 9am-5pm</span>
							</h6>
                        </div>
                    </div>
                    <div id="exp-search-results" className="col-5-16">
                        <div id="exp-search-list">
                    		{ numSearchResults }
							{ searchResults }
                        </div>
                    </div>
                    { departmentFilter }
                    { areaFilter }
                    <div id="exp-modal" className="col-7-16">
                        { courseModal }
                    </div>
	            </div>
	        </div>
        );
        return (
            <Modal ref="modal"
                className={classNames("exploration-modal", {"trans": this.props.hasHoveredResult})}
                modalStyle={modalStyle}
                onHide={this.props.hideModal}
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

class Filter extends React.Component {
	constructor(props) {
		super(props);
		this.state = {results: this.props.results};
		this.filterResults = this.filterResults.bind(this);
	}
	filterResults(event) {
		let query = event.target.value.toLowerCase();
		if (query === "") {
			this.setState({ results: this.props.results });
		}
		else {
			let results = this.props.results;
			this.setState({
				results: results.filter(r => r.toLowerCase().includes(query))
			});
		}
	}
	render() {
		let results = this.state.results.map((r, i) => {
			return <li key={i} onClick={() => this.props.add(this.props.filterType, r)} >
					<i className="fa fa-check"></i>
					<h6> { r } </h6>
				</li>
		});
		return (
			<ClickOutHandler onClickOut={this.props.onClickOut}>
				<div className="filter-pop-out open">
					<input placeholder={this.props.filterType} onInput={this.filterResults}/>
					<div className="fpo-list">
						<ul>
							{ results }
						</ul>
					</div>
				</div>
			</ClickOutHandler>

		);
	}

}


const SelectedFilter = ({ name }) => (
	<h6>
		<i className="fa fa-times"></i>
		<span>{ name }</span>
	</h6>
);

const SelectedFilterSection = ({ name, toggle, children }) => (
	<div className="exp-filter-section open">
	    <h3 className="exp-header">
			<span>{ name } Filter</span>
			<i className="fa fa-plus"
				onClick={toggle}></i>
		</h3>
		{children}
	</div>
);
