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

import PropTypes, { any } from 'prop-types';
import * as SemesterlyPropTypes from '../constants/semesterlyPropTypes';
import React from 'react';
import classNames from 'classnames';
import ClickOutHandler from 'react-onclickout';
import ReactTooltip from 'react-tooltip';

class AdvisorMenu extends React.Component {
  constructor(props) {
    super(props);
    this.state = { showDropdown: false };
    this.toggleDropdown = this.toggleDropdown.bind(this);
    this.hideDropDown = this.hideDropDown.bind(this);
    this.toggleDropdown = this.toggleDropdown.bind(this);
  }

  toggleDropdown() {
    this.setState({ showDropdown: !this.state.showDropdown });
  }

  hideDropDown() {
    this.setState({ showDropdown: false });
  }

  getAddRemoveTooltip(is_adding, is_pending) {
    if (is_adding) {
      return <span>Add advisor</span>
    } else if (is_pending) {
      return <span>Cancel invitation</span>
    }
    return <span>Remove advisor</span>
  }

  render() {
    const { addRemoveAdvisor } = this.props;

    const toggleAdvisorMenuBtn = (
      <div style={{ margin: 'right', marginTop: '5px' }}>
        <button
          className="save-timetable add-button"
          data-for="add-btn-tooltip"
        >
          <i className="fa fa-user-plus" />
        </button>
      </div>
    );

    const addRemoveBtn = (advisor, is_adding, is_pending) => (
      <div className="add-button">
        <button
          onClick={() => addRemoveAdvisor(advisor, is_adding)}
          className="save-timetable add-button"
          data-tip
          data-for={advisor}
        >
          <i className={classNames('fa', {
            'fa-plus': is_adding,
            'fa-clock-o': is_pending && !is_adding,
            'fa-check': !is_pending && !is_adding,
          })} />
        </button>

        <ReactTooltip
          id={advisor}
          class="tooltip"
          type="dark"
          place="bottom"
          effect="solid"
        >
          {this.getAddRemoveTooltip(is_adding, is_pending)}
          {console.log("\n")}
        </ReactTooltip>
      </div>
    );

    const advisorList = (this.props.advisors.length > 0 && this.props.transcript != null) ?
      this.props.advisors.map(advisor => (
        <row key={advisor.jhed} style={{ padding: '5px' }}>
          {/* if name in addedAdvisors, removeBtn, else addBtn */}
          { /* ======= !!!This code is so bad but I don't know how to fix it help!!! ======= */
            this.props.transcript.advisors.some(invited_advisor => { return advisor.jhed === invited_advisor.jhed }) ?
              addRemoveBtn(advisor.jhed, false, this.props.transcript.advisors.filter(invited_advisor => advisor.jhed === invited_advisor.jhed)[0].is_pending) : addRemoveBtn(advisor.jhed, true, false)}
          <p className="advisor"> {`${advisor.full_name}`} </p>
        </row>
      )) : <p style={{ textAlign: 'center', fontSize: '10pt' }}> You are not connected to any advisors </p>;

    return (
      <ClickOutHandler onClickOut={this.hideDropDown}>
        <div onMouseDown={this.toggleDropdown}>
          {toggleAdvisorMenuBtn}
        </div>
        <div className={classNames('advisor-dropdown', { down: this.state.showDropdown })}>
          <p style={{ maxWidth: '70%', fontWeight: 'bold', margin: 'auto', textAlign: 'center', marginTop: '10px' }}>
            Invite Advisors to Comment Forum
          </p>
          <div className="ad-modal-wrapper">
            {advisorList}
          </div>
        </div>
      </ClickOutHandler>
    );
  }

}

AdvisorMenu.defaultProps = {
  transcript: null,
};

AdvisorMenu.propTypes = {
  advisors: PropTypes.arrayOf(PropTypes.shape({
    first_name: PropTypes.string,
    last_name: PropTypes.string,
    full_name: PropTypes.string,
    jhed: PropTypes.string,
    email_address: PropTypes.string,
  })).isRequired,
  addRemoveAdvisor: PropTypes.func.isRequired,
  transcript: SemesterlyPropTypes.transcript,
};

export default AdvisorMenu;
