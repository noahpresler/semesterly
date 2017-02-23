import React from 'react';
import ReactDOM from 'react-dom';
import classnames from 'classnames';
import MasterSlot from './master_slot.jsx';
import classNames from 'classnames';
import { COLOUR_DATA } from '../constants.jsx';
import ClickOutHandler from 'react-onclickout';
import GCalListContainer from './containers/gcal_list_container.jsx';
import CreditTickerContainer from './containers/credit_ticker_container.jsx';
import Textbook from './textbook.jsx';
import { SemesterOverview } from './side_bar.jsx';
import ReactTooltip from 'react-tooltip';
import { ShareLink } from './master_slot.jsx';

class DTMSideBar extends React.Component {

	constructor(props) {
		super(props);
		this.state = {shareLinkShown: false};
		this.fetchShareLink = this.fetchShareLink.bind(this);
		this.hideShareLink = this.hideShareLink.bind(this);
	}

	fetchShareLink() {
		if (this.props.shareLinkValid) {
			this.setState({shareLinkShown: true});
		} else if (!this.props.isFetchingShareLink) {
			this.props.fetchShareAvailabilityLink();
		}
	}

	hideShareLink() {
		this.setState({shareLinkShown: false});
	}

    render() {
    	let shareLink = this.state.shareLinkShown ?
	        <ShareLink
	            link={this.props.shareLink}
	            onClickOut={this.hideShareLink} /> :
	        null;
        return (
            <div id="side-bar" className="no-print">

                <SemesterOverview />

                <GCalListContainer />

                <div className="cal-btn-wrapper">
					<button onClick={this.fetchShareLink}
							className="save-timetable add-button"
							data-tip data-for='share-btn-tooltip'>
						<i className={classnames("fa",
							{"fa-share-alt": !this.props.isFetchingShareLink},
							{"fa-spin fa-circle-o-notch": this.props.isFetchingShareLink})} />
					</button>
					<ReactTooltip id='share-btn-tooltip' class='tooltip' type='dark' place='bottom' effect='solid'>
						<span>Share Calendar</span>
					</ReactTooltip>
				</div>
            	{shareLink}
            </div>
        );
    }
}

export default DTMSideBar;

