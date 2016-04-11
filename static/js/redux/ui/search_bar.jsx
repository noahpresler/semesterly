import React from 'react';
import ReactDOM from 'react-dom';
import fetch from 'isomorphic-fetch';
import { getCourseSearchEndpoint } from '../constants.jsx';
import { hoverCourse, unHoverCourse } from '../init.jsx';

export class SearchBar extends React.Component {
	constructor(props) {
		super(props);
        this.state = {query: '', loading: false, courses: []};
	}
	fetchCourses() {
		this.setState({loading: true});
        fetch(getCourseSearchEndpoint(this.refs.input.value))
        .then(response => response.json()) // TODO(rohan): error-check the response
        .then(json => {
            this.setState({loading: false, courses: json.results});
        });
    }
    maybeFetchCourses() {
    	if (this.refs.input.value.length < 2) {
    		this.setState({loading: false, courses: []});
    	}
    	else {
    		this.fetchCourses();
    	}
    }

    render() {
    	let results = this.state.courses.map(c => 
        		<SearchResult course={c} addCourse={this.props.addCourse} />
    	);
    	return (
    	<div>
    		<input ref="input" onInput={this.maybeFetchCourses.bind(this)} />
    		<ul className="search-results">
    		 {results}
    		</ul>
    	</div>
    	);
    }
}

class SearchResult extends React.Component {
    toggleHoverSection(c, section, on=false) {
        if (on) {
            let courseWithSection = $.extend({}, c);
            courseWithSection.slots = c.slots[section];
            hoverCourse(courseWithSection);
        }
        else {
            unHoverCourse();
        }
    }
    addSection(course, section) {
        course.section = section;
        this.props.addCourse(course);
    }
    render() {
        let course = this.props.course;
        let sections = Object.keys(course.slots).map(sec => 
            <span key={course.id + sec} 
                className="search-section" 
                onMouseEnter={() => this.toggleHoverSection(course, sec, true)}
                onMouseLeave={() => this.toggleHoverSection(course, sec, false)} 
                onClick={() => this.addSection(course, sec)}
            >{sec} </span>
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

