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

import React, { useState, useEffect } from "react";
import { useAppSelector } from "../../hooks";
import { browserSupportsLocalStorage } from "../../util";
import Modal from "./Modal";

const TutorialModal = () => {
  const [tutorialPosition, setTutorialPosition] = useState(1);
  const [isVisible, setIsVisible] = useState(false);

  const signUpModalVisible = useAppSelector((state) => state.signupModal.isVisible);
  const settingModalVisible = useAppSelector((state) => state.userInfo.overrideShow);
  const courseModalVisible = useAppSelector((state) => state.courseInfo.id !== null);

  useEffect(() => {
    const tutorial = JSON.parse(localStorage.getItem("tutorial"));
    if (
      (!tutorial || !tutorial.modalTutShown) &&
      !(signUpModalVisible || courseModalVisible || settingModalVisible)
    ) {
      setIsVisible(true);
    }
  }, [signUpModalVisible, settingModalVisible, courseModalVisible]);

  const prev = () => {
    setTutorialPosition((prevPosition: number) => prevPosition - 1);
  };

  const next = () => {
    setTutorialPosition((prevPosition: number) => prevPosition + 1);
  };

  const hide = () => {
    if (browserSupportsLocalStorage()) {
      localStorage.setItem("tutorial", JSON.stringify({ modalTutShown: true }));
    }
    setIsVisible(false);
  };
  const contentStyle = {
    width: "500px",
    height: "600px",
    backgroundColor: "#FC7372",
  };

  const left =
    tutorialPosition > 1 ? (
      <i className="action fa fa-chevron-left" onClick={prev} />
    ) : null;
  let right =
    tutorialPosition < 4 ? (
      <i className="action fa fa-chevron-right" onClick={next} />
    ) : null;
  right =
    tutorialPosition === 4 ? (
      <h4 className="action" onClick={hide}>
        Done
      </h4>
    ) : (
      right
    );
  switch (tutorialPosition) {
    case 1:
      contentStyle.backgroundColor = "#FC7372";
      break;
    case 2:
      contentStyle.backgroundColor = "#35DDBA";
      break;
    case 3:
      contentStyle.backgroundColor = "#5BCBF1";
      break;
    case 4:
      contentStyle.backgroundColor = "#FED361";
      break;
    default:
      contentStyle.backgroundColor = "#FC7372";
  }

  return (
    <Modal
      visible={isVisible}
      onClose={() => {}}
      showCloseButton={false}
      className="tut-modal max-modal"
      customStyles={contentStyle}
    >
      <div className="tut-modal__wrapper">
        <div className="tut-modal__nav">
          {left}
          <p>Welcome to Semester.ly</p>
          {right}
        </div>
        <img
          className="tut-img"
          alt="Step 1!"
          src={"/static/img/tutorial/step1.png"}
          style={{
            display: tutorialPosition === 1 ? "inline" : "none",
            opacity: tutorialPosition === 1 ? "1" : "0",
          }}
          width="100%"
        />
        <img
          className="tut-img"
          alt="Step 2!"
          src={"/static/img/tutorial/step2.png"}
          style={{
            display: tutorialPosition === 2 ? "inline" : "none",
            opacity: tutorialPosition === 2 ? "1" : "0",
          }}
          width="100%"
        />
        <img
          className="tut-img"
          alt="Step 3!"
          src={"/static/img/tutorial/step3.png"}
          style={{
            display: tutorialPosition === 3 ? "inline" : "none",
            opacity: tutorialPosition === 3 ? "1" : "0",
          }}
          width="100%"
        />
        <img
          className="tut-img"
          alt="Step 4!"
          src={"/static/img/tutorial/step4.png"}
          style={{
            display: tutorialPosition === 4 ? "inline" : "none",
            opacity: tutorialPosition === 4 ? "1" : "0",
          }}
          width="100%"
        />
      </div>
    </Modal>
  );
};

export default TutorialModal;
