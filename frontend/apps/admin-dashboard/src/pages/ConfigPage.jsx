import DemoConfigPanel from '../components/DemoConfigPanel.jsx';

export default function ConfigPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Config</h1>
        <p className="text-sm text-slate-500">
          Demo-convenience information about where this environment is
          pointed. No backend calls happen on this page.
        </p>
      </div>

      <DemoConfigPanel />
    </div>
  );
}
