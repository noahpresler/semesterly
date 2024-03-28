import React, { useState, useEffect } from "react";

import { getNewsEndpoint } from "../../constants/endpoints";
import { newsModalActions } from "../../state/slices/newsModalSlice";
import { useAppDispatch, useAppSelector } from "../../hooks";
import parse from "html-react-parser";
import { getIsUserInfoIncomplete } from "../../state";
import Modal from "./Modal";

/**
 * This is the modal that pops up when a new news post has been published. It displays
 * the text of the news post, which is created and edited in the Django admin panel.
 */
const NewsModal = () => {
  const dispatch = useAppDispatch();

  const { isVisible } = useAppSelector((state) => state.newsModal);
  const isSigningUp = useAppSelector(
    (state) => !state.userInfo.overrideShow && getIsUserInfoIncomplete(state)
  );
  const [newsTitle, setNewsTitle] = useState("");
  const [newsBody, setNewsBody] = useState("");

  // Get the time that the user last viewed a news post
  const lastViewedTime = new Date(localStorage.getItem("lastViewedNewsDate"));

  useEffect(() => {
    const tutorialData = JSON.parse(localStorage.getItem("tutorial"));
    const displayCriteria = tutorialData && tutorialData.modalTutShown && !isSigningUp;

    const fetchData = async () => {
      const response = await fetch(getNewsEndpoint());
      const data = await response.json();

      // Only display modal if the news was posted after the last viewed time
      if (data.date && new Date(data.date) > lastViewedTime && displayCriteria) {
        dispatch(newsModalActions.showNewsModal());
        // Set to current date and time
        localStorage.setItem("lastViewedNewsDate", new Date(Date.now()).toISOString());
      }

      setNewsTitle(data.title === "" ? "No news at the moment!" : data.title);
      setNewsBody(data.body === "" ? "Please check back again later." : data.body);
    };

    fetchData();
  }, []);

  const modalHeader = (
    <div className="modal-header">
      <h1>{newsTitle}</h1>
    </div>
  );

  const modalStyle = {
    width: "85%",
    height: "80%",
    maxWidth: "700px",
  };

  return (
    <Modal
      visible={isVisible}
      onClose={() => {
        dispatch(newsModalActions.hideNewsModal());
      }}
      animation="door"
      className="news-modal"
      customStyles={modalStyle}
    >
      {modalHeader}
      <div className="news-body">{parse(newsBody)}</div>
    </Modal>
  );
};

export default NewsModal;