import React from 'react';
import ReactDOM from 'react-dom';
import fetch from 'isomorphic-fetch';
import { getCourseSearchEndpoint } from '../constants.jsx';
import classNames from 'classnames';
import SearchSideBarContainer from './containers/search_side_bar_container.jsx'

export class SearchBar extends React.Component {
    constructor(props){
        super(props);
        this.state = {focused: false};
        this.changeTimer = false;
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
        let res_class = classNames({'search-results' : true, 'trans50' : this.props.hasHoveredResult})
    	let results = this.props.searchResults.map( (c, i) => {
            return (<SearchResult {...this.props}
                course={c} 
                key={c.code}
                inRoster={this.props.isCourseInRoster(c.id)}
                position={i}
                />)
    	});
        let result_container = results.length == 0 ? null : (
            <ul className={res_class} >
                {results}
                <SearchSideBarContainer />
            </ul>
        );

    	return (
        	<div id="search-bar">
                <div id="search-bar-wrapper">
                    <div id="search-bar-semester">Fall 2016</div>
                    <div id="search-bar-input-wrapper">
                        <input ref="input" 
                               className={this.props.isFetching ? 'results-loading-gif' : ''} 
                               onInput={this.fetchSearchResults.bind(this)} 
                               onFocus={() => this.setState({focused: true})}
                               onBlur={() => this.setState({focused: false})}
                               />
                    </div>
                </div>
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
        return (
        <li key={course.id}
            className="search-course"
            onClick={() => this.props.fetchCourseInfo(course.id)} style={this.props.inRoster ? {backgroundColor:"#4DFDBD"} : {}}
            onMouseOver={() => this.props.hoverSearchResult(this.props.position)}
            >
            <h3>{course.name} </h3>
            <span className="search-course-save">
                <i className="fa fa-bookmark"></i>
            </span>
            <span className="search-course-add" onClick={this.addCourse.bind(this, course, '')}>
                <i className="fa fa-plus"></i>
            </span>
            <h4>{course.code}</h4>
        </li>);
    }
}