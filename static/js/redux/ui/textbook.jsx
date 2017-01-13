import React from 'react';

const Textbook = ({tb}) => {
    const title = !tb.title || tb.title.length === 0 || tb.title === "Cannot be found" ? tb.isbn : tb.title;

    let image = null;
    if (!tb.image.url || tb.image_url.length) {
        image = <img src={tb.image_url} />;
    } else {
        image = <img src="/static/img/emptystates/single_textbook.png" opacity={0.5} />;
    }

    return (
    <a href={tb.detail_url} target="_blank" className="textbook-ctn">
        <div className="textbook">
            {image}
            <div className="required">Required</div>
            <h4>{title}</h4>
            <div className="amazon-buy"><i className="fa fa-amazon" aria-hidden="true"></i> Buy or Rent</div>
        </div>
    </a>
    );
}

export default Textbook;

// {tb.detail_url.length > 0 ?
//                 <div className="amazon-buy"><i className="fa fa-amazon" aria-hidden="true"></i> Buy or Rent</div>
//                 : <div></div>
//             }