/*
Copyright (C) 2017 Semester.ly Technologies, LLC

Semester.ly is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

Semester.ly is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.
*/

import React from 'react';
import * as SemesterlyPropTypes from '../constants/semesterlyPropTypes';

const Question = ({ q }) => {
	const exists = x => x && x.length > 0 && x !== 'Cannot be found';

	/*const linked = children => (
		<a href={tb.detail_url} target="_blank" rel="noopener noreferrer">
			{children}
		</a>
	);*/

	const question = (
		<div className="question">
			<div className="q-image-wrapper">
				{image}
			</div>
			<div className="required">Required</div>
			<h4>
				{exists(q.text) ? q.text : ` ${q.text}`}
			</h4>
			{
				{exists(q.asker) : {q.asker}}

			}
		</div>
	);

	return ();
};

Question.propTypes = {
	q: SemesterlyPropTypes.question.isRequired,
};

export default Question;