/*
*
*  Push Notifications codelab
*  Copyright 2015 Google Inc. All rights reserved.
*
*  Licensed under the Apache License, Version 2.0 (the "License");
*  you may not use this file except in compliance with the License.
*  You may obtain a copy of the License at
*
*      https://www.apache.org/licenses/LICENSE-2.0
*
*  Unless required by applicable law or agreed to in writing, software
*  distributed under the License is distributed on an "AS IS" BASIS,
*  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
*  See the License for the specific language governing permissions and
*  limitations under the License
*
*/

// Version 0.1

'use strict';

// TODO
console.log('Started', self);
self.addEventListener('install', function(event) {
  self.skipWaiting();
  console.log('Installed', event);
});
self.addEventListener('activate', function(event) {
  console.log('Activated', event);
});
self.addEventListener('message', function(event){
    console.log("SW Received Message: " + event.data);
    event.ports[0].postMessage("SW Says 'Hello back!'");
});
self.addEventListener('push', function(event) {
  console.log('Push message received', event);
  // TODO
  var title = 'Notification';  
  var body = 'There is newly updated content available on the site. Click to see more.';  
  var icon = 'https://raw.githubusercontent.com/deanhume/typography/gh-pages/icons/typography.png';  
  var tag = 'simple-push-demo-notification-tag';
  
  event.waitUntil(  
    self.registration.showNotification(title, {  
       body: body,  
       icon: icon,  
       tag: tag  
     })  
   );  
});
