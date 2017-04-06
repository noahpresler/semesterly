import React from "react";
import classnames from "classnames";

class Evaluation extends React.Component {
    render() {
        let {evalData} = this.props;
        let details = null;
        let prof = null;

        if (!this.props.mini) { // only show extra information if this eval isn't mini
            // (i.e. full evaluation, not nav item for full evaluations)
            let s = '<p>' + evalData.summary.replace(/\u00a0/g, " ").replace(/\n/g, '<br />') + '</p>'
            details = (
                <div id="details" dangerouslySetInnerHTML={{__html: s}}></div>
            );
            prof = (
                <div id="prof"><b>Professor: {evalData.professor}</b></div>
            );
        }

        // extract last name (if present)
        const shortProfName = (name) => {
            if (!name)
                return '';

            const wrapParen = (s) => ' (' + s + ')';

            const words = name.split(/\s+/).filter(n => n != "");

            if (words.length == 0) {
                return '';
            } else if (words.length >= 2) {
                return wrapParen(words[1]);
            } else {
                return wrapParen(words[0]);
            }
        };

        let year = evalData.year.indexOf(":") > -1 ?
            evalData.year.replace(":", " ") :
            evalData.year;
        return (
            <div className={classnames("eval-item", {"mini": this.props.mini, "selected": !this.props.mini})}>
                <div className="eval-wrapper">
                    <div className="year truncate">
                        <b>
                            {year}
                            {!evalData.unique_term_year &&
                            shortProfName(evalData.professor)
                            }
                        </b>
                    </div>
                    {prof}
                    <div className="rating-wrapper">
                        <div className="star-ratings-sprite eval-stars">
                            <span style={{width: 100 * evalData.score / 5 + "%"}} className="rating"></span>
                        </div>
                        <div className="numeric-rating"><b>{"(" + evalData.score + ")"}</b></div>
                    </div>
                </div>
                {details}
            </div>);
    }
}

export default Evaluation;

