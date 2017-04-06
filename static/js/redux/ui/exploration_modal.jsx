import React from "react";
import Modal from "boron/DropModal";
import classNames from "classnames";
import {CourseModalBody} from "./course_modal_body.jsx";
import ClickOutHandler from "react-onclickout";
import {getCourseShareLink} from "../helpers/timetable_helpers.jsx";
import {ShareLink} from "./master_slot.jsx";
import InputRange from "./react_input_range.jsx";

export class ExplorationModal extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            show_areas: false,
            show_departments: false,
            show_levels: false,
            show_times: false,
            areas: [],
            departments: [],
            levels: [],
            times: [], // will contain 5 objects, containing keys "min" and "max" (times), for each day of the week
            addedDays: [],
            shareLinkShown: false,
            hasUpdatedCourses: false
        };
        this.dayMap = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
            this.toggle = this.toggle.bind(this);
        this.fetchAdvancedSearchResults = this.fetchAdvancedSearchResults.bind(this);
        this.fetchAdvancedSearchResultsWrapper = this.fetchAdvancedSearchResultsWrapper.bind(this);
        this.addOrRemoveCourse = this.addOrRemoveCourse.bind(this);
        this.changeTimer = false;
        this.hide = this.hide.bind(this);
        this.addFilter = this.addFilter.bind(this);
        this.isFiltered = this.isFiltered.bind(this);
        this.removeFilter = this.removeFilter.bind(this);
        this.hideAll = this.hideAll.bind(this);
        this.showShareLink = this.showShareLink.bind(this);
        this.hideShareLink = this.hideShareLink.bind(this);
    }

    componentWillReceiveProps(nextProps) {
        if (this.props.isVisible && !nextProps.isVisible) {
            this.refs.modal.hide();
        }
        if (nextProps.advancedSearchResults != this.props.advancedSearchResults) {
            this.setState({hasUpdatedCourses: true});
        }
        if (nextProps.advancedSearchResults.length > 0 && this.props.advancedSearchResults == 0) {
            this.props.fetchCourseClassmates(nextProps.advancedSearchResults[0].id);
        }
    }

    componentDidUpdate(prevProps, prevState) {
        if (this.props.isVisible) {
            this.refs.modal.show();
        }
        let {areas, departments, times, levels} = this.state;
        let filters = {areas, departments, times, levels};
        areas, departments, times, levels = prevState.areas, prevState.departments, prevState.times, prevState.levels;
        let prevFilters = {areas, departments, times, levels};
        if (!_.isEqual(filters, prevFilters) && this.props.page > 1) {
            this.props.clearPagination();
        }
        $('#exp-search-results').scroll(function () {
            let scrollPercent = 100 * $('#exp-search-results').scrollTop() / ($(document).height() - $('#exp-search-results').height());
            if (scrollPercent > 40 && !prevState.hasUpdatedCourses && this.state.hasUpdatedCourses) {
                this.setState({hasUpdatedCourses: false});
                this.props.paginate();
                this.fetchAdvancedSearchResultsWrapper();
            }
        }.bind(this));
    }

    showShareLink() {
        this.setState({shareLinkShown: true});
    }

    hideShareLink() {
        this.setState({shareLinkShown: false});
    }

    toggle(filterType) {
        return () => {
            if (this.props.isFetching) {
                return;
            }
            let stateName = "show_" + filterType;
            this.setState({[stateName]: !this.state[stateName]});
        }
    }

    hide() {
        this.props.unHoverSection();
        this.props.hideModal();
        this.refs.modal.hide();
    }

    fetchAdvancedSearchResults(filters) {
        if (this.props.isFetching) {
            return;
        }
        let query = this.refs.input.value;
        let {areas, departments, times, levels} = filters;
        this.props.fetchAdvancedSearchResults(query, {
            areas,
            departments,
            times,
            levels
        });
    }

    fetchAdvancedSearchResultsWrapper() {
        if (this.changeTimer) clearTimeout(this.changeTimer);
        this.changeTimer = setTimeout(() => {
            // fetchAdvancedSearchResults requires that its argument contain
            // at least the filters. since this.state has them, we simply pass this.state
            // as its argument. there are other aspects of state that are irrelevant for the call,
            // but we include them for the brevity of just passing this.state
            this.fetchAdvancedSearchResults(this.state);
            this.changeTimer = false;
        }, 200);
    }

    isFiltered(filterType, filter) {
        return this.state[filterType].indexOf(filter) > -1
    }

    addFilter(filterType, filter) {
        if (this.props.isFetching || this.state[filterType].indexOf(filter) > -1) {
            return;
        }
        let updatedFilter = [...this.state[filterType], filter];
        this.fetchAdvancedSearchResults(Object.assign({}, this.state, {[filterType]: updatedFilter}));

        this.setState({[filterType]: updatedFilter});
    }

    removeFilter(filterType, filter) {
        if (this.props.isFetching) {
            return;
        }
        let updatedFilter = this.state[filterType].filter(f => f != filter);
        this.fetchAdvancedSearchResults(Object.assign({}, this.state, {[filterType]: updatedFilter}));
        this.setState({[filterType]: updatedFilter});
    }

    hideAll() {
        this.setState({
            show_departments: false,
            show_areas: false,
            show_times: false,
            show_levels: false
        })
    }

    addOrRemoveCourse(id, section = '') {
        this.props.addOrRemoveCourse(id, section);
        this.hide();
    }

    addOrRemoveOptionalCourse(course) {
        this.props.addOrRemoveOptionalCourse(course);
        this.hide();
    }

    handleTimesChange(component, values) {
        if (this.props.isFetching) {
            return;
        }
        let times = [...this.state.times];
        let i = times.findIndex(t => t.day === component.props.day);
        times[i] = Object.assign({}, times[i], values);
        this.setState({
            times
        });
    }

    addDayForTimesFilter(filterType, day) {
        if (this.state.addedDays.indexOf(day) > -1) {
            return;
        }
        let availableDays = this.dayMap;
        let addedDays = [...this.state.addedDays, day];
        addedDays.sort((a, b) => (
            availableDays.indexOf(a) - availableDays.indexOf(b)
        ));
        let times = [...this.state.times, {
            min: 8,
            max: 24,
            day,
        }];
        let stateUpdate = {
            addedDays,
            times,
        };
        this.setState(stateUpdate);
        this.fetchAdvancedSearchResults(Object.assign({}, this.state, stateUpdate));
    }

    removeTimeFilter(day) {
        let {times, addedDays} = this.state;
        let addedDayIndex = addedDays.indexOf(day);
        let timesIndex = times.findIndex(t => t.day === day);
        if (addedDayIndex === -1) {
            return;
        }
        let stateUpdate = {
            addedDays: [
                ...addedDays.slice(0, addedDayIndex),
                ...addedDays.slice(addedDayIndex + 1)
            ],
            times: [
                ...times.slice(0, timesIndex),
                ...times.slice(timesIndex + 1)
            ],
        };
        this.setState(stateUpdate);
        this.fetchAdvancedSearchResults(Object.assign({}, this.state, stateUpdate));
    }

    render() {
        let modalStyle = {
            width: '100%',
            backgroundColor: 'transparent'
        };
        let {advancedSearchResults, course, inRoster} = this.props;

        let numSearchResults = advancedSearchResults.length > 0 ?
            <p>returned { advancedSearchResults.length } Search Results</p> : null;
        let searchResults = advancedSearchResults.map((c, i) => {
            return <ExplorationSearchResult
                key={i} code={c.code} name={c.name}
                onClick={() => this.props.setAdvancedSearchResultIndex(i, c.id)}/>
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
            let shareLink = this.state.shareLinkShown ?
                <ShareLink
                    link={getCourseShareLink(course.code)}
                    onClickOut={this.hideShareLink}/> :
                null;
            courseModal = <div id="modal-content">
                <div id="modal-header">
                    <h1>{ course.name }</h1>
                    <h2>{ course.code }</h2>
                    <div id="modal-share" onClick={this.showShareLink}>
                        <i className="fa fa-share-alt"></i>
                    </div>
                    { shareLink }
                    {
                        inRoster ? null :
                            <div id="modal-save" onClick={() => this.addOrRemoveOptionalCourse(course)}>
                                <i className="fa fa-bookmark"></i>
                            </div>
                    }
                    <div id="modal-add" onClick={() => this.addOrRemoveCourse(course.id)}>
                        <i className={classNames('fa', {'fa-plus': !inRoster, 'fa-check': inRoster})}></i>
                    </div>
                </div>
                <CourseModalBody {...course}
                                 lectureSections={lectureSections}
                                 tutorialSections={tutorialSections}
                                 practicalSections={practicalSections}
                                 data={course}
                                 classmates={this.props.classmates}
                                 addOrRemoveCourse={this.addOrRemoveCourse}
                                 isSectionLocked={this.props.isSectionLocked}
                                 isSectionOnActiveTimetable={this.props.isSectionOnActiveTimetable}
                                 schoolSpecificInfo={this.props.schoolSpecificInfo}
                />
            </div>
        }
        let filterTypes = ["departments", "areas", "levels"];
        let filters = filterTypes.map(filterType => (
            this.props[filterType].length === 0 ? null :
                <Filter results={this.props[filterType]}
                        key={filterType} filterType={filterType}
                        add={this.addFilter} show={this.state["show_" + filterType]}
                        isFiltered={this.isFiltered}
                        onClickOut={this.hideAll}
                        schoolSpecificInfo={this.props.schoolSpecificInfo}/>
        ));
        let selectedFilterSections = filterTypes.map(filterType => {
            if (this.props[filterType].length === 0) {
                return null;
            }
            let availableFilters = this.props[filterType];
            // sort selected filters according to the order in which they were received from props
            let sortedFilters = this.state[filterType].concat().sort((a, b) => (
                availableFilters.indexOf(a) - availableFilters.indexOf(b)
            ));
            let selectedItems = sortedFilters.map((name, i) => (
                <SelectedFilter key={i} name={name} remove={() => this.removeFilter(filterType, name)}/>
            ));
            let name = this.props.schoolSpecificInfo[filterType + "Name"];

            return <SelectedFilterSection key={filterType} name={name}
                                          toggle={this.toggle(filterType)}
                                          children={selectedItems}/>
        });

        let timeFilters = this.state.addedDays.map((d, i) => {
            let timeState = this.state.times.find(t => t.day === d);
            let value = {min: timeState.min, max: timeState.max};
            return <TimeSelector
                key={timeState.day}
                day={timeState.day}
                value={value}
                onChange={this.handleTimesChange.bind(this)}
                onChangeComplete={() => this.fetchAdvancedSearchResults(this.state)}
                remove={this.removeTimeFilter.bind(this)}
            />
        });
        let explorationLoader = this.props.isFetching ? <i className="fa fa-spin fa-refresh"/> : null;
        let content = (
            <div id="exploration-content">
                <div id="exploration-header"
                     className="cf">
                    <div id="exp-title"
                         className="col-4-16">
                        <i className="fa fa-compass"></i>
                        <h1>Advanced Search</h1>
                    </div>
                    <div className="col-5-16">
                        <input
                            ref="input"
                            placeholder={"Searching " + this.props.semesterName}
                            onInput={ () => {
                                this.props.clearPagination();
                                this.fetchAdvancedSearchResultsWrapper();
                            }
                            }/>
                    </div>
                    <div id="exploration-close"
                         onMouseDown={() => this.refs.modal.hide()}>
                        <i className="fa fa-times"></i>
                    </div>
                </div>
                <div id="exploration-body">
                    <div id="exp-filters" className="col-4-16">
                        { selectedFilterSections }
                        <SelectedFilterSection key={"times"} name={"Day/Times"}
                                               toggle={this.toggle("times")}
                                               children={timeFilters}/>
                    </div>
                    <div id="exp-search-results" className="col-5-16">
                        <div id="exp-search-list">
                            { numSearchResults }
                            { searchResults }
                            {explorationLoader}
                        </div>
                    </div>
                    { filters }
                    <Filter results={["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]}
                            filterType={"times"}
                            add={this.addDayForTimesFilter.bind(this)} show={this.state["show_times"]}
                            isFiltered={this.isFiltered}
                            onClickOut={this.hideAll}
                            schoolSpecificInfo={this.props.schoolSpecificInfo}
                    />
                    {
                        this.props.isFetching && this.props.page == 1 ? null :
                            <div id="exp-modal" className="col-7-16">
                                { courseModal }
                            </div>
                    }
                </div>
            </div>
        );
        return (
            <Modal ref="modal"
                   className={classNames("exploration-modal max-modal", {"trans": this.props.hasHoveredResult})}
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
            this.setState({results: this.props.results});
        }
        else {
            let results = this.props.results;
            this.setState({
                results: results.filter(r => r.toLowerCase().includes(query))
            });
        }
    }

    render() {
        if (!this.props.show) {
            return null;
        }
        let {filterType, schoolSpecificInfo} = this.props;
        let placeholder = schoolSpecificInfo[filterType + "Name"];
        let results = this.state.results.map((r, i) => {
            return <li key={i} onClick={() => this.props.add(filterType, r)}>
                <i className={classNames({"fa": true, "fa-check": this.props.isFiltered(filterType, r)})}></i>
                <h6>{r}</h6>
            </li>
        });
        return (
            <ClickOutHandler onClickOut={this.props.onClickOut}>
                <div className="filter-pop-out open">
                    <input ref={(ref) => this.filterInput = ref} placeholder={placeholder}
                           onInput={this.filterResults}/>
                    <div className="fpo-list">
                        <ul>
                            { results }
                        </ul>
                    </div>
                </div>
            </ClickOutHandler>

        );
    }

    componentDidUpdate(prevProps, prevState) {
        if (!prevProps.show && this.props.show) {
            this.filterInput.focus();
        }
    }

}

const SelectedFilter = ({name, remove}) => (
    <h6>
        <i className="fa fa-times" onClick={() => remove()}></i>
        <span>{ name }</span>
    </h6>
);

const SelectedFilterSection = ({name, toggle, children}) => (
    <div className="exp-filter-section open">
        <h3 className="exp-header">
            <span>{ name.substring(0, name.length - 1) } Filter</span>
            <i className="fa fa-plus"
               onClick={toggle}></i>
        </h3>
        { children.length > 0 ? children : <h6 className="none-selected">None Selected</h6> }
    </div>
);

class TimeSelector extends React.Component {

    render() {
        let {day, value, onChange, onChangeComplete, remove} = this.props;
        return <div className="time-selector">
            <span className="time-selector-day"> <i className="fa fa-times"
                                                    onClick={() => remove(day)}/>{ day.slice(0, 3) } </span>
            <InputRange
                day={day}
                maxValue={24}
                minValue={8}
                value={value}
                onChange={onChange}
                onChangeComplete={onChangeComplete}
            />
        </div>
    }

    componentDidMount() {
        $(".InputRange-labelContainer").filter((i, c) => i % 2 === 0)
            .addClass('InputRange-labelMaxTime');
    }
}
