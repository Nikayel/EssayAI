'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import {
  Settings,
  ArrowLeft,
  Save,
  Trash2,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';

interface ConfigOverride {
  key: string;
  value: any;
  updatedAt: string;
  updatedBy: string | null;
}

interface ConfigState {
  pricing: any;
  cycle: any;
  scoring: any;
  models: any;
}

export default function ConfigPage() {
  const [currentConfig, setCurrentConfig] = useState<ConfigState | null>(null);
  const [overrides, setOverrides] = useState<ConfigOverride[]>([]);
  const [configKeys, setConfigKeys] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state for adding new override
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');

  useEffect(() => {
    fetchConfig();
  }, []);

  async function fetchConfig() {
    try {
      setIsLoading(true);
      const res = await fetch('/api/admin/config');
      const data = await res.json();

      if (data.success) {
        setCurrentConfig(data.currentConfig);
        setOverrides(data.overrides);
        setConfigKeys(data.configKeys);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to fetch config');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSetOverride(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      // Try to parse value as JSON, otherwise use as string
      let parsedValue: any;
      try {
        parsedValue = JSON.parse(newValue);
      } catch {
        parsedValue = newValue;
      }

      const res = await fetch('/api/admin/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: newKey, value: parsedValue }),
      });

      const data = await res.json();

      if (data.success) {
        setSuccess(data.message);
        setNewKey('');
        setNewValue('');
        fetchConfig();
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to set config override');
    }
  }

  async function handleRemoveOverride(key: string) {
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(`/api/admin/config?key=${encodeURIComponent(key)}`, {
        method: 'DELETE',
      });

      const data = await res.json();

      if (data.success) {
        setSuccess(data.message);
        fetchConfig();
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to remove config override');
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href="/admin">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </Link>
            <h1 className="text-2xl font-bold">Configuration</h1>
          </div>
          <Button variant="outline" onClick={fetchConfig}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Warning */}
        <Card className="mb-6 border-amber-200 bg-amber-50">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
              <div>
                <h4 className="font-semibold text-amber-900">Caution</h4>
                <p className="text-sm text-amber-800">
                  Changes to configuration take effect immediately and affect all users.
                  Double-check values before saving.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Messages */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-6 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            {success}
          </div>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="mt-4 text-gray-500">Loading configuration...</p>
          </div>
        )}

        {!isLoading && (
          <>
            {/* Add Override Form */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Set Config Override</CardTitle>
                <CardDescription>
                  Override a default configuration value. Changes are stored in the database and
                  persist across deployments.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSetOverride} className="space-y-4">
                  <div>
                    <Label htmlFor="key">Config Key</Label>
                    <select
                      id="key"
                      value={newKey}
                      onChange={(e) => setNewKey(e.target.value)}
                      className="w-full mt-1 p-2 border rounded-md"
                      required
                    >
                      <option value="">Select a config key...</option>
                      {configKeys.map((key) => (
                        <option key={key} value={key}>
                          {key}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="value">Value (JSON or string)</Label>
                    <Input
                      id="value"
                      value={newValue}
                      onChange={(e) => setNewValue(e.target.value)}
                      placeholder='999 or "string value" or {"key": "value"}'
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Enter numbers directly, strings in quotes, or JSON for objects/arrays
                    </p>
                  </div>

                  <Button type="submit">
                    <Save className="w-4 h-4 mr-2" />
                    Save Override
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Current Overrides */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Active Overrides</CardTitle>
                <CardDescription>
                  These values override the default configuration. Remove to restore defaults.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {overrides.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">
                    No active overrides. Using all default values.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {overrides.map((override) => (
                      <div
                        key={override.key}
                        className="flex items-center justify-between p-3 bg-blue-50 border border-blue-100 rounded"
                      >
                        <div>
                          <code className="text-sm font-mono text-blue-800">
                            {override.key}
                          </code>
                          <span className="mx-2 text-gray-400">=</span>
                          <code className="text-sm font-mono text-green-700">
                            {JSON.stringify(override.value)}
                          </code>
                          <p className="text-xs text-gray-500 mt-1">
                            Updated: {new Date(override.updatedAt).toLocaleString()}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveOverride(override.key)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Current Config Display */}
            <Card>
              <CardHeader>
                <CardTitle>Current Configuration</CardTitle>
                <CardDescription>
                  Live configuration values including any active overrides.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {currentConfig && (
                  <div className="space-y-6">
                    {/* Pricing */}
                    <ConfigSection title="Pricing" data={currentConfig.pricing} />

                    {/* Cycle */}
                    <ConfigSection title="Admission Cycle" data={currentConfig.cycle} />

                    {/* Scoring */}
                    <ConfigSection title="Scoring" data={currentConfig.scoring} />
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </div>
  );
}

function ConfigSection({ title, data }: { title: string; data: any }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="border rounded-lg">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50"
      >
        <span className="font-medium">{title}</span>
        <span className="text-gray-400">{isExpanded ? '−' : '+'}</span>
      </button>
      {isExpanded && (
        <div className="px-4 pb-4">
          <pre className="text-xs bg-gray-100 p-3 rounded overflow-x-auto">
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
