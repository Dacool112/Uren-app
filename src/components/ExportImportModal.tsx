import React, { useState, useRef, useEffect } from 'react';
import { Employer, Shift, SynologyConfig } from '../types';
import {
  exportBackupJSON,
  resetAllData,
  loadSynologyConfig,
  saveSynologyConfig,
  sendToSynologyNAS,
} from '../utils/storage';
import {
  generateCSV,
  formatCurrency,
  formatDecimalHours,
  calculateTotals,
  groupShiftsByMonth,
} from '../utils/calculations';
import {
  Download,
  Upload,
  FileSpreadsheet,
  FileCode,
  Copy,
  Check,
  RefreshCw,
  X,
  AlertTriangle,
  Share2,
  Info,
  HardDrive,
  Send,
  Loader2,
  ShieldCheck,
  Server,
} from 'lucide-react';

interface ExportImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  employers: Employer[];
  shifts: Shift[];
  onImportData: (data: { employers: Employer[]; shifts: Shift[] }) => void;
  onResetData: () => void;
}

export const ExportImportModal: React.FC<ExportImportModalProps> = ({
  isOpen,
  onClose,
  employers,
  shifts,
  onImportData,
  onResetData,
}) => {
  const [copied, setCopied] = useState(false);
  const [importError, setImportError] = useState('');
  const [importSuccess, setImportSuccess] = useState('');
  
  // Synology config & status state
  const [synologyConfig, setSynologyConfig] = useState<SynologyConfig>(() => loadSynologyConfig());
  const [isSendingToSynology, setIsSendingToSynology] = useState(false);
  const [synologyStatus, setSynologyStatus] = useState<{ success: boolean; message: string } | null>(null);
  const [showSynologySettings, setShowSynologySettings] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setSynologyConfig(loadSynologyConfig());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Handle Synology Config Changes
  const handleConfigChange = (key: keyof SynologyConfig, value: any) => {
    const updated = { ...synologyConfig, [key]: value };
    setSynologyConfig(updated);
    saveSynologyConfig(updated);
  };

  // Trigger Send to Synology NAS API
  const handleSendToSynology = async () => {
    setIsSendingToSynology(true);
    setSynologyStatus(null);
    saveSynologyConfig(synologyConfig);

    const result = await sendToSynologyNAS(synologyConfig, employers, shifts);
    setIsSendingToSynology(false);
    setSynologyStatus(result);

    if (result.success) {
      setSynologyConfig(loadSynologyConfig());
    }
  };

  // Download CSV
  const handleDownloadCSV = () => {
    const csvContent = generateCSV(shifts, employers);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `uren-overzicht-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Download JSON Backup
  const handleDownloadJSON = () => {
    const jsonString = exportBackupJSON(employers, shifts);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `uren-tracker-backup-${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Import JSON File
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImportError('');
    setImportSuccess('');

    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);

        if (!parsed || !Array.isArray(parsed.employers) || !Array.isArray(parsed.shifts)) {
          throw new Error('Ongeldig bestand. Zorg dat het een geldig Uren Tracker JSON-backupbestand is.');
        }

        onImportData({
          employers: parsed.employers,
          shifts: parsed.shifts,
        });

        setImportSuccess(`Succesvol ${parsed.shifts.length} diensten en ${parsed.employers.length} werkgevers geïmporteerd!`);
      } catch (err: any) {
        setImportError(err.message || 'Fout bij het inlezen van het bestand.');
      }
    };
    reader.readAsText(file);
  };

  // Generate WhatsApp / Email summary report
  const handleCopySummaryReport = () => {
    const totals = calculateTotals(shifts, employers);
    const monthly = groupShiftsByMonth(shifts, employers);

    let text = `📊 *UREN & LOON OVERZICHT*\n`;
    text += `Gegenereerd op: ${new Date().toLocaleDateString('nl-NL')}\n\n`;
    text += `Totaal gewerkte uren: ${formatDecimalHours(totals.totalNetHours)}\n`;
    text += `Totaal te ontvangen loon: ${formatCurrency(totals.totalEarnings)}\n`;
    if (totals.lateCancelledCount > 0) {
      text += `Inclusief ${totals.lateCancelledCount}x te laat geannuleerde dienst(en) (<24u) t.w.v. ${formatCurrency(totals.lateCancelledEarnings)}\n`;
    }
    text += `\n*MAANDOVERZICHT:*\n`;
    monthly.forEach((m) => {
      text += `• ${m.label}: ${formatDecimalHours(m.totalNetHours)} | ${formatCurrency(m.totalEarnings)}\n`;
    });

    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white border border-slate-200 text-slate-900 w-full max-w-md rounded-t-2xl sm:rounded-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-200">
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              <HardDrive className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-base text-slate-900">Exporteer naar Synology / JSON</h2>
              <p className="text-xs text-slate-400 font-medium">Offline opslag & Synology NAS integratie</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 overflow-y-auto space-y-4 flex-1 text-xs sm:text-sm">
          {/* Offline First Status Banner */}
          <div className="bg-emerald-50/80 border border-emerald-200/90 rounded-2xl p-3.5 flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-xs font-bold mt-0.5">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-emerald-950 text-xs">
                  Offline First opslag actief
                </span>
                <span className="bg-emerald-200/80 text-emerald-800 text-[10px] font-bold px-1.5 py-0.2 rounded-md">
                  100% Lokaal
                </span>
              </div>
              <p className="text-xs text-emerald-800 leading-relaxed font-medium">
                Al je ingevoerde diensten en werkgevers worden direct in <strong>LocalStorage</strong> op je telefoon opgeslagen. De app werkt volledig zonder internetverbinding.
              </p>
            </div>
          </div>

          {importError && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 p-2.5 rounded-xl flex items-center gap-2 text-xs font-semibold">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{importError}</span>
            </div>
          )}

          {importSuccess && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-2.5 rounded-xl flex items-center gap-2 text-xs font-semibold">
              <Check className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{importSuccess}</span>
            </div>
          )}

          {/* MAIN FEATURE: SYNOLOGY NAS EXPORT & API CONFIG */}
          <div className="bg-slate-50 border border-emerald-200/80 rounded-2xl p-3.5 space-y-3 relative overflow-hidden shadow-2xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Server className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <h3 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                    Synology NAS Integratie
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Stuur JSON gegevens rechtstreeks naar je NAS API
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSynologySettings(!showSynologySettings)}
                className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 bg-white border border-slate-200 px-2 py-1 rounded-lg transition-colors"
              >
                {showSynologySettings ? 'Verberg API Instellingen' : 'API Instellingen'}
              </button>
            </div>

            {/* Synology Endpoint Form */}
            {(showSynologySettings || !synologyConfig.apiUrl) && (
              <div className="space-y-2.5 bg-white p-3 rounded-xl border border-slate-200/80 animate-in fade-in">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Synology API / Webhook URL *
                  </label>
                  <input
                    type="url"
                    placeholder="http://192.168.1.100:5000/api/uren of https://nas.home.local:5001/api/uren"
                    value={synologyConfig.apiUrl}
                    onChange={(e) => handleConfigChange('apiUrl', e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder:text-slate-400"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Vul het IP-adres of domein-URL in van de API/Webhook op je Synology WebStation, Home Assistant of Node-RED.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    API Sleutel / Bearer Token (optioneel)
                  </label>
                  <input
                    type="password"
                    placeholder="Optionele geheim token of API-sleutel"
                    value={synologyConfig.apiKey || ''}
                    onChange={(e) => handleConfigChange('apiKey', e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder:text-slate-400"
                  />
                </div>
              </div>
            )}

            {/* Synology Action & Feedback */}
            <div className="space-y-2">
              <button
                onClick={handleSendToSynology}
                disabled={isSendingToSynology}
                className="w-full bg-emerald-500 hover:bg-emerald-600 active:scale-98 disabled:opacity-60 text-white py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
              >
                {isSendingToSynology ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Bezig met verzenden naar Synology...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Verstuur naar Synology NAS
                  </>
                )}
              </button>

              {synologyStatus && (
                <div
                  className={`p-2.5 rounded-xl text-xs font-medium flex items-start gap-2 ${
                    synologyStatus.success
                      ? 'bg-emerald-100/90 text-emerald-900 border border-emerald-300'
                      : 'bg-rose-50 text-rose-800 border border-rose-200'
                  }`}
                >
                  {synologyStatus.success ? (
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  )}
                  <div className="space-y-1">
                    <p className="font-semibold">{synologyStatus.message}</p>
                    {!synologyStatus.success && (
                      <p className="text-[11px] text-slate-600">
                        💡 Staat de NAS aan? Als je onderweg bent of de NAS staat uit, kun je hieronder altijd de JSON downloaden.
                      </p>
                    )}
                  </div>
                </div>
              )}

              {synologyConfig.lastSyncedAt && (
                <div className="text-[10px] text-slate-400 text-right font-medium">
                  Laatst succesvol verzonden: {new Date(synologyConfig.lastSyncedAt).toLocaleString('nl-NL')}
                </div>
              )}
            </div>
          </div>

          {/* JSON DOWNLOAD & IMPORT */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-3">
            <div className="flex items-center gap-2">
              <FileCode className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <h3 className="font-bold text-slate-900 text-xs">JSON Bestand Backup & Herstel</h3>
                <p className="text-[11px] text-slate-500 font-medium">
                  Download alle gegevens handmatig als los .json bestand of herstel een eerdere backup.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleDownloadJSON}
                className="bg-white hover:bg-slate-100 border border-slate-200 text-slate-800 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
              >
                <Download className="w-3.5 h-3.5 text-emerald-600" />
                Download JSON
              </button>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="bg-white hover:bg-slate-100 border border-slate-200 text-slate-800 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
              >
                <Upload className="w-3.5 h-3.5 text-emerald-600" />
                Importeer JSON
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          </div>

          {/* Export CSV Section */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-2">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <h3 className="font-bold text-slate-900 text-xs">Exporteer naar Excel / CSV</h3>
                <p className="text-[11px] text-slate-500 font-medium">
                  Download een spreadsheet met alle datums, uren, gewerkte tijden en berekend loon.
                </p>
              </div>
            </div>
            <button
              onClick={handleDownloadCSV}
              className="w-full mt-1 bg-white hover:bg-slate-100 border border-slate-200 text-slate-800 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-2xs transition-all"
            >
              <Download className="w-4 h-4 text-emerald-600" />
              Download .CSV bestand
            </button>
          </div>

          {/* Copy Report to Text / WhatsApp */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-2">
            <div className="flex items-center gap-2">
              <Share2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <h3 className="font-bold text-slate-900 text-xs">Tekstsamenvatting kopiëren</h3>
                <p className="text-[11px] text-slate-500 font-medium">
                  Kopieer een kant-en-klaar maandrapport om door te sturen via WhatsApp of e-mail.
                </p>
              </div>
            </div>
            <button
              onClick={handleCopySummaryReport}
              className="w-full mt-1 bg-slate-900 hover:bg-slate-800 text-white py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-all"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  Gekopieerd naar klembord!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Kopieer rapport voor WhatsApp
                </>
              )}
            </button>
          </div>

          {/* Reset All Data Option */}
          <div className="pt-2 border-t border-slate-100 flex justify-between items-center">
            <div className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
              <Info className="w-3.5 h-3.5 text-slate-400" />
              <span>Offline opslag in browser LocalStorage</span>
            </div>
            <button
              onClick={() => {
                if (
                  confirm(
                    'Weet je zeker dat je alle gegevens wilt terugzetten naar de voorbeelddiensten?'
                  )
                ) {
                  onResetData();
                  setImportSuccess('Data hersteld naar voorbeelden.');
                }
              }}
              className="text-[11px] text-rose-600 hover:text-rose-700 flex items-center gap-1 font-semibold hover:underline"
            >
              <RefreshCw className="w-3 h-3" />
              Herstel voorbeelddata
            </button>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-100">
          <button
            onClick={onClose}
            className="w-full bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 py-2.5 rounded-xl text-xs font-bold transition-colors"
          >
            Sluiten
          </button>
        </div>
      </div>
    </div>
  );
};
