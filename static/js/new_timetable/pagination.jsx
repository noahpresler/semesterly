module.exports = React.createClass({
  render: function() {
    if (this.props.count <= 1) { return null; }
    var options = [];
    for (var i = 0; i < this.props.count; i++) {
      var className = this.props.current_index == i ? "active" : "";
      options.push(
        <li key={i} className={className}>
              <a onClick={this.props.setIndex(i)}>{i + 1}</a>
        </li>);
    }

    return (
      <div id="pagination-container">
        <div className="pagination pagination-minimal">
          <ul>
            <li className="previous">
              <a className="fui-arrow-left pagination-btn" 
                onClick={this.props.prev}></a>
            </li>
            {options}
            
            <li className="next pagination-btn">
              <a className="fui-arrow-right pagination-btn"
                onClick={this.props.next}></a>
            </li>

          </ul>
        </div>
      </div>
    );
  }
  

});