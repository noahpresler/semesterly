import React from 'react';
import ReactDOM from 'react-dom';
import classNames from 'classnames';

export class CourseModalBody extends React.Component {
    mapSectionsToSlots(sections) {
        if (sections === undefined) {
            return [];
        }
        return Object.keys(sections).map(sec =>{
            let slots = sections[sec];
            let instructors = new Set();
            for (let s of slots) {
                if (!instructors.has(s.instructors)) {
                    instructors.add(s.instructors);
                }
            }
            let instructString = Array.from(instructors).join(', ');
            let enrolled = slots[0].enrolled || 0;
            return <SearchResultSection 
                    key={sec}
                    section={slots}
                    secName={sec}
                    instr={instructString}
                    enrolled={enrolled}
                    waitlist={slots[0].waitlist}
                    size={slots[0].size}
                    hoverSection={() => this.props.hoverSection(this.props.data, sec)}
                    unhoverSection={this.props.unhoverSection} 
                />
        });
    }
    render() {
        let lecs = this.mapSectionsToSlots(this.props.lectureSections);
        let tuts = this.mapSectionsToSlots(this.props.tutorialSections);
        let pracs = this.mapSectionsToSlots(this.props.practicalSections);
        let lectureSections = null;
        let tutorialSections = null;
        let practicalSections = null;
        if (lecs.length > 0) {
            lectureSections = <div><h3 className="modal-module-header">Lecture Sections</h3>{lecs}</div>
        }
        if (tuts.length > 0) {
            tutorialSections = <div><h3 className="modal-module-header">Tutorial Sections</h3>{tuts}</div>
        }
        if (pracs.length > 0) {
            practicalSections = <div><h3 className="modal-module-header">Practical Sections</h3>{pracs}</div>
        }
        return (
        <div id="modal-body">
                <div className="cf">
                    <div className="col-3-16">
                        <div className="credits">
                            <h3>3</h3>
                            <h4>credits</h4>
                        </div>
                        <div className="rating-module">
                            <h4>Average Course Rating</h4>
                            <div className="sub-rating-wrapper">
                                <div className="star-ratings-sprite">
                                    <span></span>
                                </div>
                            </div>
                        </div>
                        <div>
                            <h3 className="modal-module-header">Prerequisites</h3>
                            <p>{this.props.prerequisites}</p>
                        </div>
                        <div>
                            <h3 className="modal-module-header">Similar Courses</h3>

                        </div>
                    </div>
                    <div className="col-8-16">
                        <div>
                            <h3 className="modal-module-header">Course Description</h3>
                            <p>{this.props.description}</p>
                        </div>
                        <div>
                            <h3 className="modal-module-header">Course Evaluations</h3>

                        </div>
                        <div>
                            <h3 className="modal-module-header">Textbook</h3>

                        </div>
                    </div>
                    <div id="modal-section-lists"
                        className="col-5-16 cf">
                        {lectureSections}
                        {tutorialSections}
                        {practicalSections}
                    </div>
                </div>
            </div>
        );
    }
}

const SearchResultSection = ({ section, secName, instr , enrolled, waitlist, size, hoverSection, unhoverSection}) => {
    let seats = size - enrolled;
    let seatStatus = waitlist > 0 ? (waitlist + " waitlist") : (seats + " open");
    let benchmark = "green";
    if (waitlist > 0) {
        benchmark = "red";
    } else if (seats < size/10) {
        benchmark = "yellow";
    }
    return (
    <div className="modal-section" onMouseEnter={hoverSection} onMouseLeave={unhoverSection}>
        <h4>{secName}</h4>
        <h5>{instr}</h5>
        <h6><span className={benchmark}>{seatStatus}</span> / {size} seats</h6>
    </div>
    );
};