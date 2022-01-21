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

import React from "react";
import "@testing-library/jest-dom/extend-expect";
import { renderWithRedux } from "../../test-utils";
import UserSettingsModal from "../../ui/modals/user_settings_modal";
import {
  unfilledFixture,
  filledFixture,
  googleFixture,
} from "../../__fixtures__/user_settings_modal.fixture";

describe("User Setting Modal Renders As Expected", () => {
  it("VISIBLE if settings unfilled", () => {
    const initialState = {
      userInfo: unfilledFixture.userInfo,
      notificationToken: {
        hasToken: false,
      },
      ui: {
        highlightNotifs: false,
      },
    };
    const { container } = renderWithRedux(<UserSettingsModal />, {
      preloadedState: initialState,
    });
    // show options to find facebook friends
    expect(container).toHaveTextContent("Would you like to find classes");
  });

  it("HIDDEN if settings filled", () => {
    const initialState = {
      userInfo: filledFixture.userInfo,
      notificationToken: {
        hasToken: false,
      },
      ui: {
        highlightNotifs: false,
      },
    };
    const { container } = renderWithRedux(<UserSettingsModal />, {
      preloadedState: initialState,
    });
    expect(container).toBeEmptyDOMElement();
  });

  it("VISIBLE if settings filled but showOverrided", () => {
    const userInfo = filledFixture.userInfo;
    userInfo.overrideShow = true;
    const initialState = {
      userInfo,
      notificationToken: {
        hasToken: false,
      },
      ui: {
        highlightNotifs: false,
      },
    };
    const { container } = renderWithRedux(<UserSettingsModal />, {
      preloadedState: initialState,
    });

    // should show save button
    expect(container).toHaveTextContent("Save");
    // should NOT show button to accept the terms and conditions
    expect(container).not.toHaveTextContent("Accept the terms and conditions");
  });

  it("VISIBLE but reduced if signing up with Google only", () => {
    const initialState = {
      userInfo: googleFixture.userInfo,
      notificationToken: {
        hasToken: false,
      },
      ui: {
        highlightNotifs: false,
      },
    };
    const { container } = renderWithRedux(<UserSettingsModal />, {
      preloadedState: initialState,
    });
    // friends questions should only show up when signed in with facebook
    expect(container).not.toHaveTextContent("Would you like to find classes");
  });
});
