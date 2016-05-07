import React from 'react';

export class SearchSideBar extends React.Component {
    render() {
        let sections = Object.keys(this.props.slots).map(sec => 
            <SearchResultSection key={this.props.hovered.id + sec} course={this.props.hovered} section={sec} 
                locked={this.props.isSectionLocked(this.props.hovered.id, sec)}
                hoverCourse={() => this.props.hoverCourse(this.props.hovered, sec)}
                unhoverCourse={this.props.unhoverCourse} 
                onClick={this.props.addCourse.bind(this,this.props.hovered.id, sec)}
                sectionHoverOn={this.props.sectionHoverOn}
                sectionHoverOff={this.props.sectionHoverOff}
            />
        );
        return (
            <div id="search-bar-side">
                <div id="search-bar-side-sections">
                    <h4>Lecture Sections</h4>
                    {sections}
                </div>
            </div>
        );
    }
}
const SearchResultSection = ({ section, locked, hoverCourse, unhoverCourse, onClick, sectionHoverOn, sectionHoverOff }) => {
    return (
    <h5
        className="sb-side-sections"
        onClick={onClick}
        onMouseEnter={hoverCourse}
        onMouseLeave={unhoverCourse}
        onMouseOver={sectionHoverOn}
        onMouseOut={sectionHoverOff}
        
    >
        {section + " "}
        { locked ? <i className="fa fa-lock"></i> : null}
    </h5>);
};