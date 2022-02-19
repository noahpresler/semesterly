import semester, { semesterActions } from "../state/slices/semesterSlice";

describe("Semester reducer", () => {
  it("updates semester correctly", () => {
    const before = { current: 0, all: [] };
    const after = { current: 1, all: [] };
    expect(semester(before, semesterActions.updateSemester(1))).toEqual(after);
  });
});
