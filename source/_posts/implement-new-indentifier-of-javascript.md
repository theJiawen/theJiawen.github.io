---
title: 如何实现 JavaScript 的 new 运算符
tags: [JavaScript, 前端]
abstract: 本文描述 JS 的 new 运算符的实现，并顺便讲解 instanceof 运算符以及 prototype。
date: 2018-11-20 11:03:38
updated: 2018-11-20 11:03:38
---

## 前言

近期在二刷高程(《JavaSript 高级程序设计》)，书中提及了`new`运算符做的事情，我联想到似乎不少面试总结文章都有提及这一问题，故深入研究了一下，在此简要记录。

## 一个例子

我先写一段代码，本文将基于这段代码进行讲解。
在这段代码中，我们先实现两个**构造函数**，分别是`Person`和`Animal`：

```js
function Person(name, age) {
  this.name = name;
  this.age = age;
}

function Animal(type, name, age) {
  this.type = type;
  this.name = name;
  this.age = age;
}

let caren = new Person("Caren", 22);
let doggy = new Animal("Dog", "doggy", 2);

console.log(caren); // { name: "Care", age: 22}
console.log(caren instanceof Person); // true

console.log(doggy); // {type: 'Dog', name: "doggy", age: 2 }
console.log(doggy instanceof Animal); // true
```

现在请读者来花一分钟思考一下 `new`运算符做了什么事情。

## new 运算符做了什么

本文不会像大多数网上的文章一样一下子就给出结论。要回答这个问题，我们得有一个思考的过程。这个过程其实很简单，只需要对比普通的执行方式以及通过`new`的执行方式的执行结果区别即可。

```js
// 普通调用方式，如果是在浏览器调用的话，会直接给`window`对象增加两个全局变量`name`以及`age`，
// 返回的`caren`是`undefined`；
let caren1 = Person("Caren", 22);
console.log(caren1); // undefined

// 而通过`new`调用，则会新建一个 Person 对象，并设置这个对象的`name`和`age`属性为对应参数，
// 返回的`caren`是这个新对象。
let caren2 = new Person("Caren", 22);
console.log(caren2); // {name: "Caren", age: 22}
```

通过对比，显然`new`做了至少以下四件事：

1. 新建了一个对象。
2. 将`new`运算符后面的构造函数的作用域指向这个新对象。(将构造函数的`this`指向新对象)
3. 执行`new`后面的构造函数。
4. 返回新对象。

其实不止，注意我们第一段代码中`instanceof`的调用，它能够判断出这个`new`出来的`caren`是`Person`的实例，实现这四步还无法做到这一点（对象的识别）。为了实现对象的识别，还需要理解`instanceof`是如何进行判断的。

### instanceof 是如何进行判断的

这个问题略为复杂，可以看看 IBM 的这篇[《JavaScript instanceof 运算符深入剖析》](https://www.ibm.com/developerworks/cn/web/1306_jiangjj_jsinstanceof/index.html)深入了解一下，在此简要总结如下：

`instanceof`通过不断“往上”地查找实例的原型(`__proto__`)，判断其是否与`instanceof`运算符右侧的构造函数的原型（`prototype`）相等。只要原型链中有一个原型对象满足条件，则返回`true`。

实现代码如下：

```js
function instance_of(L, R) {
  //L 表示左表达式，R 表示右表达式
  var O = R.prototype;
  L = L.__proto__;
  while (true) {
    if (L === null) return false;
    if (O === L) {
      // 这里重点：当 O 严格等于 L 时，返回 true
      return true;
    }

    L = L.__proto__;
  }
}
```

![emmm](https://caren-1253602298.cos.ap-guangzhou.myqcloud.com/emmm.jpg)

> “为什么你这段话每个字我都看得懂，连起来就不懂呢？”

基础不那么扎实的同学看到这里可能有点恍惚，想关掉浏览器，我们有必要先复习一下原型的知识。

### 原型简单复习

在这里我也不想直接放网上那个知名的图：

![原型链图](https://caren-1253602298.cos.ap-guangzhou.myqcloud.com/prototype-chain.jpg)

不然读者可能要打我：

> 本来很简单一个问题，你搞这么复杂干什么？拉黑了。

我就简单描述一下，要理解原型，理清楚三个东西之间的关系就好了：

1. **实例对象**。即`new`出来的对象。
2. **构造函数**。一般也称为类。即上文的`Person`和`Animal`对象。
3. **构造函数的原型**。我们创建的每个函数，都会自动生成一个`prototye`属性，这个属性是一个指针，指向一个对象。这个对象的用途是包含可以由特定类型的所有实例共享的属性和方法。

我们先不管实例对象，先看构造函数和它的原型之间的关系：

![构造函数和构造函数的原型之间的关系](https://caren-1253602298.cos.ap-guangzhou.myqcloud.com/person%26persons_prototye.jpg)

很简单，每个函数被创建之后，都会自动创建一个对应的原型对象，并且这个函数都有一个`prototype`属性，指向这个原型对象。与此同时，原型对象也有一个`constructor`指针指回构造函数。以上文的`Person`为例，创建完`Person`以后，`Person.prototye`这个对象也会被自动创建，它有一个`constructor`属性指向`Person`:

```js
Person.prototype.constructor.prototype.constructor === Person; // true
```

接着我们加入实例对象：
![](https://caren-1253602298.cos.ap-guangzhou.myqcloud.com/prototype-chain-me.jpg)

没错，实例对象`caren`会有一个`__proto__`属性指向构造函数的原型。

接下来我们再看`instanceof`的实现就很好理解了，不赘述。

```js
function instance_of(L, R) {
  //L 表示左表达式，R 表示右表达式
  var O = R.prototype; // 取 构造函数 R 的原型对象
  L = L.__proto__; // 取 L 实例对象的原型对象
  while (true) {
    if (L === null) return false;
    if (O === L) {
      // 这里重点：当 O 严格等于 L 时，返回 true
      return true;
    }
    L = L.__proto__;
  }
}

console.log(instance_of(caren, Person)); // true
```

## new 运算符的实现

我们讲了半天的 `instanceof` 其实是为了说明，为了解决对象的识别问题，我们还需要将这个新建的对象加到原型链上。故除了上文描述的四步，还需要增加一步——设置对象的原型：

1. 新建了一个对象。
2. **设置该对象的原型(`__proto__`)为构造函数的原型(`prototype`)**
3. 将`new`运算符后面的构造函数的作用域指向这个新对象。(将构造函数的`this`指向新对象)
4. 执行`new`后面的构造函数
5. 返回新对象

### 实现效果

目标是实现一个`mockNew`函数，调用效果如下：

```js
let cat = mockNew(Animal, "Dog", "doggy", 10);
let caren = mockNew(Person, "Caren", 10);
```

第一个参数是构造函数，后面为构造函数接收的参数，具体实现如下：

```js
function mockNew() {
  // 1. 新建对象
  let obj = {};
  let _constructor = [].shift.call(arguments);

  // 2. 设置对象的原型， 注意对着上文的图看。
  obj.__proto__ = _constructor.prototype;

  // 3/4. 利用 apply 调用构造函数
  _constructor.apply(obj, arguments);

  // 5. 返回这个对象
  return obj;
}
```

需要注意的一个小细节是，我们调用了 `[].shift.call(arguments)` 来获取第一个参数，即构造函数，这个调用会顺便将之移出`arguments`“数组”。因而`arguments`数组只剩下构造函数想要的参数。
如`arguments`原本是`[Animal, "Dog", "doggy", 10]`，调用完后变成`["Dog","doggy",10]`。

### 源码

[codepen](https://codepen.io/caren11/pen/yQbvGN?editors=0012)

## 总结

本文先通过一个例子的对比，说明`new`运算符背地里干了四件事情，但仅仅那四件事情无法解决对象的识别问题——即通过`instanceof`运算符获得正确结果。为了解决这一问题，我们需要探究了`instanceof`运算符的工作原理，在这一过程中，为了更清楚地讲述，我们还复习了原型链的相关知识。最后我们得到结论并实现了`new`运算符。

希望希望对读者有所帮助，表达若有欠缺或者描述不清楚的地方欢迎指正。

欢迎评论:D
