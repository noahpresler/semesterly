import React from 'react';
import ReactDOM from 'react-dom';
import fetch from 'isomorphic-fetch';
import { getCourseSearchEndpoint } from '../constants.jsx';
import classNames from 'classnames';
import SearchSideBarContainer from './containers/search_side_bar_container.jsx'
import ClickOutHandler from 'react-onclickout';

export class SearchBar extends React.Component {
    constructor(props){
        super(props);
        this.state = { focused: false, showDropdown: false };
        this.toggleDropdown = this.toggleDropdown.bind(this);
        this.fetchSearchResults = this.fetchSearchResults.bind(this);
        this.changeTimer = false;
    }
    //autofocus search
    componentWillMount() {
        $(document.body).on('keydown', (e) => {
            if ( $('input:focus').length === 0 && !this.props.explorationModalIsVisible ) {
                if ((e.keyCode >= 48 && e.keyCode <= 57) || (e.keyCode >= 65 && e.keyCode <= 90)) {
                    $('#search-bar input').focus();
                    this.setState({ focused: true });
                }
            }
        });
    }
    toggleDropdown() {
        this.setState({ showDropdown: !this.state.showDropdown });
    }
    fetchSearchResults() {
        if (this.changeTimer) clearTimeout(this.changeTimer);
        let query = this.refs.input.value;
        this.changeTimer = setTimeout( () => {
            this.props.fetchCourses(query);
            this.changeTimer = false;
        }, 200);
    }
    onClickOut(e) {
        this.setState({ showDropdown: false });
    }
    setSemester(semester) {
        this.setState({ showDropdown: false });
        this.props.setSemester(semester);
    }
    render() {
        let resClass = classNames({'search-results' : true, 'trans50' : this.props.hasHoveredResult})
    	let results = this.props.searchResults.map( (c, i) => {
            return (<SearchResult {...this.props}
                course={c}
                key={c.code}
                inRoster={this.props.isCourseInRoster(c.id)}
                inOptionRoster={this.props.isCourseOptional(c.id)}
                position={i}
            />)
    	});
        let result_container = !this.state.focused || results.length == 0 ? null : (
            <ul className={resClass} >
                {results}
                <div id="see-more" style={{height: 240-60*results.length}}>
                    <div id="see-more-inner">
                        <h4>Don't see what you're looking for?</h4>
                        <p>Click <i className="fa fa-compass" /> above to filter by areas, departments, times and more!</p>
                    </div>
                </div>
                <SearchSideBarContainer />
            </ul>
        );
        let availableSemesters = this.props.availableSemesters.map(s =>
            <div key={s} className="semester-option" onMouseDown={ () => this.setSemester(s) }> { this.props.getSemesterName[s] } </div>
        );
    	return (
        	<div id="search-bar">
                <div id="search-bar-wrapper">
                    <ClickOutHandler onClickOut={this.onClickOut.bind(this)}>
                        <div id="search-bar-semester" onMouseDown={this.toggleDropdown.bind(this)}>{this.props.semesterName}</div>
                        <div id="semester-picker"
                             className={classNames({'down' : this.state.showDropdown})}
                        >
                        <div className="tip-border"></div>
                        <div className="tip"></div>
                            { availableSemesters }
                        </div>
                    </ClickOutHandler>
                    <div id="search-bar-input-wrapper">
                        <input ref="input"
                               className={this.props.isFetching ? 'results-loading-gif' : ''}
                               onInput={this.fetchSearchResults}
                               onFocus={() => this.setState({ focused: true, showDropdown: false })}
                               onBlur={() => this.setState({ focused: false })}
                               onKeyDown={(e) => {
                                    if (e.key === 'Enter' && this.props.searchResults.length > 0) { this.props.addCourse(this.props.searchResults[this.props.hoveredPosition].id)}
                                    else if (e.key === 'ArrowDown' && parseInt(this.props.hoveredPosition) < 3) {this.props.hoverSearchResult(this.props.hoveredPosition + 1)}
                                    else if (e.key === 'ArrowUp' && parseInt(this.props.hoveredPosition) > 0) {this.props.hoverSearchResult(this.props.hoveredPosition - 1)}
                                    else if (e.key === 'Escape') {this.setState({ focused: false }); $('#search-bar input').blur();}
                                }}
                        />
                    </div>
                    <div id="show-exploration"
                        onMouseDown={this.props.showExplorationModal}>
                        <i className="fa fa-compass"></i>
                        <span>Advanced Search</span>
                    </div>
                </div>
                {result_container}
        	</div>
    	);
    }
}

export class SearchResult extends React.Component {
    constructor(props) {
        super(props);
        this.addCourseWrapper = this.addCourseWrapper.bind(this);
    }
    addCourseWrapper(course, sec, event) {
        event.stopPropagation(); // stops modal from popping up
        event.preventDefault(); // stops search bar from blurring (losing focus)
        this.props.addCourse(course.id, sec);
    }
    addOptionalCourseWrapper(course, event) {
        event.stopPropagation(); // stops modal from popping up
        event.preventDefault(); // stops search bar from blurring (losing focus)
        this.props.addRemoveOptionalCourse(course);
    }
    render() {
        let course = this.props.course;
        let inRoster = this.props.inRoster;
        let inOptionRoster = this.props.inOptionRoster;
        let addRemoveButton =
            <span className={classNames('search-course-add', {'in-roster': inRoster})}
              onMouseDown={(event) => this.addCourseWrapper(course, '', event)}>
                <i className={classNames('fa', {'fa-plus' : !inRoster, 'fa-check' : inRoster})}></i>
            </span>;
        let addOptionalCourseButton = this.props.inRoster ? null :
            <span className={classNames('search-course-save', {'in-roster': inOptionRoster})}
                onMouseDown={(event) => this.addOptionalCourseWrapper(course, event)}
                >
                <i className={classNames('fa', {'fa-bookmark' : !inOptionRoster, 'fa-check' : inOptionRoster})}></i>
            </span>
        return (
        <li key={course.id}
            className={classNames('search-course', {'hovered': this.props.isHovered(this.props.position)})}
            onMouseDown={(event) => this.props.fetchCourseInfo(course.id)}
            onMouseOver={() => this.props.hoverSearchResult(this.props.position)}
            >
            <h3>{course.name} </h3>
            { addOptionalCourseButton}
            { addRemoveButton }
            <h4>{course.code}</h4>
        </li>);
    }
}
