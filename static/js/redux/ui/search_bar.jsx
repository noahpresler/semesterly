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
    //autofocus search currently disabled so it doesn't bug out nudgespot
    componentWillMount() {

        $(document.body).on('keydown', (e) => {
            if($("textarea").is(":focus")) { return; } // don't "search" if Nudgespot textarea is focused
            if ( $('input:focus').length === 0 && !this.props.explorationModalIsVisible && !e.ctrlKey) {
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
                        <p>Try switching semesters or click <i className="fa fa-compass" /> above to filter by areas, departments, times and more!</p>
                    </div>
                </div>
                <SearchSideBarContainer />
            </ul>
        );
        let availableSemesters = this.props.availableSemesters.map(s => {
            let name = this.props.getSemesterName[s];
            if ( $(window).width() < 767) {
                name = name.replace('Fall', 'F');
                name = name.replace('Spring', 'S');
                name = name.replace('Winter', 'W');
                name = name.replace('20', "'");
            }
            return <div key={s} className="semester-option" onMouseDown={ () => this.setSemester(s) }> { name } </div>
        });
        let currSem = this.props.semesterName;
        if ( $(window).width() < 767) {
            currSem = currSem.replace('Fall', 'F');
            currSem = currSem.replace('Spring', 'S');
            currSem = currSem.replace('Winter', 'W');
            currSem = currSem.replace('20', "'");
        }
    	return (
        	<div id="search-bar" className="no-print">
                <div id="search-bar-wrapper">
                    <ClickOutHandler onClickOut={this.onClickOut.bind(this)}>
                        <div id="search-bar-semester" onMouseDown={this.toggleDropdown.bind(this)}>
                            <span className={classNames("tip-down", {'down' : this.state.showDropdown})}>
                            </span>
                            {currSem}</div>
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
                               placeholder={"Searching " + currSem}
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
        this.state = { hoverAdd: false, hoverSave: false};
        this.addCourseWrapper = this.addCourseWrapper.bind(this);
        this.actionOver = this.actionOver.bind(this);
        this.actionOut = this.actionOut.bind(this);
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
    actionOver(action) {
        switch (action) {
            case "ADD":
                this.setState({hoverAdd: true});
                break;
            case "SAVE":
                this.setState({hoverSave: true});
                break;
        }
    }
    actionOut(action) {
        switch (action) {
            case "ADD":
                this.setState({hoverAdd: false});
                break;
            case "SAVE":
                this.setState({hoverSave: false});
                break;
        }
    }
    render() {
        let { course, inRoster, inOptionRoster } = this.props;
        let addRemoveButton =
            <span title="Add this course" className={classNames('search-course-add', {'in-roster': inRoster})}
              onMouseDown={(event) => this.addCourseWrapper(course, '', event)}
              onMouseOver={() => this.actionOver("ADD")}
              onMouseOut={() => this.actionOut("ADD")}>
                <i className={classNames('fa', {'fa-plus' : !inRoster, 'fa-check' : inRoster})}></i>
            </span>;
        let addOptionalCourseButton = this.props.inRoster ? null :
            <span title="Add this course as optional" className={classNames('search-course-save', {'in-roster': inOptionRoster})}
                onMouseDown={(event) => this.addOptionalCourseWrapper(course, event)}
                onMouseOver={() => this.actionOver("SAVE")}
                onMouseOut={() => this.actionOut("SAVE")}>
                <i className={classNames('fa', {'fa-bookmark' : !inOptionRoster, 'fa-check' : inOptionRoster})}></i>
            </span>
        let info = course.name ? course.code : "";
        if (this.state.hoverSave) {
            info = !inOptionRoster ? "Add this as an optional course" : "Remove this optional course";
        } else if (this.state.hoverAdd) {
            info = !inRoster ? "Add this course to your timetable" : "Remove this course from your timetable";
        }
        let style = {};
        if(this.state.hoverAdd)
            style = {color: "#52B7D9"};
        if(this.state.hoverSave)
            style = {color: "#27ae60"};
        let pilotIntegration = studentIntegrations['integrations'].indexOf(1) > -1 ? 
            <a style={{fontSize: '10px'}} onMouseDown={(event) => {
                event.stopPropagation();
                this.props.showIntegrationModal(course.id, 1)
                }}>Add as Pilot
            </a> : null;
        return (
        <li key={course.id}
            className={classNames('search-course', {'hovered': this.props.isHovered(this.props.position)})}
            onMouseDown={(event) => this.props.fetchCourseInfo(course.id)}
            onMouseOver={() => this.props.hoverSearchResult(this.props.position)}
            >
            <h3>{course.name || course.code} </h3>
            { addOptionalCourseButton}
            { addRemoveButton }
            { pilotIntegration }
            <h4 className="label" style={style}>{info}</h4><h4 className={classNames('label','bubble')}>{this.props.campuses[course.campus]}</h4>
        </li>);
    }
}
