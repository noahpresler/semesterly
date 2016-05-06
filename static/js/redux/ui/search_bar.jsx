import React from 'react';
import ReactDOM from 'react-dom';
import fetch from 'isomorphic-fetch';
import { getCourseSearchEndpoint } from '../constants.jsx';
import classNames from 'classnames';

export class SearchBar extends React.Component {
    constructor(props){
        super(props);
        this.state = {sectionHovered: false, focused: false};
        this.sectionHoverOff = this.sectionHoverOff.bind(this);
        this.sectionHoverOn = this.sectionHoverOn.bind(this);
        this.changeTimer = false;
    }
    sectionHoverOn() {
        this.setState({sectionHovered: true});
    }
    sectionHoverOff() {
        this.setState({sectionHovered: false});
    }
    fetchSearchResults() {
        if (this.changeTimer) clearTimeout(this.changeTimer);
        let query = this.refs.input.value;
        this.changeTimer = setTimeout(function() {
            this.props.fetchCourses(query);
            this.changeTimer = false;
        }.bind(this), 100);
    }
    render() {
        let res_class = classNames({'search-results' : true, 'trans50' : this.state.sectionHovered})
    	let results = this.props.searchResults.map(c => 
    		<SearchResult {...this.props} sectionHoverOn={this.sectionHoverOn} sectionHoverOff={this.sectionHoverOff} course={c}  key={c.code} inRoster={this.props.isCourseInRoster(c.id)} />
    	);
        let result_container = results.length == 0 ? null : (
            <ul className={res_class} >
                {results}
                <div id="search-bar-side">
                    <div id="search-bar-side-sections">
                        <h5 className="sb-side-sections">T0201</h5>
                        <h5 className="sb-side-sections">L2001</h5>
                        <h5 className="sb-side-sections">T0301</h5>
                    </div>
                </div>
            </ul>)

    	return (
        	<div id="search-bar">
        		<input ref="input" 
                       className={this.props.isFetching ? 'results-loading-gif' : ''} 
                       onInput={this.fetchSearchResults.bind(this)} 
                       onFocus={() => this.setState({focused: true})}
                       onBlur={() => this.setState({focused: false})}/>

                {result_container}
        	</div>
    	);
    }
}

export class SearchResult extends React.Component {
    addCourse(course, sec, event) {
        event.stopPropagation();
        this.props.addCourse(course.id, sec);
    }
    render() {
        let course = this.props.course;
        let sections = Object.keys(course.slots).map(sec => 
            <SearchResultSection key={course.id + sec} course={course} section={sec} 
                locked={this.props.isSectionLocked(course.id, sec)}
                hoverCourse={() => this.props.hoverCourse(course, sec)}
                unhoverCourse={this.props.unhoverCourse} 
                onClick={this.addCourse.bind(this, course, sec)}
                sectionHoverOn={this.props.sectionHoverOn}
                sectionHoverOff={this.props.sectionHoverOff}
            />
        );
        return (
        <li key={course.id} className="search-course" onClick={() => this.props.fetchCourseInfo(course.id)} style={this.props.inRoster ? {backgroundColor:"#4DFDBD"} : {}}>
            <h3>{course.code} : {course.name + " "} </h3>
            <span className="search-course-save">
                <i className="fa fa-bookmark"></i>
            </span>
            <span className="search-course-add" onClick={this.addCourse.bind(this, course, '')}>
                <i className="fa fa-plus"></i>
            </span>
            <div className="search-sections">
                {sections}
            </div>
        </li>);
    }
}

const SearchResultSection = ({ section, locked, hoverCourse, unhoverCourse, onClick, sectionHoverOn, sectionHoverOff }) => {
    return (
    <span
        className="search-section" 
        onClick={onClick}
        onMouseEnter={hoverCourse}
        onMouseLeave={unhoverCourse}
        onMouseOver={sectionHoverOn}
        onMouseOut={sectionHoverOff}
    >
        {section + " "}
        { locked ? <i className="fa fa-lock"></i> : null}
    </span>);
};
