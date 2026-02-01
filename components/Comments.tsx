"use client";

import { useEffect, useRef } from 'react';

interface CommentsProps {
  slug: string;
  title: string;
}

export function Comments({ slug, title }: CommentsProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current || ref.current.children.length > 0) return;

    const script = document.createElement('script');
    script.src = 'https://giscus.app/client.js';
    script.setAttribute('data-repo', 'caopengau/aiready-cli');
    script.setAttribute('data-repo-id', 'R_kgDOQ4p1VQ');
    script.setAttribute('data-category', 'General');
    script.setAttribute('data-category-id', 'DIC_kwDOQ4p1Vc4C1tDW');
    script.setAttribute('data-mapping', 'pathname');
    script.setAttribute('data-strict', '0');
    script.setAttribute('data-reactions-enabled', '1');
    script.setAttribute('data-emit-metadata', '0');
    script.setAttribute('data-input-position', 'bottom');
    script.setAttribute('data-theme', 'preferred_color_scheme');
    script.setAttribute('data-lang', 'en');
    script.setAttribute('crossorigin', 'anonymous');
    script.async = true;

    ref.current.appendChild(script);
  }, [slug]);

  return (
    <div className="mt-16 pt-16 border-t border-slate-200 dark:border-zinc-800">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-8 text-slate-900 dark:text-white">
          Join the Discussion
        </h2>
        <p className="text-center text-slate-600 dark:text-slate-400 mb-8">
          Have questions or want to share your AI code quality story? Drop them below. I read every comment.
        </p>

        <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-lg border border-slate-200 dark:border-zinc-800 p-6">
          <div ref={ref} />
        </div>
      </div>
    </div>
  );
}