const noop = () => {};

class MapboxGeocoderMock {
  constructor() {
    this.on = () => this;
    this.off = () => this;
    this.addTo = () => this;
    this.setInput = () => this;
    this.query = () => this;
    this.clear = () => this;
  }
}

module.exports = MapboxGeocoderMock;
module.exports.default = MapboxGeocoderMock;
