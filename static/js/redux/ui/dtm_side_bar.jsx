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

class DTMSideBar extends React.Component {
    render() {
        return (
            <div id="side-bar" className="no-print">
                <SemesterOverview />
                <GCalListContainer />
            </div>
        );
    }
}

export default DTMSideBar;

