import customEventsReducer, {
  customEventsActions,
  CustomEventsSlice,
} from "./customEventsSlice";

const initialState: CustomEventsSlice = {
  events: [],
  isModalVisible: false,
  selectedEventId: null,
};

describe("custom events slice", () => {
  it("should be invisible by default", () => {
    const state = customEventsReducer(undefined, { type: "__UNKNOWN" });
    expect(state.isModalVisible).toBe(false);
  });

  it("should be visible when show is called", () => {
    const actual = customEventsReducer(
      initialState,
      customEventsActions.showCustomEventsModal(null)
    );
    expect(actual.isModalVisible).toBe(true);
  });

  it("should be invisible when hide is called", () => {
    const hide = customEventsReducer(
      initialState,
      customEventsActions.hideCustomEventsModal()
    );
    expect(hide.isModalVisible).toBe(false);

    const show = customEventsReducer(
      hide,
      customEventsActions.showCustomEventsModal(null)
    );
    const actual = customEventsReducer(
      show,
      customEventsActions.hideCustomEventsModal()
    );
    expect(actual.isModalVisible).toBe(false);
  });

  it("should set the selected event when shown", () => {
    const actual = customEventsReducer(
      initialState,
      customEventsActions.showCustomEventsModal(1)
    );
    expect(actual.selectedEventId).toBe(1);
  });

  it("should reset the selected event when hidden", () => {
    const show = customEventsReducer(
      initialState,
      customEventsActions.showCustomEventsModal(1)
    );
    const hide = customEventsReducer(show, customEventsActions.hideCustomEventsModal());
    expect(hide.selectedEventId).toBe(null);
  });
});
