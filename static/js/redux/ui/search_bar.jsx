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
    toggleHover(c, section, on=false) {
        if (on) {
            let courseWithSection = $.extend({}, c);
            courseWithSection.slots = c.slots[section];
            hoverCourse(courseWithSection);
        }
        else {
            unHoverCourse();
        }
    }
    addCourse(c, section) {
        c.section = section;
        this.props.addCourse(c);
    }
    render() {
    	let results = this.state.courses.map(c => 
        		(<li key={c.id} className="search-course">
        			{c.code} : {c.name} <i onClick={() => this.props.addCourse(c)} className="fa fa-plus"></i>
        			<div>
        				{
        					Object.keys(c.slots).map(sec => 
        						<span key={c.id + sec} 
                                    className="search-section" 
                                    onMouseEnter={() => this.toggleHover(c, sec, true)}
                                    onMouseLeave={() => this.toggleHover(c, sec, false)} 
                                    onClick={() => this.addCourse(c, sec)}
                                >{sec} </span>
        					) 
        				}
        			</div>
        		</li>)
    	);
    	return (
    	<div>
    		<input ref="input" onInput={this.maybeFetchCourses.bind(this)} />
    		<ul>
    		 {
    		 	results
    		 }
    		</ul>
    	</div>
    	);
    }
}
