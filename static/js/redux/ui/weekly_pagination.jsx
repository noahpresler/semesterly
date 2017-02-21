import React from 'react';

export class WeeklyPagination extends React.Component {
    constructor(props) {
        super(props);
        this.prev = this.prev.bind(this);
        this.next = this.next.bind(this);
        this.today = this.today.bind(this);
    }
    prev() {
        this.props.setActive(this.props.activeWeek.getTime() - (7 * 24 * 60 * 60 * 1000), this.props.activeWeekOffset - 1)
    }
    next() {
        this.props.setActive(this.props.activeWeek.getTime() + (7 * 24 * 60 * 60 * 1000), this.props.activeWeekOffset + 1)
    }
    today() {
        this.props.setTodayActive()
    }

    render() {
        let prevButton = (this.props.activeWeekOffset != 0) ? <div className="sem-pagination-nav" onClick={this.prev}>
                    <i className="fa fa-angle-left sem-pagination-prev sem-pagination-icon" />
                </div> : null
        return (
            <div className="sem-pagination">
                { prevButton }
                <div className="sem-pages">
                    <span onClick={this.today}>Today</span>
                </div>
                <div className="sem-pagination-nav" onClick={this.next}>
                    <i className="fa fa-angle-right sem-pagination-next sem-pagination-icon" />
                </div>
            </div>
        );
    }
}
