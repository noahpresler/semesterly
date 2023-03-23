import { getFirstTTStartHour } from "../state";
import { getSectionTypeToSections } from "../state/slices/entitiesSlice";

describe("course selectors", () => {
  describe("section type to sections selector", () => {
    it("returns correct mapping", () => {
      const xOne = { section_type: "x", meeting_section: "A" };
      const xTwo = { section_type: "x", meeting_section: "B" };
      const yOne = { section_type: "y", meeting_section: "C" };

      const state = { sections: [xOne, xTwo, yOne] };
      expect(getSectionTypeToSections(state)).toEqual({
        x: [xOne, xTwo],
        y: [yOne],
      });
    });
  });
});

describe("timetable selectors", () => {
  const timetable = {
    name: "tt_name",
    has_conflict: false,
    show_weekend: true,
    slots: [
      {
        course: {
          id: "C1",
          name: "course",
        },
        section: {
          id: "S1",
          code: "SSS",
          name: "section",
        },
        offerings: [
          {
            id: "O1",
            thing: "thing",
            time_end: "18:30",
          },
        ],
      },
    ],
  };

  describe("getMinTTStartHour", () => {
    it("returns 24 for empty timetable", () => {
      expect(getFirstTTStartHour({ courses: [], slots: [] })).toEqual(17);
    });
    it("returns correct start hour", () => {
      expect(getFirstTTStartHour(timetable)).toEqual(18);
    });
  });
});
