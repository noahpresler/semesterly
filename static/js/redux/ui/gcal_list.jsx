import React from 'react';
import ReactDOM from 'react-dom';
import classnames from 'classnames';
import MasterSlot from './master_slot.jsx';

class GCalList extends React.Component {
    render() {
        return (
            <div id="gcal-list" className="no-print">
                {
                	this.props.calendars.map(c => 
                		(
                			<div key={c.id} className="calendar-li">
                				<div className="check" style={{backgroundColor: c.color}}/>
                				<h4>{c.name}</h4>
                			</div>
                		)
                	)
                }
            </div>
        );
    }
}

export default GCalList;

