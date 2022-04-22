import clsx from 'clsx';
import React, { ReactElement, useCallback, useContext, useEffect, useState } from 'react';
import { Ctx } from '../App';
import PostMetaIcon from '../comps/PostMetaIcon';
import { downloadPost } from "../content";

type Props = {
  id: string,
}

type Data = {
  html: string,
};

async function fetchAndWait(id: string) {
  const [post] = await Promise.all([
    downloadPost(id),
    new Promise(resolve => setTimeout(() => resolve(null), 3000)),
  ]);
  return post;
}

const Post = React.memo(({ id }: Props): ReactElement => {
  const global = useContext(Ctx);
  const [data, setData] = useState<Data | null>(null);
  const [notFound, setNotFound] = useState<boolean>(false);

  // TODO: detect id changes

  useEffect(() => {
    async function action() {
      const post = await fetchAndWait(id);
      global?.titleLayer?.condense().then(() => {
        if(post) setData(post);
        else setNotFound(true);
      });
    };

    action();
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
          <div className="post-content" dangerouslySetInnerHTML={{
            __html: data?.html ?? "",
          }}>
          </div>
        </div>
      </div>
    </div>
  );
});

export default Post;