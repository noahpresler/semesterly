import React from 'react';

const TimetableLoader = ({ loading }) => {
  if (loading) {
    return (<div className="la-ball-clip-rotate-multiple">
      <div />
      <div />
    </div>);
  }

  return null;
};

TimetableLoader.propTypes = {
  loading: React.PropTypes.bool.isRequired,
};

export default TimetableLoader;
