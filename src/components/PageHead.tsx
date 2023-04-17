import Head from 'next/head';

export interface PageHeadProps {
  title: string;
}

export const PageHead = ({ title }: PageHeadProps) => {
  return (
    <Head>
      <title>{title}</title>
    </Head>
  );
};
