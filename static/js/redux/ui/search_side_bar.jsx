import React from 'react';

export class SearchSideBar extends React.Component {
    render() {
            console.log(this.props);
//         let sections = Object.keys(this.props.slots).map(sec => 
//             <SearchResultSection key={course.id + sec} course={hovered} section={sec} 
//                 locked={this.props.isSectionLocked(course.id, sec)}
//                 hoverCourse={() => this.props.hoverCourse(hovered, sec)}
//                 unhoverCourse={this.props.unhoverCourse} 
//                 onClick={this.addCourse.bind(this, course, sec)}
//                 sectionHoverOn={this.props.sectionHoverOn}
//                 sectionHoverOff={this.props.sectionHoverOff}
//             />
//         );
        let content = this.props.isFetching ? <div className="modal-loader"></div> :
        (<div>
            <h2>Course: {this.props.data.code}</h2><h3>In Roster? {String(this.props.inRoster)}</h3>
        </div>);
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