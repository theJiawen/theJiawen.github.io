class Publisher {
  constructor() {
    // { key: [callbacks] }
    this.subscribersMap = {};
  }
  addSub(key, subscriber) {
    if (!this.subscribersMap[key]) {
      this.subscribersMap[key] = [];
    }
    this.subscribersMap[key].push(subscriber);
  }
  notify(key) {
    if (!this.subscribersMap[key]) return;
    this.subscribersMap[key].forEach(sub => {
      sub.update();
    });
  }
}
Publisher.target = null; // static

class Subscriber {
  constructor(exp, vm, fn) {
    this.exp = exp;
    this.vm = vm;
    this.fn = fn;

    Publisher.target = this;
    let expArr = exp.trim().split(".");
    let value = vm;
    for (let e of expArr) {
      value = value[e];
    }
    Publisher.target = null;
  }

  update() {
    this.fn();
  }
}
