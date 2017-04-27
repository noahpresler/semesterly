/* global Rickshaw, rivets */
/* eslint no-underscore-dangle: ["error", { "allow": ["__init__", "__widget__"] }] */

Dashing.widgets.CustomGraph = function (dashboard) {
  const self = this;
  self.__init__ = Dashing.utils.widgetInit(dashboard, 'custom-graph', {
    require: ['d3', 'rickshaw'],
  });
  self.row = 1;
  self.col = 2;
  self.scope = {};
  self.getWidget = function () {
    return this.__widget__;
  };
  self.getData = function () {};
  self.interval = 3000;
};

rivets.binders['dashing-graph'] = function binder(el, data) {
  if (!data) return;
  if (!window.Rickshaw) {
    $(document).on('libs/rickshaw/loaded',
                    binder.bind(this, el, data));
    return;
  }

  const container = el.parentNode;
  let graph;

  // added `|| data.whatever` for backward compatibility
  const beforeRender = this.model.beforeRender || data.beforeRender;
  const afterRender = this.model.afterRender || data.afterRender;
  const xFormat = this.model.xFormat || data.xFormat;
  const yFormat = this.model.yFormat || data.yFormat;
  const properties = this.model.properties || {};

  if (!$(container).is(':visible')) return;
  if (beforeRender) beforeRender();
  if (/rickshaw_graph/.test(container.className)) {
    graph = window[container.dataset.id];
    graph.series[0].data = data;
    graph.update();
    return;
  }
  const id = Dashing.utils.getId();
  graph = new Rickshaw.Graph({
    element: container,
    width: container.width,
    height: container.height,
    series: [{
      color: '#fff',
      data,
    }],
  });
  graph.configure(properties);
  graph.render();

  const xAxis = new Rickshaw.Graph.Axis.X({
    graph,
    tickFormat: xFormat || Rickshaw.Fixtures.Number.formatKMBT,
  });
  const yAxis = new Rickshaw.Graph.Axis.Y({
    graph,
    tickFormat: yFormat || Rickshaw.Fixtures.Number.formatKMBT,
  });
  xAxis.render();
  yAxis.render();
  if (afterRender) afterRender();
  window[id] = graph;
  container.dataset.id = id;
};
