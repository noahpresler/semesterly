import React from 'react';

const Bubble = ({index, active, setActive}) => 
	   <li onClick={() => setActive(index)}
         className={ active ? "sem-page active" : "sem-page"}>
      	{index + 1}
     </li>;

export class Pagination extends React.Component{
  constructor(props) {
    super(props);
    this.state = {num_bubbles: this.getNumBubbles()};
    this.prev = this.prev.bind(this);
    this.next = this.next.bind(this);
  }
  getNumBubbles() {
    let bubbles = $(window).width() > 700 ? 9 : 4;
    return bubbles;
  }
  prev() {
    if (this.props.active > 0) {
      this.props.setActive(this.props.active - 1);
    }
  }
  next() {
    if (this.props.active + 1 < this.props.count) {
      this.props.setActive(this.props.active + 1);
    }
  }

  render() {
    let options = [], count = this.props.count, current = this.props.active;

    if (count <= 1) { return null; } // don't display if there aren't enough schedules
    let first = current - (current % this.state.num_bubbles); // round down to nearest multiple of this.props.numBubbles
    let limit = Math.min(first + this.state.num_bubbles, count);
    for (let i = first; i < limit; i++) {
      options.push(
      	 <Bubble key={i} index={i} 
	 	       active={this.props.active == i} setActive={this.props.setActive} />
       );
    }
 
    return (
      <div className="sem-pagination">
        <div className="sem-pagination-nav" onClick={this.prev}>
          <i className="fa fa-angle-left sem-pagination-prev sem-pagination-icon" />
        </div>
        <ol className="sem-pages">
          {options}
        </ol>
        <div className="sem-pagination-nav" onClick={this.next}>
          <i className="fa fa-angle-right sem-pagination-next sem-pagination-icon" />
        </div>
      </div>
    );
  }

  componentDidMount() {
    $(window).resize(() => 
      this.setState({num_bubbles: this.getNumBubbles()})
    );
  }
}
