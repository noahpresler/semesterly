import React from 'react';
import ReactDOM from 'react-dom';
import fetch from 'isomorphic-fetch';
import { getCourseSearchEndpoint } from '../constants.jsx';

export class SearchBar extends React.Component {
    fetchSearchResults() {
        let query = this.refs.input.value;
        this.props.fetchCourses(query);
    }
    render() {
    	let results = this.props.searchResults.map(c => 
    		<SearchResult {...this.props} course={c}  key={c.code} inRoster={this.props.isCourseInRoster(c.id)} />
    	);
    	return (
        	<div>
        		<input ref="input" onInput={this.fetchSearchResults.bind(this)} />
        		<ul className="search-results">
        		 {results}
        		</ul>
        	</div>
    	);
    }
}

export class SearchResult extends React.Component {
    addCourse(course, sec, event) {
        event.stopPropagation();
        this.props.addCourse(course, sec);
    }
    render() {
        let course = this.props.course;
        let sections = Object.keys(course.slots).map(sec => 
            <SearchResultSection key={course.id + sec} course={course} section={sec} 
                locked={this.props.isSectionLocked(course.id, sec)}
                hoverCourse={() => this.props.hoverCourse(course, sec)}
                unhoverCourse={this.props.unhoverCourse} 
                onClick={this.addCourse.bind(this, course, sec)}
            />
        );
        return (
        <li key={course.id} className="search-course" onClick={() => this.props.fetchCourseInfo(course.id)} style={this.props.inRoster ? {backgroundColor:"#4DFDBD"} : {}}>
            {course.code} : {course.name + " "} 
            <i onClick={this.addCourse.bind(this, course, '')} className="fa fa-plus"></i>
            <div>
                {sections}
            </div>
        </li>);
    }
}

const SearchResultSection = ({ section, locked, hoverCourse, unhoverCourse, onClick }) => {
    return (
    <span
        className="search-section" 
        onClick={onClick}
        onMouseEnter={hoverCourse}
        onMouseLeave={unhoverCourse} 
    >
        {section}
    </span>);
};

