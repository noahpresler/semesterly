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
    		<SearchResult {...this.props} course={c}  key={c.code} />
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

class SearchResult extends React.Component {
    addSection(course, section) {
        course.section = section;
        this.props.addCourse(course);
    }
    render() {
        let course = this.props.course;
        let sections = Object.keys(course.slots).map(sec => 
            <SearchResultSection key={course.id + sec} course={course} section={sec} 
                hoverCourse={this.props.hoverCourse}
                unhoverCourse={this.props.unhoverCourse} 
                onClick={() => this.addSection(course, sec)}
            />
        );
        return (
        <li key={course.id} className="search-course">
            {course.code} : {course.name + " "} 
            <i onClick={() => this.props.addCourse(course)} className="fa fa-plus"></i>
            <div>
                {sections}
            </div>
        </li>);
    }
}

const SearchResultSection = ({ course, section, hoverCourse, unhoverCourse, onClick }) => {
    return (
    <span
        className="search-section" 
        onClick={onClick}
        onMouseEnter={() => hoverCourse(course, section)}
        onMouseLeave={unhoverCourse} 
    >
        {section}
    </span>);
};

