import { type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Route, Switch, useLocation, Router as WouterRouter } from 'wouter';
import { Shell } from '@/components/kit';
import Home from '@/pages/home';
import Demos from '@/pages/demos';
import Architecture from '@/pages/architecture';
import Sales from '@/pages/sales';
import Resources from '@/pages/resources';
import Agenda from '@/pages/agenda';
import DemoInstanceDetails from '@/pages/demo-instance-details';
import Pricing from '@/pages/pricing';

const queryClient = new QueryClient();

function Router() {
  return (
    <Shell>
      <RoutedErrorBoundary>
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/demos" component={Demos} />
          <Route path="/demos/instance-details" component={DemoInstanceDetails} />
          <Route path="/architecture" component={Architecture} />
          <Route path="/sales" component={Sales} />
          <Route path="/pricing" component={Pricing} />
          <Route path="/resources" component={Resources} />
          <Route path="/agenda" component={Agenda} />
          <Route component={NotFound} />
        </Switch>
      </RoutedErrorBoundary>
    </Shell>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
