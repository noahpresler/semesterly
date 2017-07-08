import React from 'react';
import * as SemesterlyPropTypes from '../constants/semesterlyPropTypes';

const Textbook = ({ tb }) => {
  const exists = x => x && x.length > 0 && x !== 'Cannot be found';

  let image = null;
  if (exists(tb.image_url)) {
    image = <img alt="textbook" src={tb.image_url} />;
  } else {
    const emptyImageUri = '/static/img/emptystates/single_textbook.png';
    image = <img alt="" src={emptyImageUri} style={{ opacity: 0.5 }} />;
  }

  const linked = children => (
    <a href={tb.detail_url} target="_blank" rel="noopener noreferrer">
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
        {exists(tb.title) ? tb.title : `Textbook ISBN: ${tb.isbn}`}
      </h4>
      { exists(tb.detail_url) &&
        <div className="amazon-buy">
          <i className="fa fa-amazon" aria-hidden="true" />
                Buy or Rent
            </div>
            }
    </div>
    );

  return (
    <div className="textbook-ctn">
      {exists(tb.detail_url) ? linked(textbook) : textbook}
    </div>
  );
};

Textbook.propTypes = {
  tb: SemesterlyPropTypes.textbook.isRequired,
};

export default Textbook;
