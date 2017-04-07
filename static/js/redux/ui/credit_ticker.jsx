import React from "react";

class CreditTicker extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            actualCredits: parseFloat(this.props.numCredits),
            displayedCredits: parseFloat(this.props.numCredits)
        };
        this.incCredits = this.incCredits.bind(this);
        this.decCredits = this.decCredits.bind(this);
        this.interval = 0;
    }

    componentWillReceiveProps(nextProps) {
        this.setState({actualCredits: parseFloat(nextProps.numCredits)});
        if (parseFloat(nextProps.numCredits.toFixed(2)) > parseFloat(this.state.displayedCredits.toFixed(2))) {
            this.interval = setInterval(this.incCredits, 8);
        }
        else if (parseFloat(nextProps.numCredits.toFixed(2)) < parseFloat(this.state.displayedCredits.toFixed(2))) {
            this.interval = setInterval(this.decCredits, 8);
        }
    }

    incCredits() {
        if (parseFloat(this.state.actualCredits.toFixed(2)) <= parseFloat(this.state.displayedCredits.toFixed(2))) {
            return clearInterval(this.interval)
        }
        this.setState({displayedCredits: this.state.displayedCredits + .05});
    }

    decCredits() {
        if (parseFloat(this.state.displayedCredits.toFixed(2)) <= parseFloat(this.state.actualCredits.toFixed(2))) {
            return clearInterval(this.interval)
        }
        this.setState({displayedCredits: this.state.displayedCredits - .05});
    }

    render() {
        return (
            <div id="sb-credits" className="col-1-3">
                <h3>{Math.abs(this.state.displayedCredits).toFixed(2)}</h3>
                <h4>credits</h4>
            </div>
        );
    }
}

export default CreditTicker;
