---
title: chrome中<td>的 border collapse bug
date: 2018-10-22 17:53:30
tags: [Chrome, bug, CSS]
---

今天在实现一个表格布局的时候遭遇了 Chrome 的一个 bug。没错，这次不是我们的问题，是 [chrome 的问题](https://bugs.chromium.org/p/chromium/issues/detail?id=356132)。
后文简要介绍这个 bug。

<!-- more -->

## 现象和出现条件

### 现象

`table`布局中，`<td>` 的 border 在一定条件下会有诡异的现象，如这个 [codepen](https://codepen.io/caren11/pen/dgjeoZ) 所示，截图如下：

![](https://user-gold-cdn.xitu.io/2018/10/23/166a100e385cb53e?w=712&h=335&f=png&s=24472)

option 2 绿色的 `border-bottom` "延伸"到了 option3 下面去了。同样的，option 6 和 option 7 被选中时也会有类似的 Bug.

### 出现条件

这个 bug 的出现须满足以下两个条件：

1. `table`元素的 CSS 写了 `border-collapse: collapse`， 这个属性表示表格的单元格(`<td>` 和`<th>`)的 border 会 collapse （重叠），即拥有和 [margin collapse](https://developer.mozilla.org/zh-CN/docs/Web/CSS/CSS_Box_Model/Mastering_margin_collapsing) 一样的现象: 两条相邻的 border 会合并成一条。
2. 使用了`colspan`属性。

举个**例子**：上图 Option5 这个`<td>`就使用了`colspan="2"`，代表这个`<td>`占据两列。这时候，Option5 的上下 border 都有几率发生奇怪的现象。

### 原理

我们不知道他出现的根本原理，因为 chrome 开发人员也不知道。

> It's a known (old) issue in our table code. Collapsing borders are determined based on adjacent cells and our code doesn't deal correctly with spanning cells (we only consider the cell adjoining the first row / column in a row / column span). On top of that, our border granularity is determined by the cell's span.
> To fix this bug, we would need to overhaul our collapsing border code, which is a big undertaking.

翻译:

> 这个 bug 我们早就知道了，但是太麻烦了我们不想改。

## 如何解决

去掉两个条件之一呗，但显然，第二个条件是不能被去掉的，因为在一些情况下，我们就是需要某个单元格占据两列的宽度。

因而我们只能去掉第一个条件，与此同时，我们需要在`<table>` 处加一个`cellspacing="0"`的属性，以达到和`border-collapse: collapse`类似的效果。

## 如何解决(更新)

上面的解决方案使用了`cellspacing="0"`这个属性，但出于好奇我搜了一下`cellspacing`，想知道它的默认值，而后发现这个属性已经不被推荐使用了:
![](https://user-gold-cdn.xitu.io/2018/10/24/166a572b342de7a5?w=763&h=280&f=png&s=59897)
应该在 CSS 中使用 `border-spacing: 0`
