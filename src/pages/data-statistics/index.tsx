import { Elementary } from '@/components/DBT/Elementary';
import { PageHead } from '@/components/PageHead';
import { DbtSourceModel } from '@/components/TransformWorkflow/FlowEditor/Components/Canvas';
import { StatisticsPane } from '@/components/TransformWorkflow/FlowEditor/Components/LowerSectionTabs/StatisticsPane';
import { Autocomplete } from '@/components/UI/Autocomplete/Autocomplete';
import { httpGet } from '@/helpers/http';
import { Box, Typography } from '@mui/material';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import styles from '@/styles/Home.module.css';

export default function DataStatisticsPage() {
  const { data: session } = useSession();
  const [sourceModels, setSourcesModels] = useState<DbtSourceModel[]>([]);
  const [selectedSourceModel, setSelectedSourceModel] =
    useState<DbtSourceModel | null>(null);
  console.log(selectedSourceModel);

  const fetchSourcesModels = () => {
    httpGet(session, 'transform/dbt_project/sources_models/')
      .then((response: DbtSourceModel[]) => {
        setSourcesModels(response);
      })
      .catch((error) => {
        console.log(error);
      });
  };

  useEffect(() => {
    fetchSourcesModels();
  }, []);
  return (
    <>
      <PageHead title="Dalgo" />
      <main className={styles.main}>
        <Typography
          sx={{ fontWeight: 700 }}
          variant="h4"
          gutterBottom
          color="#000"
        >
          Data statistics
        </Typography>
        <Box sx={{}}>
          <Typography
            sx={{ fontWeight: 700 }}
            variant="body1"
            gutterBottom
            color="#000"
          >
            Select table
          </Typography>
          <Autocomplete
            options={sourceModels}
            sx={{ width: 300 }}
            getOptionLabel={(option) => option.input_name}
            groupBy={(option) => option.schema}
            onChange={(model) => setSelectedSourceModel(model)}
          />
          <StatisticsPane modelToPreview={selectedSourceModel} />
        </Box>
      </main>
    </>
  );
}
