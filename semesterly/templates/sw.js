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

"use strict";

console.log("Started", self);
self.addEventListener("install", function (event) {
  self.skipWaiting();
  console.log("Installed", event);
});
self.addEventListener("activate", function (event) {
  console.log("Activated", event);
});
self.addEventListener("message", function (event) {
  console.log("SW Received Message: " + event.data);
  event.ports[0].postMessage("SW Says 'Hello back!'");
});
self.addEventListener("push", function (event) {
  var notif = event.data.json();
  var title = notif.data.title;
  var body = notif.data.message;
  var icon = "static/img/logo2.0-310x310.png";
  var tag = "simple-push-demo-notification-tag";

  event.waitUntil(
    self.registration.showNotification(title, {
      body: body,
      icon: icon,
      tag: tag,
    })
  );
});
self.addEventListener("notificationclick", function (event) {
  console.log("On notification click: ", event.notification.tag);
  event.notification.close();
  event.waitUntil(
    clients
      .matchAll({
        type: "window",
      })
      .then(function (clientList) {
        for (var i = 0; i < clientList.length; i++) {
          var client = clientList[i];
          if (client.url == "/" && "focus" in client) return client.focus();
        }
        if (clients.openWindow) {
          return clients.openWindow("https://semester.ly");
        }
      })
  );
});
