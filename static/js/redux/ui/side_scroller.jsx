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

import PropTypes from 'prop-types';
import React from 'react';

class SideScroller extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      activeSlide: 0,
    };
  }

  render() {
    if (this.props.content.length <= 2) {
      return <div style={{ marginBottom: '-30px !important' }}>{this.props.content}</div>;
    }
    let navItems = null;
    if (this.props.navItems) {
      const navs = [];

      for (let i = 0; i < this.props.navItems.length; i++) {
        const cls = this.state.activeSlide === i ?
          ' nav-item-active' : '';
        navs.push(
          <span
            key={i}
            className={`nav-item${cls}`}
            onClick={() => this.setState({ activeSlide: i })}
          >{this.props.navItems[i]}</span>,
        );
      }
      navItems = <div className="scroll-nav">{navs}</div>;
    }
    return (
      <div>
        {navItems}
        {this.props.content[this.state.activeSlide]}
      </div>
    );
  }
}


SideScroller.propTypes = {
  content: PropTypes.arrayOf(PropTypes.element).isRequired,
  navItems: PropTypes.arrayOf(PropTypes.element).isRequired,
};


export default SideScroller;

