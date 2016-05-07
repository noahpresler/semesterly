import React from 'react';
import ReactDOM from 'react-dom';

class SideBar extends React.Component {
    render() {
        return (
            <div id="side-bar">
                <div className="side-bar-header">
                  <h4>Your Semester</h4>
                </div>
                <div className="side-bar-section">
                    content
                    content
                    content
                    content
                    content
                    content
                </div>
                <div className="side-bar-header">
                  <h4>Optional Courses</h4>
                </div>
                <div className="side-bar-section">
                    content
                    content
                    content
                    content
                    content
                    content
                </div>
                <div className="side-bar-header">
                  <h4>Textbooks</h4>
                </div>
                <div className="side-bar-section">
                    content
                    content
                    content
                    content
                    content
                    content
                </div>
            </div>
        );
    }
}

export default SideBar;