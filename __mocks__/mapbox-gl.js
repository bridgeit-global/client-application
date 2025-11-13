const noop = () => {};

class MapMock {
  constructor() {
    this.on = noop;
    this.off = noop;
    this.once = noop;
    this.remove = noop;
    this.addControl = noop;
    this.addSource = noop;
    this.addLayer = noop;
    this.getSource = () => ({ setData: noop });
    this.loadImage = (_url, callback) => callback(null, {});
    this.addImage = noop;
    this.getCanvas = () => ({ width: 0, height: 0 });
    this.resize = noop;
    this.flyTo = noop;
    this.fitBounds = noop;
    this.getBounds = () => ({})
  }
}

class MarkerMock {
  constructor() {
    this.setLngLat = () => this;
    this.setPopup = () => this;
    this.addTo = () => this;
    this.remove = () => this;
  }
}

class PopupMock {
  constructor() {
    this.setLngLat = () => this;
    this.setHTML = () => this;
    this.addTo = () => this;
    this.remove = () => this;
  }
}

class NavigationControlMock {}

const mapboxglMock = {
  Map: MapMock,
  Marker: MarkerMock,
  Popup: PopupMock,
  NavigationControl: NavigationControlMock,
  accessToken: '',
  supported: () => true,
};

module.exports = mapboxglMock;
module.exports.default = mapboxglMock;
