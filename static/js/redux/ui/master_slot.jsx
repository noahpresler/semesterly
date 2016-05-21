import React from 'react';
import { COLOUR_DATA } from '../constants.jsx';
import classNames from 'classnames';

class MasterSlot extends React.Component {
	constructor(props) {
		super(props);
        this.stopPropagation = this.stopPropagation.bind(this);
        this.onMasterSlotHover = this.onMasterSlotHover.bind(this);
        this.onMasterSlotUnhover = this.onMasterSlotUnhover.bind(this);
        this.updateColours = this.updateColours.bind(this);
    }
    stopPropagation(callback, event) {
        event.stopPropagation();
        callback();
    }
	onMasterSlotHover() {
        this.setState({ hovered : true});
        this.updateColours(COLOUR_DATA[this.props.colourIndex].highlight);
    }
    onMasterSlotUnhover() {
        this.setState({ hovered : false});
        this.updateColours(COLOUR_DATA[this.props.colourIndex].background);
    }
    updateColours(colour) {
        // no updating when hovering over a masterslot in the course modal (i.e. related course)
        if (this.props.inModal) {return;}
        // update sibling slot colours (i.e. the slots for the same course)
        $(".slot-" + this.props.course.id)
          .css('background-color', colour)
    }

	render() {
        let friendCircles = this.props.classmates && this.props.classmates.classmates ? this.props.classmates.classmates.map(c => {
            return <div className="ms-friend" key={c.img_url} style={{backgroundImage: 'url(' + c.img_url + ')'}}></div>;
        }) : null;
        if (this.props.classmates && this.props.classmates.classmates && friendCircles.length > 4) {
            let plusMore = friendCircles.length - 3 + '+';
            friendCircles = [<div className="ms-friend" key={4}>{plusMore}</div>].concat(friendCircles.slice(0,3))
        }
        let masterSlotClass = 'master-slot slot-' + this.props.course.id;
        let prof = !this.props.professors || this.props.professors.length === 0 || this.props.professors[0] === "" ? "Professor Unlisted" : this.props.professors.join(', ');
        masterSlotClass = this.props.onTimetable ? masterSlotClass : masterSlotClass + ' optional';
		return <div className={masterSlotClass}
					onMouseEnter={ this.onMasterSlotHover }
                    onMouseLeave={ this.onMasterSlotUnhover }
                    style={ { backgroundColor: COLOUR_DATA[this.props.colourIndex].background }}
                    onClick={this.props.fetchCourseInfo}
               >
                    
		        <div className="slot-bar"
		        	style={ { backgroundColor: COLOUR_DATA[this.props.colourIndex].border } }
		        ></div>
		        <div className="master-slot-content">
		            <h3>{ this.props.course.code }</h3>
		            <h3>{ this.props.course.name }</h3>
		            <h3>{ prof }</h3>
		            <h3>4 credits</h3>
		        </div>
		        <div className="master-slot-actions">
		            <i className="fa fa-share-alt"></i>
                    {
                        !this.props.hideCloseButton ? 
		            <i className="fa fa-times" 
                        onClick={(event) => this.stopPropagation(this.props.removeCourse, event)}></i> : null
                    }
		        </div>
		        <div className="master-slot-friends">
                    {friendCircles}
		        </div>
    	</div>
    }
}

export default MasterSlot;
