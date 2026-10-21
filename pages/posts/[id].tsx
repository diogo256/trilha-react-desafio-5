import { getGlobalData, GlobalData } from '../../utils/global-data';
import { getPostBySlug, Post } from '../../utils/mdx-utils';

import { GetServerSideProps } from 'next';
import { ParsedUrlQuery } from 'querystring';
import Head from 'next/head';
import CustomLink from '../../components/CustomLink';
import Footer from '../../components/Footer';
import Header from '../../components/Header';
import Layout, { GradientBackground } from '../../components/Layout';
import SEO from '../../components/SEO';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';
import React from 'react';


const components = {
  a: CustomLink,
  Head,
};

interface Props {
  posts: Post;
  globalData: GlobalData;
}

interface Params extends ParsedUrlQuery {
  id: string;
}

export default function PostPage({
  posts,
  globalData,
}: Props) {
  return (
    <Layout>
      <SEO
        title={`${posts.title} - ${globalData.name}`}
        description={posts.description}
      />
      <Header name={globalData.name} />
      <article className="px-6 md:px-0">
        <header>
          <h1 className="text-3xl md:text-5xl dark:text-white text-center mb-12">
            {posts?.title}
          </h1>
          {posts?.description && (
            <p className="text-xl mb-4">{posts?.description}</p>
          )}
        </header>
        <main>
          <article className="prose dark:prose-dark max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {posts.body}              
            </ReactMarkdown>
          </article>
        </main>
      </article>
      <Footer copyrightText={globalData.footerText} />
      <GradientBackground
        variant="large"
        className="absolute -top-32 opacity-30 dark:opacity-50"
      />
      <GradientBackground
        variant="small"
        className="absolute bottom-0 opacity-20 dark:opacity-10"
      />
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps<Props, Params> = async ({ params }) => {
  const globalData = getGlobalData();
  const posts = await getPostBySlug(params!.id); 

  return {
    props: {
      globalData,
      posts,
    },
  };
};

