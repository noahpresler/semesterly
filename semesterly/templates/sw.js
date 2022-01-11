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

console.log("Started", self);
self.addEventListener("install", (event) => {
  self.skipWaiting();
  console.log("Installed", event);
});
self.addEventListener("activate", (event) => {
  console.log("Activated", event);
});
self.addEventListener("message", (event) => {
  console.log(`SW Received Message: ${event.data}`);
  event.ports[0].postMessage("SW Says 'Hello back!'");
});
self.addEventListener("push", (event) => {
  const notif = event.data.json();
  const title = notif.data.title;
  const body = notif.data.message;
  const icon = "static/img/logo2.0-310x310.png";
  const tag = "simple-push-demo-notification-tag";

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon,
      tag,
    })
  );
});
self.addEventListener("notificationclick", (event) => {
  console.log("On notification click: ", event.notification.tag);
  event.notification.close();
  event.waitUntil(
    // Not sure why this is undefined, ignore for now
    // eslint-disable-next-line no-undef
    clients
      .matchAll({
        type: "window",
      })
      .then((clientList) => {
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i];
          if (client.url == "/" && "focus" in client) return client.focus();
        }
        // eslint-disable-next-line no-undef
        if (clients.openWindow) {
          // eslint-disable-next-line no-undef
          return clients.openWindow("https://semester.ly");
        }
      })
  );
});
