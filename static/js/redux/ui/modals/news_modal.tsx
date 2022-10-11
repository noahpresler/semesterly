import React, { useState, useEffect, useRef } from "react";

// @ts-ignore
import { WaveModal } from "boron-15";
import { getNewsEndpoint } from "../../constants/endpoints";
import { newsModalActions } from "../../state/slices/newsModalSlice";
import { useAppDispatch, useAppSelector } from "../../hooks";
import parse from "html-react-parser";
import { getIsUserInfoIncomplete } from "../../state";
import Modal from "./Modal";

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
    if (!tutorialData || !tutorialData.modalTutShown || isSigningUp) {
      return;
    }

    const fetchData = async () => {
      const response = await fetch(getNewsEndpoint());
      const data = await response.json();

      // Only display modal if the news was posted after the last viewed time
      if (data.date && new Date(data.date) > lastViewedTime) {
        dispatch(newsModalActions.showNewsModal());
        // Set to current date and time
        localStorage.setItem("lastViewedNewsDate", new Date(Date.now()).toISOString());
      }

      setNewsTitle(data.title);
      setNewsBody(data.body);
    };

    fetchData();
  }, []);

  const modalHeader = (
    <div className="modal-header">
      <h1>{newsTitle}</h1>
    </div>
  );

  const modalStyle = {
    width: "100%",
  };

  return (
    <Modal
      visible={isVisible}
      onClose={() => {
        dispatch(newsModalActions.hideNewsModal());
      }}
    >
      {modalHeader}
      <div className="news-body">{parse(newsBody)}</div>
    </Modal>
  );

  // return (
  //   <WaveModal ref={modal} className="news-modal" modalStyle={modalStyle}>
  //     {modalHeader}
  //     <div className="news-body">{parse(newsBody)}</div>
  //   </WaveModal>
  // );
};

export default NewsModal;
