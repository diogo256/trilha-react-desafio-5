export interface GlobalData {
  name: string;
  blogTitle: string;
  footerText: string;
}

const getEnv = (value: string | undefined, fallback: string): string =>
  value ? decodeURI(value) : fallback;

export const getGlobalData = (): GlobalData => {
  const name = getEnv(process.env.BLOG_NAME, 'DIO Blog');
  const blogTitle = getEnv(process.env.BLOG_TITLE, 'Blog em NextJS');
  const footerText = getEnv(process.env.BLOG_FOOTER_TEXT, 'All rights reserved.');

  return {
    name,
    blogTitle,
    footerText,
  };
};
