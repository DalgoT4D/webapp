import Head from 'next/head';
import styles from '@/styles/Home.module.css';
import { Box, Tab, Tabs, Typography } from '@mui/material';
import React from 'react';
import useSWR from 'swr';
import { backendUrl } from '@/config/constant';
import { PageHead } from '@/components/PageHead';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          <Typography>{children}</Typography>
        </Box>
      )}
    </div>
  );
}

console.log(process.env);
export default function Ingest() {
  const [value, setValue] = React.useState(0);

  const { data, isLoading, error } = useSWR(
    `${backendUrl}/api/airbyte/connections`
  );

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  return (
    <>
      <PageHead title="Development Data Platform" />
      <main className={styles.main}>
        <Typography
          sx={{ fontWeight: 700 }}
          variant="h4"
          gutterBottom
          color="#000"
        >
          Ingest
        </Typography>
        <Box sx={{ borderBottom: 1, borderColor: '#DDDDDD' }}>
          <Tabs
            value={value}
            onChange={handleChange}
            aria-label="basic tabs example"
          >
            <Tab label="Connections" />
            <Tab label="Sources" />
            <Tab label="Destinations" />
          </Tabs>
        </Box>
        <TabPanel value={value} index={0}></TabPanel>
        <TabPanel value={value} index={1}>
          Sources
        </TabPanel>
        <TabPanel value={value} index={2}>
          Destinations
        </TabPanel>
      </main>
    </>
  );
}
