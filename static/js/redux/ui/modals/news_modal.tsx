import React, { useState, useEffect, useRef } from "react";

// @ts-ignore
import { WaveModal } from "boron-15";
import { useAppDispatch, useAppSelector } from "../../hooks";

const NewsModal = () => {
  const modal = useRef<WaveModal>();

  const [isModalVisible] = useState(false);
  const [newsTitle, setNewsTitle] = useState("");
  const [newsBody, setNewsBody] = useState("");
  
  useEffect(() => {
    // TODO: check to see if there are new announcements

    // TODO: check to see if the user has already seen the news

    if (isModalVisible) {
      modal.current.show();
    }
  }, [isModalVisible]);

  const modalHeader = (
    <div className="modal-content">
      <div className="modal-header">
        <h1>News</h1>
      </div>
    </div>
  );

  return(
    <WaveModal ref={modal}>
      {modalHeader}
    </WaveModal>
  );
};

export default NewsModal;
