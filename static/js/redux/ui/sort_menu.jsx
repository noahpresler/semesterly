import React from 'react'

// friends, conflicts, days off, time on/off campus, rating

const sortRow = (props) => {
  <div className="sort-row">
    <span> this.props.actionText </span>
    <select name="order"> 
      <option selected="selected">this.props.chosenMetric</option>
      <option>least</option>
    </select>
    <select name="metric">
      <option selected="selected">{this.props.availMetrics[0]}</option>
      {this.props.availMetrics.slice(1).map((metric) => (<option>{metric}</option>))}
    </select>
    <i className="fa fa-times"></i>
  </div>
}

const footerRow = () => {
  <div className="sort-row footer-row">
    <span> Sort by a new metric </span>
  </div>
}

export class SortMenu extends React.Component {
  render () {
    let selectedMetrics = this.props.metrics.filter( m => m.selected )
    let availMetrics = this.props.metrics.filter( m => !m.selected )

    let headerRow = selectedMetrics.length > 0 ?
      <sortRow actionText="Sort by"
               chosenMetric={selectedMetrics[0].metric}
               availMetrics={availMetrics} /> :
      null
    let middleRows = selectedMetrics.slice(1).map( m => {
      <sortRow actionText="then by"
               chosenMetric={m.metric}
               availMetrics={availMetrics} /> 
    })
    let footerRow = availMetrics.length > 0 ? <footerRow /> : null

    return (
      <div className="sort-menu">
        {headerRow}
        {middleRows}
        {footerRow}
      </div>
    )
  }
}