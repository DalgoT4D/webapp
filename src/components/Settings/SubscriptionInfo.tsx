import { GlobalContext } from '@/contexts/ContextProvider';
import { httpGet, httpPost } from '@/helpers/http';
import { Box, Button, CircularProgress, List, ListItem, Typography } from '@mui/material';
import { useSession } from 'next-auth/react';
import { useContext, useEffect, useState } from 'react';
import { errorToast, successToast } from '../ToastMessage/ToastHelper';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import moment from 'moment';
import { calculatePlanStatus } from '@/utils/common';
import { useTracking } from '@/contexts/TrackingContext';
type OrgPlan = {
  success: boolean;
  res: {
    org: {
      name: string;
      slug: string;
      type: string;
    };
    base_plan: string;
    superset_included: boolean;
    subscription_duration: string;
    features: {
      pipeline: string[];
      superset: string[];
      aiFeatures: string[];
      dataQuality: string[];
    };
    start_date: string;
    end_date: string;
    can_upgrade_plan: boolean;
    upgrade_requested: boolean;
  };
};

export const SubscriptionInfo = () => {
  const [orgPlan, setOrgPlan] = useState<any>([]);
  const { data: session } = useSession();
  const [loader, setLoader] = useState(false);
  const globalContext = useContext(GlobalContext);
  const permissions = globalContext?.Permissions?.state || [];
  const trackAmplitudeEvent = useTracking();

  const getOrgPlan = async () => {
    setLoader(true);
    try {
      const { success, res }: OrgPlan = await httpGet(session, `orgpreferences/org-plan`);
      if (!success) {
        errorToast('Something went wrong', [], globalContext);
        return;
      } else {
        setOrgPlan(res);
      }
    } catch (error: any) {
      console.error(error);
      errorToast(error.message, [], globalContext);
    } finally {
      setLoader(false);
    }
  };
  const hanldeUpgradePlan = async () => {
    trackAmplitudeEvent('[Plan Upgrade] Button clicked');
    try {
      const { success } = await httpPost(session, `orgpreferences/org-plan/upgrade`, {});

      if (!success) {
        errorToast('Something went wrong', [], globalContext);
        return;
      } else {
        successToast(
          `Upgrade org's plan request have been successfully registered`,
          [],
          globalContext
        );
      }
    } catch (error: any) {
      console.error(error);
      errorToast(error.message, [], globalContext);
    }
  };
  useEffect(() => {
    if (session) {
      getOrgPlan();
    }
  }, [session]);

  return (
    <>
      <Box
        sx={{
          boxShadow: '0px 4px 8px 0px rgba(9, 37, 64, 0.08)',
          borderRadius: '12px',
          pt: '.5rem',
          pb: '8px',
          minHeight: '300px',
        }}
      >
        {loader ? (
          <CircularProgress />
        ) : (
          orgPlan.features && (
            <>
              {/* Plan Details Section */}
              <Box sx={{ margin: '24px 32px' }}>
                <Box
                  sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  {/* Plan Information */}
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography
                      sx={{ fontWeight: 700, color: 'rgba(0, 137, 123, 1)', fontSize: '28px' }}
                    >
                      {orgPlan.base_plan}&nbsp;
                    </Typography>
                    {orgPlan.superset_included ? (
                      <Typography
                        sx={{ fontWeight: 700, color: 'rgba(15, 36, 64, 1)', fontSize: '28px' }}
                      >
                        {' '}
                        + Superset
                      </Typography>
                    ) : (
                      ''
                    )}
                    <Typography
                      sx={{
                        backgroundColor: 'rgba(15, 36, 64, 0.16)',
                        fontWeight: 700,
                        fontSize: '12px',
                        color: 'rgba(15, 36, 64, 0.87)',
                        ml: '1rem',
                        padding: '3px 13px',
                        borderRadius: '4px',
                      }}
                    >
                      {orgPlan.subscription_duration}
                    </Typography>
                  </Box>

                  <Button
                    variant="contained"
                    disabled={
                      !orgPlan.can_upgrade_plan ||
                      !permissions?.includes('can_initiate_org_plan_upgrade') ||
                      orgPlan.upgrade_requested
                    }
                    sx={{ p: '8px 24px' }}
                    onClick={hanldeUpgradePlan}
                  >
                    Upgrade
                  </Button>
                </Box>

                {/* Features Section */}
                <Box minHeight="153px">
                  {/* Pipeline Features */}
                  <List disablePadding>
                    <ListItem disablePadding sx={{ pt: '8px' }}>
                      <CheckCircleOutlineIcon sx={{ color: '#00897B', fontSize: '20px' }} />
                      <Typography
                        sx={{ ml: 1, fontSize: '15px', fontWeight: 600, color: '#0F2440AD' }}
                      >
                        {orgPlan.features?.pipeline.join(' | ')}
                      </Typography>
                    </ListItem>

                    {/* Other Features */}
                    {Object.keys(orgPlan.features).map((key) => {
                      if (key === 'pipeline') return null;

                      const featureItems = orgPlan.features[key];
                      return (
                        <Box key={key}>
                          {Array.isArray(featureItems) ? (
                            featureItems.map((item, index) => (
                              <ListItem disablePadding key={index} sx={{ pt: '8px' }}>
                                <CheckCircleOutlineIcon
                                  sx={{ color: '#00897B', fontSize: '20px' }}
                                />
                                <Typography
                                  sx={{
                                    ml: 1,
                                    fontSize: '15px',
                                    fontWeight: 600,
                                    color: '#0F2440AD',
                                  }}
                                >
                                  {item}
                                </Typography>
                              </ListItem>
                            ))
                          ) : (
                            <ListItem
                              disablePadding
                              sx={{ pt: '8px', fontWeight: 600, color: '#0F2440AD' }}
                            >
                              <CheckCircleOutlineIcon />
                              <Typography sx={{ ml: 1 }}>{featureItems}</Typography>
                            </ListItem>
                          )}
                        </Box>
                      );
                    })}
                  </List>
                </Box>
              </Box>
              {/* bottom duration remaining */}
              <Box
                display="flex"
                sx={{
                  backgroundColor: '#EBF6F4',
                  padding: '20px 24px',
                  borderRadius: '8px',
                  margin: '8px 8px 0 8px',
                }}
              >
                <Typography color={'#0F244099'} fontWeight={600}>
                  Start date
                </Typography>
                &nbsp;
                <Typography fontWeight={700} color={'#0F2440'}>
                  {moment(orgPlan.start_date).format('DD MMM, YYYY')}
                </Typography>
                &nbsp;-&nbsp;
                <Typography color={'#0F244099'} fontWeight={600}>
                  End date
                </Typography>
                &nbsp;
                <Typography fontWeight={700} color={'#0F2440'}>
                  {moment(orgPlan.end_date).format('DD MMM, YYYY')}
                </Typography>
                &nbsp;-&nbsp;
                {(() => {
                  const { isExpired, isLessThanAWeek, daysRemaining } = calculatePlanStatus(
                    orgPlan.end_date
                  );
                  return (
                    <Typography
                      fontWeight={600}
                      color={isExpired ? '#FF0000' : isLessThanAWeek ? '#FF0000' : '#00897B'}
                    >
                      {isExpired
                        ? 'Plan has expired'
                        : daysRemaining > 0
                          ? `${daysRemaining} day${daysRemaining > 1 ? 's' : ''} remaining`
                          : '0 days remaining'}
                    </Typography>
                  );
                })()}
              </Box>
            </>
          )
        )}
      </Box>
    </>
  );
};
