import React from 'react';
import ReactDOM from 'react-dom';
import classnames from 'classnames';

class CreditTicker extends React.Component {
	constructor(props) {
        super(props);
        this.state = { numCredits: this.props.numCredits };
        this.incCredits = this.incCredits.bind(this);
        this.decCredits = this.decCredits.bind(this);
        this.interval = 0;
    }
	componentWillReceiveProps(nextProps) {
		if (nextProps.numCredits > this.props.numCredits)
			this.interval = setInterval(this.incCredits, 8);
		else
			this.interval = setInterval(this.decCredits, 8);
    }
    incCredits() {
    	if (this.props.numCredits.toFixed(2) <= this.state.numCredits.toFixed(2))
    		return clearInterval(this.interval)
    	this.setState({ numCredits: this.state.numCredits + .05})
    }
    decCredits() {
    	if (this.props.numCredits.toFixed(2) >= this.state.numCredits.toFixed(2))
    		return clearInterval(this.interval)
    	this.setState({ numCredits: this.state.numCredits - .05})
    }
	render() {
		return (
			<div id="sb-credits" className="col-1-3">
                <h3>{Math.abs(this.state.numCredits).toFixed(2)}</h3>
                <h4>credits</h4>
            </div>
        );
	}
}

export default CreditTicker;