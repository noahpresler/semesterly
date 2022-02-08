import semester from "../state/slices/semesterSlice";

describe("Semester reducer", () => {
  it("updates semester correctly", () => {
    const before = { current: 0, all: [] };
    const after = { current: 1, all: [] };
    const action = { type: "global/updateSemester", payload: 1 };
    expect(semester(before, action)).toEqual(after);
  });
});
