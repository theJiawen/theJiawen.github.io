class TemplateCompliler {
  compile(vm) {
    this.vm = vm;
    let fragment = document.createDocumentFragment();
    let child;
    while ((child = vm.$el.firstChild)) {
      fragment.appendChild(child);
    }

    this.replace(fragment);
    vm.$el.appendChild(fragment);
  }

  /**
   *  递归替换整个DOM，逐个处理所有 Node。
   *  如果 Node 的类型为——
   * 1. 字符节点，则直接找到 {{ }} 匹配的字符串，将其中的表达式替换成对应data中对应的值。
   * 2. 元素节点，则主要处理其属性，比如 "v-bind" 和 "v-model" 等， 将属性值修改为 data中对应的值。
   *
   * @param {*} fragment
   * @memberof TemplateCompliler
   */
  replace(fragment) {
    Array.from(fragment.childNodes).forEach(node => {
      let reg = /\{\{(.*)\}\}/g;
      if (node.nodeType == Node.TEXT_NODE && reg.test(node.textContent)) {
        let exp = RegExp.$1;
        this.replaceTextNode(exp, node);
      } else if (node.nodeType == Node.ELEMENT_NODE) {
        this.replaceElementNode(node);
      }

      // 递归编译
      if (node.childNodes && node.childNodes.length) {
        this.replace(node);
      }
    });
  }

  replaceTextNode(exp, node) {
    let vm = this.vm;
    let reg = /\{\{(.*)\}\}/g;
    let value = vm._getValueByExpressionString(exp);
    let originTextContent = node.textContent; // backup it.
    node.textContent = node.textContent.replace(reg, value);

    // subscribe the data change.
    new Subscriber(exp, vm, () => {
      let value = vm._getValueByExpressionString(exp);
      node.textContent = originTextContent.replace(reg, value);
    });
  }

  replaceElementNode(node) {
    Array.from(node.attributes).forEach(attr => {
      let attrName = attr.name;
      let exp = attr.value;

      // directives
      if (attrName.startsWith("v-bind:") || attrName.startsWith(":")) {
        this.replaceDirectiveVBind(exp, node, attrName);
      } else if (attrName.startsWith("v-model")) {
        this.replaceDirectiveVModel(exp, node);
      } else if (attrName.startsWith("@") || attrName.startsWith("v-on:")) {
        this.replaceDirectiveVOn(exp, node, attrName);
      }
    });
  }

  replaceDirectiveVBind(exp, node, attrName) {
    let vm = this.vm;
    let attrValue = vm._getValueByExpressionString(exp);
    let directiveName = attrName.split(":")[1];

    node.setAttribute(directiveName, attrValue);
    node.removeAttribute(attrName);

    // subscribe the data changes.
    new Subscriber(exp, vm, () => {
      attrValue = vm._getValueByExpressionString(exp);
      node.setAttribute(directiveName, attrValue);
    });
  }

  replaceDirectiveVModel(exp, node) {
    let vm = this.vm;
    let value = vm._getValueByExpressionString(exp);
    node.value = value;

    // subscribe the data changes.
    new Subscriber(exp, vm, () => {
      let value = vm._getValueByExpressionString(exp);
      node.value = value;
    });

    // listen the view changes.
    node.addEventListener("input", e => {
      let newVal = e.target.value;
      vm._setValueByExpressionString(exp, newVal);
    });
  }

  // @click="whatever"
  replaceDirectiveVOn(methodName, node, attrName) {
    let vm = this.vm;
    let eventName = attrName.split("@")[1];
    node.addEventListener(eventName, vm.methods[methodName]);
  }
}
