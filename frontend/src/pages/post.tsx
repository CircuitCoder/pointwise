import clsx from 'clsx';
import React, { ReactElement, useCallback, useContext, useEffect, useState } from 'react';
import { Ctx } from '../App';
import PostMetaIcon from '../comps/PostMetaIcon';

type Data = {
};

const Post = React.memo((): ReactElement => {
  const global = useContext(Ctx);
  const [data, setData] = useState<Data | null>(null);

  useEffect(() => {
    // TODO: fetch
    setTimeout(() => {
      global?.titleLayer?.condense().then(() => {
        setData({});
      });
    }, 3000);
  }, []);

  return (
    <div className="post-wrapper">
      <div className={clsx("post", { 'post-hidden': data === null })}>
        <div className="post-inner">
          <div className="post-meta">
            <div className="post-author">
              <img src="https://lh3.googleusercontent.com/a-/AOh14Gh_MGK0Bw_K_pZ2kMQ-UFnybSQbS2NSBn8m0fB7lg=s96-c" />
              <div className="post-author-img-mask" />
              <div className="post-author-info">
                <div className="post-author-name">
                  喵喵 🍓
                </div>
                <div className="post-author-tool">
                  w/ 猫爪子
                </div>
              </div>
            </div>

            <PostMetaIcon id="post-time" className="post-meta-icon">access_time</PostMetaIcon>
            <div className="post-time">
              <div className="post-time-date">
                2020-02-02
              </div>
              <div className="post-time-time">
                08:00:00
              </div>
              <div className="post-time-time">
                edit @ +43d
              </div>
            </div>

            <PostMetaIcon id="post-tag" className="post-meta-icon">style</PostMetaIcon>
          </div>
          <div className="post-content">
            Test
          </div>
        </div>
      </div>
    </div>
  );
});

export default Post;