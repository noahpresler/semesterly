import React from 'react';
import classnames from 'classnames';

export class SearchSideBar extends React.Component {
    constructor(props){
        super(props);
        this.lockSectionWrapper = this.lockSectionWrapper.bind(this);
    }
    lockSectionWrapper(section, event) {
        event.preventDefault();
        event.stopPropagation();
        this.props.addCourse(this.props.hovered.id, section);
    }
    mapSectionsToSlots(sections) {
        if (sections === undefined) {
            return [];
        }
        return Object.keys(sections).map(sec => 
            <SearchResultSection key={this.props.hovered.id + sec} course={this.props.hovered} section={sec} 
                locked={this.props.isSectionLocked(this.props.hovered.id, sec)}
                isOnActiveTimetable={this.props.isSectionOnActiveTimetable(this.props.hovered.id, sec)}
                hoverSection={() => this.props.hoverSection(this.props.hovered, sec)}
                unhoverSection={this.props.unhoverSection} 
                onMouseDown={(event) => this.lockSectionWrapper(sec, event)}
            />
        );
    }
    render() {
        let lecs = this.mapSectionsToSlots(this.props.lectureSections);
        let tuts = this.mapSectionsToSlots(this.props.tutorialSections);
        let pracs = this.mapSectionsToSlots(this.props.practicalSections);
        let lectureSections = null;
        let tutorialSections = null;
        let practicalSections = null;
        if (lecs.length > 0) {
            lectureSections = <div><h4> Lecture Sections </h4>{lecs}</div>
        }
        if (tuts.length > 0) {
            tutorialSections = <div><h4> Tutorial Sections </h4>{tuts}</div>
        }
        if (pracs.length > 0) {
            practicalSections = <div><h4> Practical Sections </h4>{pracs}</div>
        }
        return (
            <div id="search-bar-side">
                <div id="search-bar-side-sections">
                    {lectureSections}
                    {tutorialSections}
                    {practicalSections}
                </div>
            </div>
        );
    }
}
const SearchResultSection = ({ section, locked, hoverSection, unhoverSection, onMouseDown, isOnActiveTimetable }) => {
    let rosterIndicator = null;
    if (isOnActiveTimetable) {
        rosterIndicator = <i className="fa fa-calendar-check-o" />
    }
    if (locked) {
        rosterIndicator = <i className="fa fa-lock" />
    }

    return (
    <h5
        className={classnames("sb-side-sections", {'on-active-timetable': isOnActiveTimetable})}

        onMouseDown={onMouseDown}
        onMouseEnter={hoverSection}
        onMouseLeave={unhoverSection}
    >
        {section + " "}
        {rosterIndicator}
    </h5>);
};
