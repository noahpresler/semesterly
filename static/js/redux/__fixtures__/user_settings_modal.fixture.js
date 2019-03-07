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

/* eslint-disable no-useless-escape */

export const unfilledFixture = {
  isVisible: true,
  acceptTOS: () => null,
  userInfo: {
    data: {
      GoogleLoggedIn: false,
      FacebookSignedUp: true,
      timeAcceptedTos: null,
      major: null,
      GoogleSignedUp: false,
      social_offerings: null,
      class_year: null,
      social_all: null,
      isLoggedIn: true,
      social_courses: true,
      img_url: 'https://scontent.xx.fbcdn.net/v/t1.0-1/p50x50/18193968_10208799143997309_4182518417368859549_n.jpg?oh=1e9b37d0a11caa04dc04fd43272fe377&oe=59D65C0A',
    },
    overrideHide: false,
    overrideShow: false,
    isVisible: false,
    saving: false,
    isFetching: false,
  },
};

export const filledFixture = {
  isVisible: true,
  acceptTOS: () => null,
  userInfo: {
    data: {
      GoogleLoggedIn: false,
      FacebookSignedUp: true,
      timeAcceptedTos: true,
      major: 'Computer Science',
      GoogleSignedUp: false,
      social_offerings: true,
      class_year: 2017,
      social_all: true,
      isLoggedIn: true,
      social_courses: true,
      img_url: 'https://scontent.xx.fbcdn.net/v/t1.0-1/p50x50/18193968_10208799143997309_4182518417368859549_n.jpg?oh=1e9b37d0a11caa04dc04fd43272fe377&oe=59D65C0A',
    },
    overrideHide: false,
    overrideShow: false,
    isVisible: false,
    saving: false,
    isFetching: false,
  },
};

export const googleFixture = {
  userInfo: {
    data: {
      GoogleLoggedIn: true,
      timeAcceptedTos: null,
      major: '',
      emails_enabled: true,
      GoogleSignedUp: true,
      school: 'jhu',
      fbook_uid: '',
      timetables: [],
      FacebookSignedUp: false,
      social_offerings: null,
      class_year: null,
      social_all: null,
      userFirstName: 'Noah',
      integrations: [],
      isLoggedIn: true,
      userLastName: 'Presler',
      LoginHash: 'xqr',
      social_courses: null,
      LoginToken: '1dNLQR:u86_GQEBDJZKh3Bi2qWmPRSlWg4',
      img_url: 'https://lh5.googleusercontent.com/-jT-TI0NDQHQ/AAAAAAAAAAI/AAAAAAAAQQ8/BM79nJFKph8/photo.jpg?sz=50',
    },
    overrideHide: false,
    overrideShow: false,
    isVisible: true,
    saving: false,
    isFetching: false,
  },
};
