---
title: 代理模式- JavaScript 设计模式(二)
date: 2018-10-25 16:36:06
updated: 2018-10-26 18:25:06
tags: [JavaScript设计模式, 读书笔记]
abstract: 本文通过多个例子介绍代理模式。代理模式有多种，我们主要介绍在 JavaScript 中常用的两种，虚拟代理和缓存代理。
categories: 
- [JavaScript 设计模式]
---

# 前言

本文通过多个例子介绍代理模式。代理模式有多种，我们主要介绍在 JavaScript 中常用的两种，虚拟代理和缓存代理。

# 虚拟代理

下文分别介绍通过虚拟代理实现以下两个例子：

1. 图片预加载
2. 合并高频 HTTP 请求。

## 图片预加载

在 Web 开发中，图片预加载是一种常用的技术，如果直接给某个`<img>`标签标签节点设置`src`属性，由于图片过大或者网络不佳，图片的位置往往会显示一段时间的空白。常见的做法是用一张 loading 图片占位，然后用异步的方式加载图片，等图片加载好了再把它填充到`<img>`节点里，这种场景就很适合用代理模式（虚拟代理），但我们还是先使用常规逻辑来书写这个代码，再使用代理模式重构。

我们想要实现这样一个效果:

```js
let imgElement = document.getElementsById("preloadImage");
let myImage = new MyImage(imgElement);
// setSrc之后，在给定 url 返回之前，会加载一个 loading 的占位图。
myImage.setSrc(`http://www.laijiawen.com/avatar/skateboard.jpg`);
```

调用`setSrc`的时候，会去请求给定 url 当中的图片，在请求到达之前，有一个 loading 的效果图片作为占位。

### 常规逻辑

上面的代码关键在于对 `MyImage`类的实现。在调用`setSrc`的时候，创建一个`Image`对象，用它来做真正的请求。而作为参数的`<img>`元素，则直接加载 loading 的 gif 图，当假的 `Image` 对象触发 `onload` 回调之后，再将真正的 `src` 赋值给 `<img>`.

```js
class MyImage {
  static LOADING_GIF_URL = `https://media.giphy.com/media/3oEjI6SIIHBdRxXI40/giphy.gif`;

  constructor(imgElement) {
    this.imgElement = imgElement;
  }

  setSrc(srcUrl) {
    let image = new Image();
    image.onload = () => {
      this.imgElement.src = srcUrl;
    };

    this.imgElement.src = MyImage.LOADING_GIF_URL;
    image.src = srcUrl;
  }
}
```

这个类是可以正常工作的。可以点进这个 [Codepen](https://codepen.io/caren11/pen/PyXqMM?editors=1010) 去看看，这个 codepen 同时加载了六张 4k 大图，应该能看到 loading 的效果，如果你的网速太快，没看到 loading，在 network 那里将网速调低一点再刷新一下。

虽然它可以工作，但这个类违反了**单一职责原则**。

> 单一职责原则指的就是一个类（通常也包括对象和函数）而言，应该仅有一个引起它变化的原因。如果一个对象承担了多项职责，就意味着这个对象变的巨大。面向对象设计鼓励将行为分布到细粒度的对象之中，如果一个对象承担的职责过多，等于把这些职责耦合在了一起，这种耦合会导致脆弱和低内聚的设计。当变化发生时，设计可能会遭到意外的破坏。

就上面这个类而言，它就承担了两个职责，包括给`img`节点设置`src`，以及预加载图片。我们在处理其中一个职责时，有可能因为其强耦合性影响另外一个职责的实现。

另外，在面向对象的程序设计中，大多数情况下，若违反其他任何原则，同时将违反[开放-封闭原则](http://imweb.io/topic/5616652d5d6f37745e8f496f)。如果我们只是从网络上获取一些体积很小的图片，或者五年后的网速快到根本不需要预加载，我们可能希望把预加载图片的这段代码从 `MyImage` 对象中删除。这时候就不得不改动 `MyImage` 类了。

实际上，我们需要的只是给`img`节点设置`src`，预加载图片只是一个锦上添花的功能。如果能把这个操作放在另一个对象里，自然是一个非常好的方法。

### 使用代理模式实现

我们要的效果是，让`MyImage`对象单纯地直接设置对应的`<img>`元素的`src`属性，而预加载 loading 图的职责则分给一个`ProxyImage`去做，这个`ProxyImage`就是我们的中介者。

#### 具体实现

`MyImage`类这次很简单，直接设置`src`：

```js
class MyImage {
  constructor(imgElement) {
    this.imgElement = imgElement;
  }
  setSrc(srcUrl) {
    this.imgElement.src = srcUrl;
  }
}
```

b. 预加载的功能在`ProxyImage`中实现:

```js
class ProxyImage {
  constructor(myImage) {
    this.realImage = myImage;
  }
  setSrc(srcUrl) {
    let fakeImage = new Image();
    fakeImage.onload = () => {
      this.realImage.setSrc(srcUrl);
    };

    fakeImage.src = srcUrl;
    this.realImage.setSrc(ProxyImage.LOADING_GIF_URL);
  }
}

// static 的属性，我发现 chrome 还没支持 static ，故还是使用旧语法。
ProxyImage.LOADING_GIF_URL = `https://media.giphy.com/media/3oEjI6SIIHBdRxXI40/giphy.gif`;
```

OK, 现在我们通过`ProxyImage`间接地访问 `MyImage`，`ProxyImage`控制了客户对`MyImage`的访问，并且在此过程中加入一些额外的操作（此例的额外操作是在图片请求完成前为真正的图片添加一个 loading 图）:

```js
let imgElement = document.getElementById("myImage");
let myImage = new MyImage(imgElement);
let proxyImage = new ProxyImage(myImage);
proxyImage.setSrc("http://whatever.com");
```

#### 完整代码

[Codepen](https://codepen.io/caren11/pen/bmOyRO?editors=1010)
代码的入口函数是`main()`，其为 DOM 中的五个图片加载了 5 张 4k 大图。

## 合并高频 HTTP 请求

假设我们有这样一个需求, 页面上有多个文件，都可以勾选，勾选之后立即触发上传。当我们选中 3 个 checkbox 的时候，依次往服务器发送了 3 次上传文件的请求。假设我单身二十年手速惊人，一次点了十几个文件，可以想象，这种频繁的网络请求将会给服务器带来很大的压力。解决方案是，我们可以通过一个代理函数 proxyUploadFile 来收集一段时间内的请求，然后一次性发给服务器。比如等待两秒后，再将需要同步的文件一次性发给服务器。如果不是对实时性要求非常高的系统，2 秒的延迟不会带来太大的副作用，却能大大减轻服务器的压力。

```js
const uploadFile = id => {
  console.log(`Begin to upload file, the id is: ${id}`);
};

const proxyUploadFile = (function() {
  let timer,
    cache = [], // 保存一定时间内需要上传的文件id
    timeout = 2000;

  return function(id) {
    cache.push(id);

    if (timer) {
      // 保证不会覆盖已经启动的定时器。
      return;
    }

    timer = setTimeout(() => {
      uploadFile(cache.join(",")); // 2s后发送需要上传的文件集合。
      cache = [];
      clearTimeout(timer);
      timer = null;
    }, timeout);
  };
})();

function main() {
  let checkboxs = document.getElementsByTagName("input");
  for (let i = 0; i < checkboxs.length; i++) {
    checkboxs[i].onclick = function() {
      if (this.checked) {
        proxyUploadFile(this.id);
      }
    };
  }
}

main();
```

该例子较为简单，不赘述，读者可以去这个 [Codepen](https://codepen.io/caren11/pen/EdGqKr?editors=1111) 玩一玩。

# 缓存代理

缓存代理可以为一些开销大的运算结果提供暂时的存储，在下次运算时，如果传递进来的参数跟之前的一致，则可以直接返回前面存储的计算结果。

本节通过一个计算乘积的例子介绍缓存代理。

## 常规思路的实现

先实现一个计算乘积的函数：

```js
const mult = function() {
  let product = 1;
  for (let i = 0; i < arguments.length; i++) {
    product *= arguments[i];
  }
  return product;
};
```

接着我们要想办法缓存结果，很自然的想到了可以通过闭包：

```js
const cachedMult = (function() {
  let cache = [];
  return function() {
    // 比如参数是 20 20，我们以 "20,20" 的形式作为 cache 的 key，
    // 此处不考虑参数的值相同而顺序不同的情况。
    let args = [].join.call(arguments, ",");
    if (cache[args]) {
      return cache[args];
    }
    cache[args] = mult.apply(this, [].slice.call(arguments));
    return cache[args];
  };
})();
```

调用的时候

```js
cachedMult(20, 20, 20); // 8000
```

## 使用代理的实现

Hold on hold on.

仔细观察一下常规思路的实现。你会发现实际上常规思路的实现就是所谓的缓存代理！我们将 `cachedMult` 这个函数的名字修改成 `proxyMult`，是不是一切都很熟悉？我们调用`proxyMult`，这个函数缓存了计算结果，实际调用的函数是`mult`。
Yep, 它就是我们熟悉的代理模式。所以缓存代理，**在 Javascript 中实际上就是用闭包做缓存。**

一般套路是这样的:

```js
const proxyWhatever = (function(){
  let cache = []
  return function(){
    ..
  }
})
```

用一个立即执行函数返回一个函数，由于这个函数引用了其作用域以外的`cache`数组，它成了一个闭包。

# 总结

代理模式包括许多小分类，我们在本文中介绍了 JavaScript 中最常用的虚拟代理和缓存代理。虽然代理模式非常有用，但我们在编写业务代码的时候，往往不需要去预先猜测是否需要使用代理模式。当真正发现不方便直接访问某个对象的时候，再编写代理也不迟。
