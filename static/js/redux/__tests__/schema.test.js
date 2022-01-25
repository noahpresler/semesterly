import { normalize } from "normalizr";
import { getDenormCourseById } from "../state/entities_reducer";
import * as schemas from "../schema";

const course = {
  result: [1],
  entities: {
    courses: { 1: { id: 1, code: "C1", sections: [2] } },
    sections: { 2: { id: 2, meeting_section: "S1", offering_set: [1] } },
    offering_set: { 1: { id: 1, day: "M" } },
  },
};

describe("course schema", () => {
  const normalized = course;
  const denormalized = [
    {
      id: 1, // course
      code: "C1",
      sections: [
        {
          // sections
          id: 2,
          meeting_section: "S1",
          offering_set: [
            {
              // offerings
              id: 1,
              day: "M",
            },
          ],
        },
      ],
    },
  ];
  it("normalizes course array (e.g. search results) correctly", () => {
    const result = normalize(denormalized, [schemas.courseSchema]);
    expect(result).toEqual(normalized);
  });
  it("normalizes single course correctly", () => {
    const result = normalize(denormalized[0], schemas.courseSchema);
    expect(result).toEqual({ ...normalized, result: 1 });
  });
  it("denormalizes single course correctly", () => {
    expect(getDenormCourseById(normalized.entities, 1)).toEqual(denormalized[0]);
  });
});
