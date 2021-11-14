import React, { ReactElement } from 'react';
import ImgAboutArrow from './assets/arrow.svg';

const TitleLayer = React.memo((): ReactElement => {
  return (
    <div className="page about">
      <img src={ImgAboutArrow} className="about-arrow" />
      <h2>
        关于
        <small> :: SpeicalPage</small>
      </h2>

      <p>
        <ruby>现实 <rp>(</rp><rt>Real</rt><rp>)</rp></ruby>是连续的，而人的数目<ruby>有穷 <rp>(</rp><rt>Finite</rt><rp>)</rp></ruby>。因此人类作为一个种族的认知总体在现实面前，占到的比例大概只有 0。我们终究无法达到真理。
      </p>

      <p>
        此外，无论是 256 种字节构成的任意数据，还是有限的音节和文字所构成的，从古至今的所有的文章，话语，乃至思想，都被<ruby>可数 <rp>(</rp><rt>Countable</rt><rp>)</rp></ruby>所限制。我们不仅无法想象真正的现实，甚至无法通过沟通，去了解另一个人脑中的现实，他的思想世界。
      </p>

      <p>
        我们竭尽所能做到的极致，依旧无外乎在连续的混乱中，读出带有噪声的一个<strong><span className="about-red">点</span>数据</strong>。
      </p>

      <p>
        无论如何，物理学家们还在内部对现实法则进行“无端”的猜测，并在过程中制造出了不少精巧的逻辑玩具。多数人说这些理论是困难的。少数人说它们是美丽的。还有一个<strong><span className="about-red">喵</span>喵</strong>。喵喵存在在这个混乱的现实中。
      </p>

      <p>
        这个网站也存在着，是喵喵的博客。
      </p>
    </div>
  );
});