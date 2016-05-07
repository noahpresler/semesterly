import React from 'react';

export class SearchSideBar extends React.Component {
    mapSectionsToSlots(sections) {
        if (sections === undefined) {
            return [];
        }
        return Object.keys(sections).map(sec => 
            <SearchResultSection key={this.props.hovered.id + sec} course={this.props.hovered} section={sec} 
                locked={this.props.isSectionLocked(this.props.hovered.id, sec)}
                hoverCourse={() => this.props.hoverCourse(this.props.hovered, sec)}
                unhoverCourse={this.props.unhoverCourse} 
                onClick={this.props.addCourse.bind(this,this.props.hovered.id, sec)}
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
const SearchResultSection = ({ section, locked, hoverCourse, unhoverCourse, onClick }) => {
    return (
    <h5
        className="sb-side-sections"
        onClick={onClick}
        onMouseEnter={hoverCourse}
        onMouseLeave={unhoverCourse}
    >
        {section + " "}
        { locked ? <i className="fa fa-lock"></i> : null}
    </h5>);
};