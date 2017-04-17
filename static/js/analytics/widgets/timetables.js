/* global Dashing */

Dashing.widgets.Timetables = function(dashboard) {
    var self = this;
    self.__init__ = Dashing.utils.widgetInit(dashboard, 'timetables');
    self.row = 1;
    self.col = 1;
    self.color = 'orange';
    self.scope = {};
    self.getWidget = function () {
        return this.__widget__;
    };
    self.getData = function () {};
    self.interval = 1000;
};
