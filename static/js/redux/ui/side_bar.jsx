import React from 'react';
import ReactDOM from 'react-dom';
import classnames from 'classnames';

class SideBar extends React.Component {
    changeName() {
        this.props.changeName(this.refs.input.value);
    }
    render() {
        let savedTimetables = this.props.savedTimetables ? this.props.savedTimetables.map(t => {
            return <div key={t.id} onClick={() => this.props.loadTimetable(t)}>{t.name}</div>
        }) : null;
        return (
            <div id="side-bar">
                <input ref="input" className={classnames({"unsaved": !this.props.upToDate})}
                    placeholder={this.props.activeTimetable.name}
                    onChange={this.changeName.bind(this)}
                    />
                { savedTimetables }
                <div id="sb-rating" className="col-1-2">
                    <h3>Average Course Rating</h3>
                    <div className="sub-rating-wrapper">
                        <div className="star-ratings-sprite">
                            <span className="rating"></span>
                        </div>
                    </div>
                </div>
                <div id="sb-credits" className="col-1-2">
                    <h3>16</h3>
                    <h4>credits</h4>
                </div>
                <div id="sb-master-slots">
                    <div className="master-slot">
                        <div className="slot-bar"></div>
                        <div className="master-slot-content">
                            <h3>EN.650.311</h3>
                            <h3>Discrete Mathematics</h3>
                            <h3>Baryl Castello</h3>
                            <h3>4 credits</h3>
                        </div>
                        <div className="master-slot-actions">
                            <i className="fa fa-share-alt"></i>
                            <i className="fa fa-times"></i>
                        </div>
                        <div className="master-slot-friends">
                            <div className="ms-friend">5+</div>
                            <div className="ms-friend" style={{backgroundImage: 'url(/static/img/blank.jpg)' }}></div>
                            <div className="ms-friend" style={{backgroundImage: 'url(/static/img/blank.jpg)' }}></div>
                            <div className="ms-friend" style={{backgroundImage: 'url(/static/img/blank.jpg)' }}></div>
                        </div>
                    </div>
                </div>
                <h4 className="sb-header">Optional Courses</h4>
                <div className="side-bar-section">
                    content
                </div>
                <h4 className="sb-header">Textbooks</h4>
                <div className="side-bar-section">
                    content
                </div>
            </div>
        );
    }
}

export default SideBar;
