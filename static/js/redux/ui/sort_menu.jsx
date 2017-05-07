import React from 'react';

// tip: metrics are friends, conflicts, days off, time on/off campus, rating
/* eslint-disable react/prop-types */
const SortRow = props => (
  <div className="sort-row metric-row">
    <div className="sort-text">
      <span style={{ float: 'right' }}> {props.actionText} </span>
    </div>
    <div className="sort-order-dropdown">
      <select
        name="order"
        className="form-control select select-primary select-block"
        value={props.chosenMetric.order}
        onChange={() => props.toggleMetricOrder(props.chosenMetric.metric)}
      >
        <option value="most">most</option>
        <option value="least">least</option>
      </select>
    </div>
    <div className="sort-metric-dropdown">
      <select
        name="metric"
        className="form-control select select-primary select-block"
        value={props.chosenMetric.metric}
        onChange={e => props.changeMetric(e.target.value, props.chosenMetric.metric)}
      >
        <option value={props.chosenMetric.metric}>{props.chosenMetric.metric}</option>
        {props.availMetrics.slice(1).map(m => (
          <option value={m.metric} key={m.metric}>{m.metric}</option>
                ))}
      </select>
    </div>
    <div
      className="sort-close"
      onClick={() => props.removeMetric(props.chosenMetric.metric)}
    >
      <i className="fa fa-times" />
    </div>
  </div>
);

SortRow.defaultProps = {
  actionText: React.PropTypes.string.isRequired,
  chosenMetric: React.PropTypes.shape({
    metric: React.PropTypes.string.isRequired,
    order: React.PropTypes.string.isRequired,
    selected: React.PropTypes.bool.isRequired,
  }),
  addMetric: React.PropTypes.func.isRequired,
  removeMetric: React.PropTypes.func.isRequired,
};

const FooterRow = ({ addNextMetric }) => (
  <div
    className="sort-row footer-row"
    onClick={addNextMetric}
  >
    <span style={{ margin: 'auto' }}> Sort by a new metric </span>
  </div>
);

const SortMenu = ({ metrics, addMetric, removeMetric }) => {
  const selectedMetrics = metrics.filter(m => m.selected);
  const availMetrics = metrics.filter(m => !m.selected);
  const headerRow = selectedMetrics.length > 0 ?
          (<SortRow
            addMetric={addMetric}
            removeMetric={removeMetric}
            actionText="Sort by"
            chosenMetric={selectedMetrics[0]}
            availMetrics={availMetrics}
          />)
          : null;
  const middleRows = selectedMetrics.slice(1).map(m => (
    <SortRow
      addMetric={addMetric}
      removeMetric={removeMetric}
      actionText="then by"
      chosenMetric={m}
      availMetrics={availMetrics}
      key={m}
    />
      ));
  const footer = availMetrics.length > 0 ?
    <FooterRow addNextMetric={() => addMetric(availMetrics[0].metric)} />
          : null;

  return (
    <div className="sort-menu">
      {headerRow}
      {middleRows}
      {footer}
    </div>
  );
};

export default SortMenu;
/* eslint-enable react/prop-types */
