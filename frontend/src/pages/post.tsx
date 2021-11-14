import React, { ReactElement } from 'react';

const Post = React.memo((): ReactElement => {
  return (
    <div className="post">
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

          <div className="post-meta-icon">
            <i className="material-icons">access_time</i>
          </div>
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

          <div className="post-meta-icon">
            <i className="material-icons">style</i>
          </div>
        </div>
        <div className="post-content">
          Test
        </div>
      </div>
    </div>
  );
});

export default Post;