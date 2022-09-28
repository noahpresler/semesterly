import React from "react";

type AvgCourseRatingProps = {
  avgRating: number;
};

const AvgCourseRating = ({ avgRating }: AvgCourseRatingProps) => (
  <div className="sb-rating">
    <h3>Average Course Rating</h3>
    <div className="sub-rating-wrapper">
      <div className="star-ratings-sprite">
        <span style={{ width: `${(100 * avgRating) / 5}%` }} className="rating" />
      </div>
    </div>
  </div>
);

export default AvgCourseRating;
