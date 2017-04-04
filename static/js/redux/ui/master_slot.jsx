import React from 'react';
import { COLOUR_DATA } from '../constants/colours.jsx';
import classNames from 'classnames';
import { getCourseShareLink } from '../helpers/timetable_helpers.jsx';
import ClickOutHandler from 'react-onclickout';

class MasterSlot extends React.Component {
	constructor(props) {
		super(props);
        this.stopPropagation = this.stopPropagation.bind(this);
        this.onMasterSlotHover = this.onMasterSlotHover.bind(this);
        this.onMasterSlotUnhover = this.onMasterSlotUnhover.bind(this);
        this.updateColours = this.updateColours.bind(this);
        this.showShareLink = this.showShareLink.bind(this);
        this.hideShareLink = this.hideShareLink.bind(this);
        this.state = {shareLinkShown: false};
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
    showShareLink() {
        this.setState({shareLinkShown: true});
    }
    hideShareLink() {
        this.setState({shareLinkShown: false});
    }

	render() {
        let friendCircles = null;
        if (this.props.fakeFriends) {
            friendCircles = new Array(this.props.fakeFriends);
            for (let i = 0; i < this.props.fakeFriends; i++) {
                friendCircles[i] = <div className="ms-friend" key={i} style={{backgroundImage: 'url(/static/img/blank.jpg)'}}></div>
            }
        } else {
            friendCircles = this.props.classmates && this.props.classmates.classmates ? this.props.classmates.classmates.map(c => {
                return <div className="ms-friend" key={c.img_url} style={{backgroundImage: 'url(' + c.img_url + ')'}}></div>;
            }) : null;
        }
        
        if ((this.props.classmates && this.props.classmates.classmates && friendCircles.length > 4) 
            ||(this.props.fakeFriends && this.props.fakeFriends > 4)) {
            let plusMore = friendCircles.length - 3 + '+';
            friendCircles = [<div className="ms-friend" key={4}>{plusMore}</div>].concat(friendCircles.slice(0,3))
        }
        let masterSlotClass = 'master-slot slot-' + this.props.course.id;
        let validProfs = this.props.professors ? this.props.professors.filter((p) => p) : false
        let prof = !validProfs || validProfs.length === 0 || validProfs[0] === "" ? "Professor Unlisted" : validProfs.join(', ');
        masterSlotClass = this.props.onTimetable ? masterSlotClass : masterSlotClass + ' optional';
        let numCredits = this.props.course.num_credits;
        let creditsDisplay = numCredits === 1 ? " credit" : " credits";
        creditsDisplay = numCredits + creditsDisplay;
        let prof_disp = this.props.professors == null ? null : <h3>{ prof }</h3>;
        let shareLink = this.state.shareLinkShown ? 
        <ShareLink 
            link={getCourseShareLink(this.props.course.code)}
            onClickOut={this.hideShareLink} /> : 
        null;

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
		            { prof_disp }
		            <h3>{ creditsDisplay }</h3>
		        </div>
		        <div className="master-slot-actions">

		            <i className="fa fa-share-alt" onClick={(event) => this.stopPropagation(this.showShareLink, event)}></i>
                    {shareLink}
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

export const ShareLink = ({link, onClickOut}) => (
    <ClickOutHandler onClickOut={onClickOut}>
        <div id="share-course-link-wrapper">
            <div className="tip-border"></div>
            <div className="tip"></div>
            <input id="share-course-link" size={link.length} value={link} onClick={(e) => e.stopPropagation()} readOnly />
        </div>
    </ClickOutHandler>
)

export default MasterSlot;
