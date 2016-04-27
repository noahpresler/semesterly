import React from 'react';

const TimetableLoader = ({ loading }) => {
		if (loading) {
			return	<div className="la-ball-clip-rotate-multiple">
		    			<div></div>
		    			<div></div>
					</div>
		}
		else {
			return null;
		}
	
}
console.log("lmaoswag", TimetableLoader);
export default TimetableLoader;
