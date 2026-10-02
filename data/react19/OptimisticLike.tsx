import { useOptimistic, useState } from 'react';

interface Post {
  id: number;
  title: string;
  likes: number;
  liked: boolean;
}

interface OptimisticLikeProps {
  initialPost: Post;
  label: string;
}

export function OptimisticLike({ initialPost, label }: OptimisticLikeProps) {
  const [post, setPost] = useState<Post>(initialPost);

  // Optimistic copy updates instantly, then syncs.
  const [optimistic, addOptimistic] = useOptimistic<Post, boolean>(
    post,
    (current, nextLiked) => ({
      ...current,
      liked: nextLiked,
      likes: current.likes + (nextLiked ? 1 : -1),
    })
  );

  async function toggle(): Promise<void> {
    const next = !optimistic.liked;
    addOptimistic(next);
    // Fake latency for the server write.
    await new Promise((r) => setTimeout(r, 400));
    setPost((p) => ({
      ...p,
      liked: next,
      likes: p.likes + (next ? 1 : -1),
    }));
  }

  return (
    <article>
      <h2>{optimistic.title}</h2>
      <p>
        {label}: {optimistic.likes}
      </p>
      <button type="button" onClick={toggle} aria-pressed={optimistic.liked}>
        {optimistic.liked ? 'Unlike' : 'Like'}
      </button>
    </article>
  );
}
