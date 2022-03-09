import React, { useState, useEffect, useRef } from "react";

// @ts-ignore
import { WaveModal } from "boron-15";
import { getNewsEndpoint } from "../../constants/endpoints";
import parse from "html-react-parser";

const NewsModal = () => {
  const modal = useRef<WaveModal>();

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [newsTitle, setNewsTitle] = useState("");
  const [newsBody, setNewsBody] = useState("");

  // Get the time that the user last viewed a news post
  const lastViewedTime = new Date(localStorage.getItem("lastViewedNewsDate"));

  useEffect(() => {
    const fetchData = async () => {
      const response = await fetch(getNewsEndpoint());
      const data = await response.json();

      // Only display modal if the news was posted after the last viewed time
      if (data.date && new Date(data.date) > lastViewedTime) {
        setIsModalVisible(true);
        // Set to current date and time
        localStorage.setItem("lastViewedNewsDate", new Date(Date.now()).toISOString());
      }

      setNewsTitle(data.title);
      setNewsBody(data.body);
    };

    fetchData();

    if (isModalVisible) {
      modal.current.show();
    }
  }, [isModalVisible]);

  const modalStyle = {
    width: "100%",
  };

  const modalHeader = (
    <div className="modal-content">
      <div className="modal-header">
        <h1>{newsTitle}</h1>
      </div>
    </div>
  );

  return (
    <WaveModal ref={modal} className="signup-modal max-modal" modalStyle={modalStyle}>
      {modalHeader}
      {parse(newsBody)}
    </WaveModal>
  );
};

export default NewsModal;
