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
import twemoji from 'twemoji';
import renderHTML from 'react-render-html';
import classNames from 'classnames';
import REACTION_MAP from '../constants/reactions';

class Reaction extends React.Component {
  constructor(props) {
    super(props);
    this.state = { didSelect: this.props.selected === true, animating: true };
    this.toggleSelected = this.toggleSelected.bind(this);
    this.animate = this.animate.bind(this);
  }

  componentDidMount() {
    this.animate();
  }

  componentWillReceiveProps(nextProps) {
    this.setState({ didSelect: nextProps.selected === true });
  }

  animate() {
    setTimeout(() => {
      this.setState({ animating: false });
    }, 300);
  }

  toggleSelected() {
    this.setState({ animating: true });
    this.animate();
    this.props.react();
    this.setState({
      didSelect: !this.state.didSelect,
    });
  }

  render() {
    const size = 20 + ((this.props.count / this.props.total) * 45);
    const emojiStyle = { height: size, width: size };
    return (
      <div
        className={classNames({
          swing: true,
          reaction: true,
          'no-animate': !this.state.animating,
        })}
        onClick={this.toggleSelected}
      >
        <div
          className="emoji"
          style={emojiStyle}
        >
          {renderHTML(twemoji.parse(REACTION_MAP[this.props.emoji].unicode))}
        </div>
        <div
          className={classNames({
            'action-container': true,
            selected: this.state.didSelect,
          })}
        >
          <div className="emoji-action">
            <i className="fa fa-plus" />
          </div>
          <div className="emoji-count">
            <span>{this.props.count}</span>
          </div>
        </div>
        <div className="reaction-dropdown">
          <div className="tip-border" />
          <div className="tip" />
          <span>{REACTION_MAP[this.props.emoji].name}</span>
        </div>
      </div>);
  }
}

Reaction.defaultProps = {
  emoji: '',
  selected: false,
};

Reaction.propTypes = {
  emoji: (props, propName, componentName) => {
    const emoji = props[propName];
    if (Object.prototype.hasOwnProperty.call(REACTION_MAP, emoji)) {
      return null;
    }
    return new Error(`Invalid emoji in ${componentName}`);
  },
  total: PropTypes.number.isRequired,
  count: PropTypes.number.isRequired,
  react: PropTypes.func.isRequired,
  selected: PropTypes.bool,
};

export default Reaction;

