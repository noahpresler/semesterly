import React from 'react';

const Textbook = ({tb}) => {
    const exists = (x) => x && x.length > 0 && x != "Cannot be found";

    let image = null;
    if (exists(tb.image_url)) {
        image = <img src={tb.image_url} />;
    } else {
        const empty_image_uri = "/static/img/emptystates/single_textbook.png"; 
        image = <img src={empty_image_uri} style={{opacity: 0.5}}/>;
    }

    const linked = (children) => (
        <a href={tb.detail_url} target="_blank">
            {children}
        </a>
    );

    const textbook = (
        <div className="textbook">
            <div className="tb-image-wrapper">
                {image}
            </div>
            <div className="required">Required</div>
            <h4>
                {exists(tb.title) ? tb.title : "Textbook ISBN: " + tb.isbn}
            </h4>
            { exists(tb.detail_url) && 
                <div className="amazon-buy">
                    <i className="fa fa-amazon" aria-hidden="true"></i>
                    Buy or Rent
                </div>
            }
        </div>
    );

    return (
        <div className="textbook-ctn">
            {exists(tb.detail_url) ? linked(textbook): textbook}
        </div>
    );
}

export default Textbook;
