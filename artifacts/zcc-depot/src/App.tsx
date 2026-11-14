import { lazy, Suspense, type ComponentType, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Route, Switch, useLocation, Router as WouterRouter } from 'wouter';
import { Shell } from '@/components/kit';
import { DepotProvider } from '@/lib/depot-mode';
import { PresenterGate } from '@/components/presenter';

const Home = lazy(() => import('@/pages/home'));
const Demos = lazy(() => import('@/pages/demos'));
const Architecture = lazy(() => import('@/pages/architecture'));
const ArchitectureComponents = lazy(() => import('@/pages/architecture-components'));
const ArchitectureSystemOverview = lazy(() => import('@/pages/architecture-system-overview'));
const Sales = lazy(() => import('@/pages/sales'));
const SalesUseCases = lazy(() => import('@/pages/sales-use-cases'));
const Resources = lazy(() => import('@/pages/resources'));
const ResourceHowItWorks = lazy(() => import('@/pages/resource-how-it-works'));
const ResourceRouting = lazy(() => import('@/pages/resource-routing'));
const ResourceCallback = lazy(() => import('@/pages/resource-callback'));
const ResourceOutboundDialers = lazy(() => import('@/pages/resource-outbound-dialers'));
const ResourceSupervisor = lazy(() => import('@/pages/resource-supervisor-command-center'));
const Agenda = lazy(() => import('@/pages/agenda'));
const DemoInstanceDetails = lazy(() => import('@/pages/demo-instance-details'));
const Pricing = lazy(() => import('@/pages/pricing'));
const SellSheet = lazy(() => import('@/pages/sell-sheet'));
const DemoBrief = lazy(() => import('@/pages/demo-brief'));
const DemoNuggets = lazy(() => import('@/pages/demo-nuggets'));
const RoomExecutive = lazy(() => import('@/pages/rooms/executive-overview'));
const RoomArchitecture = lazy(() => import('@/pages/rooms/architecture-integrations'));
const RoomAi = lazy(() => import('@/pages/rooms/ai-automation'));
const RoomAgent = lazy(() => import('@/pages/rooms/agent-experience'));
const RoomUseCases = lazy(() => import('@/pages/rooms/use-cases'));
const RoomResources = lazy(() => import('@/pages/rooms/technical-resources'));

const queryClient = new QueryClient();

function PageSkeleton() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-6 md:px-8" aria-busy="true" aria-label="Loading">
      <div className="h-40 animate-pulse rounded-3xl bg-[#11110D]/8" />
      <div className="mt-6 grid gap-3 md:grid-cols-3">{[0, 1, 2].map((k) => <div key={k} className="h-32 animate-pulse rounded-2xl bg-[#11110D]/5" />)}</div>
    </div>
  );
}

function gated(C: ComponentType, title: string, detail?: string) {
  return function Gated() {
    return <div className="depot-gate-page"><PresenterGate title={title} detail={detail}><C /></PresenterGate></div>;
  };
}
const GatedPricing = gated(Pricing, 'Pricing and packaging');
const GatedSellSheet = gated(SellSheet, 'Internal sell sheet');
const GatedAgenda = gated(Agenda, 'Demo agendas', 'Agendas are shared team workspaces. Enter Presenter Mode to open them; they stay hidden in the customer-facing view.');
const GatedBrief = gated(DemoBrief, 'Demo Researcher', 'Saved research is shared team data. Enter Presenter Mode to open it; it stays hidden in the customer-facing view.');

function Router() {
  return (
    <Shell>
      <RoutedErrorBoundary>
        <Suspense fallback={<PageSkeleton />}>
          <Switch>
            <Route path="/" component={Home} />
            <Route path="/rooms/executive-overview" component={RoomExecutive} />
            <Route path="/rooms/architecture-integrations" component={RoomArchitecture} />
            <Route path="/rooms/ai-automation" component={RoomAi} />
            <Route path="/rooms/agent-experience" component={RoomAgent} />
            <Route path="/rooms/use-cases" component={RoomUseCases} />
            <Route path="/rooms/technical-resources" component={RoomResources} />
            <Route path="/demos" component={Demos} />
            <Route path="/demos/instance-details" component={DemoInstanceDetails} />
            <Route path="/demos/brief" component={GatedBrief} />
            <Route path="/demos/nuggets" component={DemoNuggets} />
            <Route path="/architecture" component={Architecture} />
            <Route path="/architecture/components" component={ArchitectureComponents} />
            <Route path="/architecture/system-overview" component={ArchitectureSystemOverview} />
            <Route path="/sales" component={Sales} />
            <Route path="/sales/use-cases-by-vertical" component={SalesUseCases} />
            <Route path="/pricing" component={GatedPricing} />
            <Route path="/sell-sheet" component={GatedSellSheet} />
            <Route path="/resources/how-it-works" component={ResourceHowItWorks} />
            <Route path="/resources/routing" component={ResourceRouting} />
            <Route path="/resources/callback" component={ResourceCallback} />
            <Route path="/resources/outbound-dialers" component={ResourceOutboundDialers} />
            <Route path="/resources/supervisor-command-center" component={ResourceSupervisor} />
            <Route path="/resources" component={Resources} />
            <Route path="/agenda" component={GatedAgenda} />
            <Route component={NotFound} />
          </Switch>
        </Suspense>
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
      <DepotProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </DepotProvider>
    </QueryClientProvider>
  );
}

export default App;
