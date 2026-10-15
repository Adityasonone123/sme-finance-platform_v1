import React from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

export const AdminSettingsPage: React.FC = () => {
  return (
    <div className="space-y-6 max-w-2xl mx-auto pb-12">
      <div>
        <h1 className="text-2xl font-bold font-display text-[#0a0a0a]">Platform Settings</h1>
        <p className="text-xs text-[#737373] mt-1">System parameters and working capital risk policies</p>
      </div>

      <Card className="space-y-4">
        <h3 className="font-bold text-sm text-[#0a0a0a]">Default Working Capital Gap Threshold</h3>
        <p className="text-xs text-[#737373]">
          Alert suppliers when projected balance falls below 15 days of operating expenses.
        </p>

        <div className="pt-4 border-t border-[#e5e5e5] flex justify-end">
          <Button variant="accent">Save Settings</Button>
        </div>
      </Card>
    </div>
  );
};
