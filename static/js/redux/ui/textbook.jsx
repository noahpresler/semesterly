import React from 'react';

const Textbook = ({tb}) => {
    return (
    <a href={tb.detail_url} target="_blank">
        <div className="textbook">
            <img src={tb.image_url} />
            <div className="required">Required</div>
            <h4>{tb.title}</h4>
            <div className="amazon-buy"><i className="fa fa-amazon" aria-hidden="true"></i> Buy or Rent</div>
        </div>
    </a>
    );
}

export default Textbook;
