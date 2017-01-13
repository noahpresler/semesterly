import React from 'react';

const Textbook = ({tb}) => {
    const exists = (subject) => subject && subject.length > 0 && subject != "Cannot be found";

    const title = exists(tb.title) ? tb.title : tb.isbn;

    let image = null;
    if (exists(tb.image_url)) {
        image = <img src={tb.image_url} />;
    } else {
        image = <img src="/static/img/emptystates/single_textbook.png" style={{opacity: 0.5}}/>;
    }

    return (
        <a href={tb.detail_url} target="_blank" className="textbook-ctn">
            <div className="textbook">
                {image}
                <div className="required">Required</div>
                <h4>{title}</h4>
                {exists(tb.detail_url) && 
                    <div className="amazon-buy"><i className="fa fa-amazon" aria-hidden="true"></i> Buy or Rent</div>
                }
            </div>
        </a>
    );
}

export default Textbook;