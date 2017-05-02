/* eslint no-underscore-dangle: ["error", { "allow": ["__init__", "__widget__"] }] */

Dashing.widgets.TimetablesBySchool = function (dashboard) {
  const self = this;
  self.__init__ = Dashing.utils.widgetInit(dashboard, 'timetables-by-school');
  self.row = 2;
  self.col = 2;
  self.scope = {};
  self.getWidget = function () {
    return this.__widget__;
  };
  self.getData = function () {};
  self.interval = 1000;
};
