import React from "react";
import classNames from "classnames";
import SearchSideBarContainer from "./containers/search_side_bar_container.jsx";
import ClickOutHandler from "react-onclickout";

export class SearchBar extends React.Component {
    constructor(props) {
        super(props);
        this.state = {focused: false, showDropdown: false};
        this.toggleDropdown = this.toggleDropdown.bind(this);
        this.fetchSearchResults = this.fetchSearchResults.bind(this);
        this.getAbbreviatedSemesterName = this.getAbbreviatedSemesterName.bind(this);
        this.changeTimer = false;
    }

    componentWillMount() {
        $(document.body).on('keydown', (e) => {
            if ($('.nudgespot-message textarea').is(":visible")) {
                return;
            } // don't "search" if Nudgespot textarea is focused
            if ($('input:focus').length === 0 && !this.props.explorationModalIsVisible && !e.ctrlKey) {
                if ((e.keyCode >= 48 && e.keyCode <= 57) || (e.keyCode >= 65 && e.keyCode <= 90)) {
                    $('#search-bar input').focus();
                    this.setState({focused: true});
                }
            } else if ($('input:focus').length !== 0) {
                if (e.key === 'Enter' && this.props.searchResults.length > 0) {
                    this.props.addCourse(this.props.searchResults[this.props.hoveredPosition].id)
                }
                else if (e.key === 'ArrowDown' && parseInt(this.props.hoveredPosition) < 3) {
                    this.props.hoverSearchResult(this.props.hoveredPosition + 1)
                }
                else if (e.key === 'ArrowUp' && parseInt(this.props.hoveredPosition) > 0) {
                    this.props.hoverSearchResult(this.props.hoveredPosition - 1)
                }
                else if (e.key === 'Escape') {
                    this.setState({focused: false});
                    $('#search-bar input').blur();
                }
            }
        });
    }

    toggleDropdown() {
        this.setState({showDropdown: !this.state.showDropdown});
    }

    fetchSearchResults() {
        if (this.changeTimer) clearTimeout(this.changeTimer);
        let query = this.refs.input.value;
        this.changeTimer = setTimeout(() => {
            this.props.fetchCourses(query);
            this.changeTimer = false;
        }, 200);
    }

    onClickOut(e) {
        this.setState({showDropdown: false});
    }

    maybeSetSemester(semester) {
        this.setState({showDropdown: false});
        this.props.maybeSetSemester(semester);
    }

    getAbbreviatedSemesterName(semester) {
        return this.abbreviateSemesterName(semester.name) + " " + this.abbreviateYear(semester.year)
    }

    getSemesterName(semester) {
        return semester.name + " " + semester.year
    }

    abbreviateSemesterName(semesterName) {
        return semesterName[0];
    }

    abbreviateYear(year) {
        return year.replace('20', "'")
    }

    render() {
        let resClass = classNames({'search-results': true, 'trans50': this.props.hasHoveredResult})
        let results = this.props.searchResults.map((c, i) => {
            return (<SearchResult {...this.props}
                                  course={c}
                                  key={c.code}
                                  inRoster={this.props.isCourseInRoster(c.id)}
                                  inOptionRoster={this.props.isCourseOptional(c.id)}
                                  position={i}
            />)
        });
        let result_container = /*!this.state.focused || */results.length == 0 ? null : (
            <ul className={resClass}>
                {results}
                <div id="see-more" style={{height: 240 - 60 * results.length}}>
                    <div id="see-more-inner">
                        <h4>Don't see what you're looking for?</h4>
                        <p>Try switching semesters or click <i className="fa fa-compass"/> above to filter by areas,
                            departments, times and more!</p>
                    </div>
                </div>
                <SearchSideBarContainer />
            </ul>
        );
        let availableSemesters = allSemesters.map((semester, index) => {
            let name = ($(window).width() < 767) ?
                this.getAbbreviatedSemesterName(semester) :
                this.getSemesterName(semester)
            return (
                <div key={ name }
                     className="semester-option"
                     onMouseDown={ () => this.maybeSetSemester(index) }>
                    { name }
                </div>
            )
        });
        let currSem = ($(window).width() < 767) ?
            this.getAbbreviatedSemesterName(this.props.semester) :
            this.getSemesterName(this.props.semester)
        return (
            <div id="search-bar" className="no-print">
                <div id="search-bar-wrapper">
                    <ClickOutHandler onClickOut={this.onClickOut.bind(this)}>
                        <div id="search-bar-semester" onMouseDown={this.toggleDropdown.bind(this)}>
                            <span className={classNames("tip-down", {'down': this.state.showDropdown})}>
                            </span>
                            {currSem}</div>
                        <div id="semester-picker"
                             className={classNames({'down': this.state.showDropdown})}
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
                               onFocus={() => this.setState({focused: true, showDropdown: false})}
                               onBlur={() => this.setState({focused: false})}/>
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
        this.state = {hoverAdd: false, hoverSave: false};
        this.addCourseWrapper = this.addCourseWrapper.bind(this);
        this.actionOver = this.actionOver.bind(this);
        this.actionOut = this.actionOut.bind(this);
        this.hasOnlyWaitlistedSections = this.hasOnlyWaitlistedSections.bind(this);
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

    hasOnlyWaitlistedSections() {
        console.log(this.props.searchResults[this.props.position].code, this.props.searchResults[this.props.position].name);
        let sections = this.props.searchResults[this.props.position].sections;
        for (let sectionType in sections) {
            let sectionTypeHasOpenSections = false;
            for (let section in sections[sectionType]) {
                if (sections[sectionType][section].length > 0) {
                    if (sections[sectionType][section][0].enrolment < sections[sectionType][section][0].size) {
                        console.log(section[0].enrolment, section[0].size, section[0].enrolment < section[0].size);
                        sectionTypeHasOpenSections = true;
                        break;
                    }
                } else {
                    return false;
                }
            }
            console.log(sectionTypeHasOpenSections);
            if (!sectionTypeHasOpenSections) { // lecture, practical, or tutorial doesn't have open seats
                return true;
            }
        }
        return false;
    }

    render() {
        let {course, inRoster, inOptionRoster} = this.props;
        let addRemoveButton =
            <span title="Add this course" className={classNames('search-course-add', {'in-roster': inRoster})}
                  onMouseDown={(event) => this.addCourseWrapper(course, '', event)}
                  onMouseOver={() => this.actionOver("ADD")}
                  onMouseOut={() => this.actionOut("ADD")}>
                <i className={classNames('fa', {'fa-plus': !inRoster, 'fa-check': inRoster})}></i>
            </span>;
        let addOptionalCourseButton = this.props.inRoster ? null :
            <span title="Add this course as optional"
                  className={classNames('search-course-save', {'in-roster': inOptionRoster})}
                  onMouseDown={(event) => this.addOptionalCourseWrapper(course, event)}
                  onMouseOver={() => this.actionOver("SAVE")}
                  onMouseOut={() => this.actionOut("SAVE")}>
                <i className={classNames('fa', {'fa-bookmark': !inOptionRoster, 'fa-check': inOptionRoster})}></i>
            </span>
        let info = course.name ? course.code : "";
        if (this.state.hoverSave) {
            info = !inOptionRoster ? "Add this as an optional course" : "Remove this optional course";
        } else if (this.state.hoverAdd) {
            info = !inRoster ? "Add this course to your timetable" : "Remove this course from your timetable";
        }
        let style = {};
        if (this.state.hoverAdd)
            style = {color: "#52B7D9"};
        if (this.state.hoverSave)
            style = {color: "#27ae60"};
        let integrationLogoImageUrl = {
            backgroundImage: "url(/static/img/integrations/pilotLogo.png)"
        }
        let integrationLogo = course.integrations.indexOf('Pilot') == -1 ?
            <div className="label integration">
                <span className="has-pilot" style={integrationLogoImageUrl}></span>
            </div> : null;
        let pilotIntegration = studentIntegrations['integrations'].indexOf('Pilot') > -1 ?
            <div className="label integration">
                <a onMouseDown={(event) => {
                    event.stopPropagation();
                    this.props.showIntegrationModal(course.id, 1)
                }}>Add as Pilot
                </a>
            </div> : null;
        let waitlistOnlyFlag =  this.hasOnlyWaitlistedSections() ? <h4 className="label flag">Waitlist Only</h4> : null;
        return (
            <li key={course.id}
                className={classNames('search-course', {'hovered': this.props.isHovered(this.props.position)})}
                onMouseDown={(event) => this.props.fetchCourseInfo(course.id)}
                onMouseOver={() => this.props.hoverSearchResult(this.props.position)}
            >
                <h3>{course.name || course.code} </h3>
                { addOptionalCourseButton}
                { addRemoveButton }
                <div className="search-result-labels">
                    <h4 className="label" style={style}>{info}</h4><h4
                    className={classNames('label', 'bubble')}>{this.props.campuses[course.campus]}</h4>
                    { integrationLogo }
                    { pilotIntegration }
                    { waitlistOnlyFlag }
                </div>
            </li>);
    }
}
