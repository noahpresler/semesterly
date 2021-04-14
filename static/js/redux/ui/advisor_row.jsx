/*
Copyright (C) 2017 Semester.ly Technologies, LLC

Semester.ly is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

Semester.ly is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.
*/

import React from "react";
import ReactTooltip from "react-tooltip";

class AdvisorRow extends React.Component {

    constructor(props) {
        super(props);
    }

    render() {

        const addButton = (
            <div className="cal-btn-wrapper">
                <button
                    //onClick={}
                    className="save-timetable add-button"
                    data-tip
                    data-for="add-btn-tooltip"
                >
                    <i className="fa fa-plus" />
                </button>
                <ReactTooltip
                    id="add-btn-tooltip"
                    class="tooltip"
                    type="dark"
                    place="bottom"
                    effect="solid"
                >
                    <span>Add to forum </span>
                </ReactTooltip>
            </div>
        );

        return (
            <div className="ad-row">
                <div className="ad-name">{this.props.advisor}</div>
                <div className="ad-icon">{addButton}</div>
            </div>
        );
    }

}

export default AdvisorRow;