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
import { acceptTOS } from "../../actions";
import { useAppDispatch, useAppSelector } from "../../hooks";
import { getIsUserInfoIncomplete } from "../../state";
import Modal from "./Modal";


/**
 * The terms of service modal appears after the user logs in, and forces them to agree
 * that by continuing to use Semester.ly, they agree to the terms of service.
 */
const TermsOfServiceModal = () => {
  const isVisible = useAppSelector(
    (state) =>
      state.termsOfServiceModal.isVisible &&
      !(!state.userInfo.overrideShow && getIsUserInfoIncomplete(state)) &&
      !state.userInfo.isVisible
  );
  const userInfo = useAppSelector((state) => state.userInfo.data);
  const description = useAppSelector(
    (state) => state.termsOfServiceModal.latestAgreement.description
  );
  const url = useAppSelector((state) => state.termsOfServiceModal.latestAgreement.url);
  const dispatch = useAppDispatch();

  const getBody = () => {
    const isNewUser = !userInfo.timeAcceptedTos;
    const link = (
      <a href={url} target="_blank" rel="noopener noreferrer">
        here
      </a>
    );
    if (isNewUser) {
      return (
        <h3>
          Welcome to Semester.ly! Please take a look at our Terms of Service and Privacy
          Policy before getting started:
        </h3>
      );
    } else if (description && url) {
      return (
        <h3>
          <strong>{description}</strong> - you can read our announcement about it {link}
          , and review our updated Terms of Service and Privacy Policy here:
        </h3>
      );
    } else if (url) {
      return (
        <h3>
          We have made some changes that we think you should know about - you can read
          our announcement about it {link}, and review our updated Terms of Service and
          Privacy Policy here:
        </h3>
      );
    } else if (description) {
      return (
        <h3>
          {description}. Please review our updated Terms of Service and Privacy Policy
          here:
        </h3>
      );
    } else {
      return (
        <h3>
          Our Terms of Service and Privacy Policy have been updated. Please review them
          here:
        </h3>
      );
    }
  };

  return (
    <Modal
      visible={isVisible}
      className="terms-of-service-modal max-modal"
      customStyles={{ maxWidth: "450px", height: "350px", width: "90%" }}
      showCloseButton={false}
      onClose={() => {}}
    >
      <div className="tos-modal-container">
        <h1>Terms of Service and Privacy Policy</h1>
        {getBody()}
        <div>
          <a
            href="/termsofservice"
            target="_blank"
            rel="noopener noreferrer"
            className="legal-links"
          >
            Terms of Service
            <i className="fa fa-external-link" />
          </a>
          <a
            href="/privacypolicy"
            target="_blank"
            rel="noopener noreferrer"
            className="legal-links"
          >
            Privacy Policy
            <i className="fa fa-external-link" />
          </a>
        </div>
        <button
          className="accept-tos-btn"
          onClick={() => {
            dispatch(acceptTOS());
          }}
        >
          <i className="fa fa-check" />
          <span>I accept the Terms of Service</span>
        </button>
        <p className="method-details">
          You must accept the new Terms of Service to continue using Semester.ly.
        </p>
      </div>
    </Modal>
  );
};

export default TermsOfServiceModal;
