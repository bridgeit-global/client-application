'use client';
import { useState } from 'react';
import { LoadingButton } from './loading-button';
import { Download } from 'lucide-react';

const ExportButton = ({ file_name }: { file_name: string }) => {
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const handleExport = async (): Promise<void> => {
    setIsExporting(true);
    try {
      const response = await fetch(`/api/export/${file_name}`);
      if (!response.ok) {
        throw new Error('Export failed');
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      const now = new Date();
      const formattedDate = now.toLocaleDateString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }).replace(/\//g, '-');
      const formattedTime = now.toLocaleTimeString('en-US', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit'
      }).replace(':', '');
      a.download = `${file_name}_${formattedDate}_${formattedTime}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Export error:', error);
      alert('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };
  return (
    <div>
      <LoadingButton
        icon={Download}
        variant="outline"
        onClick={handleExport}
        loading={isExporting}
      >
        <div className="hidden md:block">Export</div>
      </LoadingButton>
    </div>
  );
};

export default ExportButton;
