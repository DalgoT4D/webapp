import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SubscriptionInfo } from '../SubscriptionInfo';
import { useSession } from 'next-auth/react';
import { GlobalContext } from '@/contexts/ContextProvider';
import { httpGet, httpPost } from '@/helpers/http';

import moment from 'moment';
import { errorToast, successToast } from '@/components/ToastMessage/ToastHelper';

jest.mock('next-auth/react');
jest.mock('@/helpers/http');
jest.mock('@/components/ToastMessage/ToastHelper');

describe('SubscriptionInfo Component', () => {
  const mockUseSession = useSession as jest.Mock;
  const mockHttpGet = httpGet as jest.Mock;
  const mockHttpPost = httpPost as jest.Mock;
  const mockErrorToast = errorToast as jest.Mock;
  const mockSuccessToast = successToast as jest.Mock;

  const mockGlobalContext = {
    Permissions: {
      state: ['can_initiate_org_plan_upgrade'],
    },
  };

  const orgPlanMock = {
    base_plan: 'Pro',
    superset_included: true,
    subscription_duration: 'Annual',
    can_upgrade_plan: true,
    features: {
      pipeline: ['Feature A', 'Feature B'],
      data_visualization: ['Dashboard A', 'Dashboard B'],
    },
    start_date: moment().subtract(10, 'days').format('YYYY-MM-DD'),
    end_date: moment().add(20, 'days').format('YYYY-MM-DD'),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseSession.mockReturnValue({
      data: { user: { email: 'test@example.com' } },
      status: 'authenticated',
    });
  });

  const renderComponent = () =>
    render(
      <GlobalContext.Provider value={mockGlobalContext}>
        <SubscriptionInfo />
      </GlobalContext.Provider>
    );

  test('displays a loader when fetching org plan', async () => {
    mockHttpGet.mockImplementation(
      () =>
        new Promise((resolve) => {
          setTimeout(() => resolve({ success: true, res: orgPlanMock }), 500);
        })
    );

    renderComponent();

    expect(screen.getByRole('progressbar')).toBeInTheDocument();

    await waitFor(() => expect(screen.queryByRole('progressbar')).not.toBeInTheDocument());
  });

  test('renders org plan details correctly', async () => {
    mockHttpGet.mockResolvedValue({ success: true, res: orgPlanMock });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Pro')).toBeInTheDocument();
      expect(screen.getByText('+ Superset')).toBeInTheDocument();
      expect(screen.getByText('Annual')).toBeInTheDocument();
      expect(screen.getByText('Feature A | Feature B')).toBeInTheDocument();
      expect(screen.getByText('Dashboard A')).toBeInTheDocument();
      expect(screen.getByText('Dashboard B')).toBeInTheDocument();

      // Start and end dates
      expect(screen.getByText('Start date')).toBeInTheDocument();
      expect(
        screen.getByText(moment(orgPlanMock.start_date).format('DD MMM, YYYY'))
      ).toBeInTheDocument();
      expect(screen.getByText('End date')).toBeInTheDocument();
      expect(
        screen.getByText(moment(orgPlanMock.end_date).format('DD MMM, YYYY'))
      ).toBeInTheDocument();

      // Days remaining
      expect(screen.getByText('20 days remaining')).toBeInTheDocument();
    });
  });

  test('displays "0 days remaining" when the plan has ended', async () => {
    const expiredPlanMock = {
      ...orgPlanMock,
      end_date: moment().subtract(1, 'day').format('YYYY-MM-DD'),
    };
    mockHttpGet.mockResolvedValue({ success: true, res: expiredPlanMock });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Plan has expired')).toBeInTheDocument();
    });
  });

  test('handles API errors gracefully', async () => {
    mockHttpGet.mockRejectedValue(new Error('API Error'));

    renderComponent();

    await waitFor(() => {
      expect(mockErrorToast).toHaveBeenCalledWith('API Error', [], mockGlobalContext);
    });
  });

  test('handles the upgrade button click and success response', async () => {
    mockHttpGet.mockResolvedValue({ success: true, res: orgPlanMock });
    mockHttpPost.mockResolvedValue({ success: true });

    renderComponent();

    await waitFor(() => {
      const upgradeButton = screen.getByText('Upgrade');
      expect(upgradeButton).toBeEnabled();
      fireEvent.click(upgradeButton);
    });

    await waitFor(() => {
      expect(mockHttpPost).toHaveBeenCalledWith(
        { user: { email: 'test@example.com' } },
        'orgpreferences/org-plan/upgrade',
        {}
      );
      expect(mockSuccessToast).toHaveBeenCalledWith(
        `Upgrade org's plan request have been successfully registered`,
        [],
        mockGlobalContext
      );
    });
  });

  test('disables upgrade button if conditions are not met', async () => {
    const noUpgradePlanMock = {
      ...orgPlanMock,
      can_upgrade_plan: false,
    };
    mockHttpGet.mockResolvedValue({ success: true, res: noUpgradePlanMock });

    renderComponent();

    await waitFor(() => {
      const upgradeButton = screen.getByText('Upgrade');
      expect(upgradeButton).toBeDisabled();
    });
  });

  test('handles upgrade API error', async () => {
    mockHttpGet.mockResolvedValue({ success: true, res: orgPlanMock });
    mockHttpPost.mockRejectedValue(new Error('Upgrade API Error'));

    renderComponent();

    await waitFor(() => {
      const upgradeButton = screen.getByText('Upgrade');
      fireEvent.click(upgradeButton);
    });

    await waitFor(() => {
      expect(mockErrorToast).toHaveBeenCalledWith('Upgrade API Error', [], mockGlobalContext);
    });
  });
});
