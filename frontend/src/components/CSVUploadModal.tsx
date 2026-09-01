import React, { useState } from 'react';
import { X, Upload, FileText, Download, CheckCircle, RefreshCcw } from 'lucide-react';
import { uploadOrdersCSV } from '../api';

interface CSVUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (res: any) => void;
}

export const CSVUploadModal: React.FC<CSVUploadModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [csvResult, setCsvResult] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a CSV file to upload.');
      return;
    }
    setLoading(true);
    setError('');
    setSuccess('');
    setCsvResult(null);
    try {
      const res = await uploadOrdersCSV(file);
      setSuccess(res.message || 'CSV imported successfully!');
      if (res.downloadable_csv) {
        setCsvResult(res.downloadable_csv);
      }
      onSuccess(res);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to parse CSV file');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!csvResult) return;
    const blob = new Blob([csvResult], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'sentinel_scored_results.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCloseAndRefresh = () => {
    if (success) {
      window.location.reload();
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="surface-card max-w-md w-full p-6 relative">
        <button
          onClick={handleCloseAndRefresh}
          className="absolute top-4 right-4 p-2 text-fintech-muted hover:text-fintech-text rounded-lg hover:bg-fintech-subcard transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="p-3 bg-fintech-primary/10 text-fintech-primary rounded-xl border border-fintech-primary/20">
            {success ? <CheckCircle className="w-6 h-6 text-fintech-safe" /> : <Upload className="w-6 h-6" />}
          </div>
          <div>
            <h2 className="text-xl font-bold text-fintech-text">
              {success ? 'Upload Complete' : 'Upload Store Orders CSV'}
            </h2>
            <p className="text-xs text-fintech-muted">
              {success ? 'Batch scored successfully' : 'Import store export file for batch scoring'}
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-fintech-danger/10 border border-fintech-danger/30 rounded-lg text-fintech-danger text-sm">
            {error}
          </div>
        )}
        
        {success && (
          <div className="mb-4 p-4 bg-fintech-safe/10 border border-fintech-safe/30 rounded-xl">
            <p className="text-fintech-safe text-sm font-bold mb-3">{success}</p>
            {csvResult && (
              <button
                onClick={handleDownload}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-fintech-safe text-white rounded-lg hover:opacity-90 font-semibold shadow-sm transition-all"
              >
                <Download className="w-4 h-4" /> Download Predicted CSV
              </button>
            )}
          </div>
        )}

        {!success && (
          <div className="border-2 border-dashed border-fintech-border hover:border-fintech-primary/50 rounded-xl p-6 text-center bg-fintech-bg transition-all cursor-pointer">
            <input
              type="file"
              accept=".csv"
              onChange={e => {
                setFile(e.target.files?.[0] || null);
                setError('');
                setSuccess('');
                setCsvResult(null);
              }}
              className="hidden"
              id="csv-file-input"
            />
            <label htmlFor="csv-file-input" className="cursor-pointer flex flex-col items-center">
              <FileText className="w-10 h-10 text-fintech-muted mb-2" />
              <span className="text-sm font-semibold text-fintech-text">
                {file ? file.name : 'Click to select CSV file'}
              </span>
              <div className="mt-3 p-2 bg-fintech-subcard border border-fintech-border rounded-lg text-left">
                <span className="block text-[10px] font-bold text-fintech-muted uppercase tracking-wider mb-1">Required Exact Columns:</span>
                <span className="text-[10px] font-mono text-fintech-primary font-bold">
                  order_id, customer_name, customer_phone, product_name, amount, payment_method
                </span>
              </div>
            </label>
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-6">
          {success ? (
            <button
              type="button"
              onClick={handleCloseAndRefresh}
              className="px-5 py-2 text-sm font-semibold bg-fintech-primary hover:opacity-90 text-white rounded-xl shadow-lg flex items-center gap-2 transition-all"
            >
              <RefreshCcw className="w-4 h-4" /> Refresh Dashboard
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={handleCloseAndRefresh}
                className="px-4 py-2 text-sm text-fintech-muted hover:text-fintech-text"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUpload}
                disabled={loading || !file}
                className="px-5 py-2 text-sm font-semibold bg-fintech-primary hover:opacity-90 text-white rounded-xl shadow-lg flex items-center gap-2 disabled:opacity-50 transition-all"
              >
                {loading ? 'Processing CSV...' : 'Import & Batch Score'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
