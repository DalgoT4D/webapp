import Head from 'next/head';
import '@/styles/Home.module.css';
import Image from 'next/image';
import Superset from '@/images/superset.png';

export default function Analysis() {
  return (
    <>
      <Head>
        <title>Data development platform</title>
      </Head>
      <div>
        <Image
          src={Superset}
          alt="Banner"
          style={{ width: '100%', height: '100%' }}
        />
      </div>
    </>
  );
}
