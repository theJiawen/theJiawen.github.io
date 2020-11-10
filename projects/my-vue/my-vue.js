class MyVue {
  constructor(options) {
    let { el, data, computed, methods } = options;
    this._options = options;
    this.$el = document.querySelector(el);

    // 数据劫持、数据代理到this.
    this.data = data.call(this);
    this.data = this.hijackObject(this.data);
    this.proxyDataToThis(); // make it possible to access this.data.name by this.name

    // 处理 computed
    this.addComputedData(computed);

    // 处理 methods
    for (let methodName in methods) {
      // 绑定作用域
      methods[methodName] = methods[methodName].bind(this);
    }
    this.methods = methods;

    // 编译模板
    new TemplateCompliler().compile(this);
  }

  // 使用 Proxy 进行数据劫持。
  // 注意，由于使用 Proxy 进行数据劫持的时候劫持的是对象，而不像 defineProperty 劫持了属性，
  // 故此处的实现与 Vue 官方的有巨大不同。
  hijackObject(object) {
    // 每个对象对应一个 publisher
    let publisher = new Publisher();

    // 只将对象进行递归劫持。
    for (let prop in object) {
      if (Object.prototype.toString.call(object[prop]) === "[object Object]") {
        object[prop] = this.hijackObject(object[prop]);
      }
    }

    let hijackedObject = new Proxy(object, {
      get(target, key, proxy) {
        // 这是最巧妙的，通过拦截get,将 subscriber 加到 publisher里面去。
        // 虽然巧妙，但非常不好阅读和理解。
        if (Publisher.target) {
          publisher.addSub(key, Publisher.target);
        }
        return Reflect.get(target, key, proxy);
      },
      set(target, key, value, proxy) {
        let isSucceed = Reflect.set(target, key, value, proxy);
        publisher.notify(key);
        return isSucceed;
      }
    });

    // 返回被劫持之后的object
    return hijackedObject;
  }

  proxyDataToThis() {
    for (let key in this.data) {
      Object.defineProperty(this, key, {
        get() {
          return this.data[key];
        },
        set(val) {
          this.data[key] = val;
        }
      });
    }
  }

  addComputedData(computed) {
    for (let key in computed) {
      if (
        Array.prototype.toString.call(computed[key]) === "[object Function]"
      ) {
        // function
        Object.defineProperty(this, key, {
          get() {
            let cachedValue = computed[key].call(this);
            return cachedValue;
          },
          set(val) {
            throw new Error("set 你个大头鬼 set computed.");
          }
        });
      } else if (
        Array.prototype.toString.call(computed[key]) === "[object Object]"
      ) {
        // object with get() & set()
        Object.defineProperty(this, key, {
          get() {
            let cachedValue = computed[key].get.call(this);
            return cachedValue;
          },
          set(val) {
            computed[key].set.call(this, val);
          }
        });
      }
    }
  }

  /**
   *
   * set data according to expression:
   *                   exp = val       ==>
   *     "bestFriend.name" = "Caren"   ==>
   *  this.bestFriend.name = "Caren"
   *
   * @param {String} exp
   * @param {*} val
   * @memberof MyVue
   */
  _setValueByExpressionString(exp, val) {
    let expArr = exp.trim().split(".");
    let data = this.data;

    for (let i = 0; i < expArr.length - 1; i++) {
      data = data[expArr[i]];
    }
    data[expArr[expArr.length - 1]] = val;
  }

  /**
   *
   *  return the value of expression.
   *  for example:
   *  "bestFriend.name" --> this.bestFriend.name
   *
   * @param {String} exp
   * @returns the value of {{exp}}
   * @memberof MyVue
   */
  _getValueByExpressionString(exp) {
    let expArr = exp.trim().split(".");
    let value = this;
    for (let e of expArr) {
      value = value[e];
    }
    return value;
  }
}
