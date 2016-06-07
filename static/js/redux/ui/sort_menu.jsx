import React from 'react'

// tip: metrics are friends, conflicts, days off, time on/off campus, rating
const SortRow = (props) => (
  <div className="sort-row metric-row">
    <div className="sort-text">
      <span style={{ float: 'right' }}> {props.actionText} </span>
    </div>
    <div className="sort-order-dropdown">
      <select name="order"
              className="form-control select select-primary select-block"
              value={props.chosenMetric.order}
              onChange={(e) => props.toggleMetricOrder(props.chosenMetric.metric)}> 
        <option value="most">most</option>
        <option value="least">least</option>
      </select>
    </div>
    <div className="sort-metric-dropdown">
      <select name="metric" 
              className="form-control select select-primary select-block"
              value={props.chosenMetric.metric}
              onChange={(e) => props.changeMetric(e.target.value, props.chosenMetric.metric)}>
        <option value={props.chosenMetric.metric} >{props.chosenMetric.metric}</option>
        {props.availMetrics.slice(1).map( (m, i) => (
          <option value={m.metric} key={i}>{m.metric}</option>
        ))}
      </select>
    </div>
    <div className="sort-close"
         onClick={() => props.removeMetric(props.chosenMetric.metric)}>
      <i className="fa fa-times"></i>
    </div>
  </div>
)

const FooterRow = ({ addNextMetric }) => (
  <div className="sort-row footer-row"
        onClick={addNextMetric} >
    <span style={{ margin: 'auto' }}> Sort by a new metric </span>
  </div>
)

export class SortMenu extends React.Component {
  render() {
    let { metrics } = this.props;
    let selectedMetrics = metrics.filter( m => m.selected )
    let availMetrics = metrics.filter( m => !m.selected )
    let headerRow = selectedMetrics.length > 0 ?
      <SortRow {...this.props}
               actionText="Sort by"
               chosenMetric={selectedMetrics[0]}
               availMetrics={availMetrics} 
               /> 
      : null
    let middleRows = selectedMetrics.slice(1).map( (m, i) => (
      <SortRow {...this.props}
               actionText="then by"
               chosenMetric={m}
               availMetrics={availMetrics} 
               key={i}
               /> 
    ))
    let footer = availMetrics.length > 0 ? 
      <FooterRow addNextMetric={() => this.props.addMetric(availMetrics[0].metric)} /> 
      : null

    return (
      <div className="sort-menu">
        {headerRow}
        {middleRows}
        {footer}
      </div>
    )
  }
}