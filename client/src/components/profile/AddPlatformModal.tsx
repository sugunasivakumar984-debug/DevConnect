/**
 * AddPlatformModal.tsx
 *
 * Multi-step modal for connecting a developer platform account:
 * 1. Platform selector (categorized grid with search)
 * 2. Username / URL input + validation
 * 3. Fetch preview (loading → success / error)
 * 4. Confirm & save
 */

import { useState, useRef, useEffect } from 'react';
import { Search, ArrowLeft, CheckCircle, AlertCircle, ExternalLink, Loader2 } from 'lucide-react';
import { Modal, Button, Input, Label } from '../ui';
import { cn } from '../../lib/utils';
import { PLATFORM_META as _meta, PLATFORM_CATEGORIES as _cats, getPlatformsByCategory, getPlatformIcon } from '../../lib/platformMeta';
import type { PlatformMeta } from '../../lib/platformMeta';
import {
  fetchPlatformData,
  validatePlatformUsername,
  extractUsernameFromUrl,
  sanitizeUsername,
} from '../../lib/platformServices';
import { useConnectDeveloperPlatform } from '../../api/hooks';
import toast from 'react-hot-toast';

type Step = 'select' | 'input' | 'preview' | 'done';

interface Props {
  open: boolean;
  onClose: () => void;
  existingPlatforms: string[];
}

export default function AddPlatformModal({ open, onClose, existingPlatforms }: Props) {
  const [step, setStep] = useState<Step>('select');
  const [selectedMeta, setSelectedMeta] = useState<PlatformMeta | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [validationError, setValidationError] = useState('');
  const [fetchState, setFetchState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [fetchError, setFetchError] = useState('');
  const [fetchedData, setFetchedData] = useState<any>(null);
  const connect = useConnectDeveloperPlatform();
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset on open
  useEffect(() => {
    if (open) {
      setStep('select');
      setSelectedMeta(null);
      setInputValue('');
      setSearchQuery('');
      setValidationError('');
      setFetchState('idle');
      setFetchedData(null);
    }
  }, [open]);

  // Focus input when step changes
  useEffect(() => {
    if (step === 'input') setTimeout(() => inputRef.current?.focus(), 100);
  }, [step]);

  const grouped = getPlatformsByCategory();

  // Filter by search
  const filteredGrouped = searchQuery.trim()
    ? Object.fromEntries(
        Object.entries(grouped).map(([cat, platforms]) => [
          cat,
          platforms.filter((p) =>
            p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.id.toLowerCase().includes(searchQuery.toLowerCase())
          ),
        ]).filter(([, platforms]) => platforms.length > 0)
      )
    : grouped;

  const onSelectPlatform = (meta: PlatformMeta) => {
    setSelectedMeta(meta);
    setInputValue('');
    setValidationError('');
    setFetchState('idle');
    setFetchedData(null);
    setStep('input');
  };

  const onSubmitUsername = async () => {
    if (!selectedMeta) return;

    // Auto-extract from URL if user pasted a full URL
    let username = inputValue.trim();
    if (username.startsWith('http') || username.startsWith('www.')) {
      username = extractUsernameFromUrl(username, selectedMeta.id);
    }
    username = sanitizeUsername(username);

    const validation = validatePlatformUsername(selectedMeta.id, username);
    if (!validation.ok) {
      setValidationError(validation.error ?? 'Invalid input.');
      return;
    }
    setValidationError('');
    setFetchState('loading');
    setStep('preview');

    try {
      const data = await fetchPlatformData(selectedMeta.id, username);
      setFetchedData(data);
      setFetchState('success');
    } catch (err: any) {
      const msg = err.message === 'NOT_FOUND'
        ? `@${username} was not found on ${selectedMeta.name}. Check the username and try again.`
        : err.message === 'RATE_LIMIT'
        ? `${selectedMeta.name} is temporarily unavailable (rate limit). Please try again later.`
        : `Unable to retrieve data from ${selectedMeta.name} right now.`;
      setFetchError(msg);
      setFetchState('error');
    }
  };

  const onConfirmConnect = async () => {
    if (!selectedMeta) return;
    const username = sanitizeUsername(
      inputValue.startsWith('http') || inputValue.startsWith('www.')
        ? extractUsernameFromUrl(inputValue, selectedMeta.id)
        : inputValue
    );

    try {
      await connect.mutateAsync({
        platform: selectedMeta.id,
        platform_username: username,
        profile_url: fetchedData?.profile_url ?? fetchedData?.html_url ?? null,
        cached_data: fetchedData,
        visibility: 'public',
      });
      setStep('done');
      toast.success(`${selectedMeta.name} connected!`);
      setTimeout(() => onClose(), 1200);
    } catch (err: any) {
      toast.error(err.message ?? 'Failed to save platform connection.');
    }
  };

  const goBack = () => {
    if (step === 'input') setStep('select');
    if (step === 'preview') { setStep('input'); setFetchState('idle'); setFetchedData(null); }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={
        step === 'select' ? 'Add Developer Platform' :
        step === 'input' ? `Connect ${selectedMeta?.name}` :
        step === 'preview' ? `Verify ${selectedMeta?.name}` :
        '✅ Connected!'
      }
      footer={
        step === 'input' ? (
          <>
            <Button variant="secondary" onClick={goBack}>Back</Button>
            <Button onClick={() => void onSubmitUsername()} disabled={!inputValue.trim()}>
              Fetch Profile
            </Button>
          </>
        ) : step === 'preview' && fetchState === 'success' ? (
          <>
            <Button variant="secondary" onClick={goBack}>Back</Button>
            <Button onClick={() => void onConfirmConnect()} loading={connect.isPending}>
              Connect Account
            </Button>
          </>
        ) : step === 'preview' && fetchState === 'error' ? (
          <>
            <Button variant="secondary" onClick={goBack}>Try Again</Button>
            <Button onClick={() => void onConfirmConnect()} loading={connect.isPending} variant="outline">
              Save Anyway
            </Button>
          </>
        ) : undefined
      }
    >
      {/* ── Step: Select platform ─────────────────────────────────────── */}
      {step === 'select' && (
        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-label-tertiary pointer-events-none" />
            <Input
              placeholder="Search platforms…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Categorized grid */}
          <div className="space-y-5">
            {(Object.entries(filteredGrouped) as [string, PlatformMeta[]][]).map(([cat, platforms]) => {
              if (!platforms.length) return null;
              return (
                <div key={cat}>
                  <p className="text-[11px] font-semibold text-label-tertiary uppercase tracking-widest mb-2">{cat}</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {platforms.map((meta) => {
                      const alreadyConnected = existingPlatforms.includes(meta.id);
                      const icon = getPlatformIcon(meta.id);
                      return (
                        <button
                          key={meta.id}
                          type="button"
                          disabled={alreadyConnected}
                          onClick={() => onSelectPlatform(meta)}
                          className={cn(
                            'relative flex items-center gap-2.5 rounded-[14px] border px-3 py-2.5 text-left text-[13px] font-medium',
                            'transition-all duration-fast ease-apple',
                            alreadyConnected
                              ? 'border-[rgba(0,0,0,0.05)] bg-apple-gray-6/40 text-label-tertiary cursor-default opacity-60'
                              : 'border-[rgba(0,0,0,0.07)] bg-white/50 dark:bg-white/4 dark:border-white/8 text-label-primary',
                            !alreadyConnected && 'hover:border-[rgba(0,0,0,0.13)] hover:bg-white dark:hover:bg-white/10 hover:shadow-sm hover:-translate-y-px',
                            !alreadyConnected && 'active:scale-95',
                          )}
                        >
                          <div
                            className="h-7 w-7 rounded-[8px] flex items-center justify-center shrink-0"
                            style={{ background: meta.bgColor }}
                          >
                            {icon ? (
                              <img src={icon} alt="" className="h-4 w-4 object-contain" />
                            ) : (
                              <span className="text-[14px]">🔗</span>
                            )}
                          </div>
                          <span className="truncate">{meta.name}</span>
                          {alreadyConnected && (
                            <CheckCircle size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-apple-green" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Step: Input username ──────────────────────────────────────── */}
      {step === 'input' && selectedMeta && (
        <div className="space-y-5">
          {/* Platform header */}
          <div
            className="flex items-center gap-3 rounded-[14px] p-3"
            style={{ background: selectedMeta.bgColor }}
          >
            <div className="h-10 w-10 rounded-[10px] bg-white/60 flex items-center justify-center shadow-sm">
              {getPlatformIcon(selectedMeta.id) ? (
                <img src={getPlatformIcon(selectedMeta.id)} alt="" className="h-6 w-6 object-contain" />
              ) : (
                <span className="text-[20px]">🔗</span>
              )}
            </div>
            <div>
              <p className="text-[15px] font-semibold text-label-primary">{selectedMeta.name}</p>
              <p className="text-[12px] text-label-secondary">
                {selectedMeta.hasApi ? 'Public profile data will be fetched' : 'Link-only — no API available'}
              </p>
            </div>
          </div>

          {/* Input */}
          <div>
            <Label htmlFor="platform-username">Username or Profile URL</Label>
            <Input
              id="platform-username"
              ref={inputRef}
              placeholder={selectedMeta.placeholder}
              value={inputValue}
              onChange={(e) => { setInputValue(e.target.value); setValidationError(''); }}
              onKeyDown={(e) => { if (e.key === 'Enter' && inputValue.trim()) void onSubmitUsername(); }}
              className={cn(validationError && 'border-apple-red focus:border-apple-red focus:ring-apple-red/20')}
            />
            {validationError && (
              <p className="mt-1.5 flex items-center gap-1 text-[12px] text-apple-red">
                <AlertCircle size={12} /> {validationError}
              </p>
            )}
            <p className="mt-1.5 text-[12px] text-label-tertiary">
              You can paste a full profile URL — we'll extract the username automatically.
            </p>
          </div>
        </div>
      )}

      {/* ── Step: Preview / Fetch ─────────────────────────────────────── */}
      {step === 'preview' && (
        <div className="space-y-4">
          {/* Back button */}
          <button
            type="button"
            onClick={goBack}
            className="flex items-center gap-1.5 text-[13px] text-label-tertiary hover:text-label-primary transition-colors"
          >
            <ArrowLeft size={14} /> Back
          </button>

          {fetchState === 'loading' && (
            <div className="flex flex-col items-center gap-4 py-8">
              <Loader2 size={32} className="animate-spin text-apple-blue" />
              <p className="text-[14px] text-label-secondary">
                Fetching public profile from {selectedMeta?.name}…
              </p>
            </div>
          )}

          {fetchState === 'error' && (
            <div className="rounded-[16px] border border-apple-red/20 bg-apple-red/5 p-4">
              <p className="flex items-center gap-2 text-[14px] font-semibold text-apple-red mb-1">
                <AlertCircle size={16} /> Unable to Fetch Data
              </p>
              <p className="text-[13px] text-label-secondary">{fetchError}</p>
              <p className="mt-2 text-[12px] text-label-tertiary">
                You can still save the connection — the link will appear on your profile without stats.
              </p>
            </div>
          )}

          {fetchState === 'success' && fetchedData && selectedMeta && (
            <div className="space-y-4">
              <div className="rounded-[16px] border border-apple-green/20 bg-apple-green/5 p-3 flex items-center gap-2">
                <CheckCircle size={16} className="text-apple-green shrink-0" />
                <p className="text-[13px] font-medium text-apple-green">Profile found!</p>
              </div>

              {/* Preview card */}
              <div
                className="rounded-[16px] border border-[rgba(0,0,0,0.07)] dark:border-white/10 p-4 space-y-3"
                style={{ background: selectedMeta.bgColor + '40' }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="h-9 w-9 rounded-[10px] flex items-center justify-center"
                    style={{ background: selectedMeta.bgColor }}
                  >
                    {getPlatformIcon(selectedMeta.id) ? (
                      <img src={getPlatformIcon(selectedMeta.id)} alt="" className="h-5 w-5 object-contain" />
                    ) : (
                      <span>🔗</span>
                    )}
                  </div>
                  <div>
                    <p className="text-[14px] font-semibold text-label-primary">{selectedMeta.name}</p>
                    <p className="text-[12px] text-label-tertiary">
                      @{fetchedData.login ?? fetchedData.username ?? fetchedData.handle ?? fetchedData.display_name}
                    </p>
                  </div>
                  {fetchedData.html_url || fetchedData.profile_url || fetchedData.link ? (
                    <a
                      href={fetchedData.html_url ?? fetchedData.profile_url ?? fetchedData.link}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="ml-auto text-apple-blue hover:text-apple-blue/80 transition-colors"
                    >
                      <ExternalLink size={14} />
                    </a>
                  ) : null}
                </div>

                {/* Key facts */}
                <div className="flex flex-wrap gap-2 text-[12px] text-label-secondary">
                  {fetchedData.followers !== undefined && (
                    <span>👥 {fetchedData.followers} followers</span>
                  )}
                  {fetchedData.public_repos !== undefined && (
                    <span>📁 {fetchedData.public_repos} repos</span>
                  )}
                  {fetchedData.rating !== undefined && fetchedData.rating !== null && (
                    <span>📊 Rating {fetchedData.rating}</span>
                  )}
                  {fetchedData.reputation !== undefined && (
                    <span>💬 {fetchedData.reputation?.toLocaleString()} reputation</span>
                  )}
                  {fetchedData.submitStats?.totalSolved !== undefined && (
                    <span>🧩 {fetchedData.submitStats.totalSolved} solved</span>
                  )}
                  {fetchedData.num_models !== undefined && fetchedData.num_models !== null && (
                    <span>🤗 {fetchedData.num_models} models</span>
                  )}
                  {fetchedData.packages?.length > 0 && (
                    <span>📦 {fetchedData.packages.length} packages</span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Step: Done ────────────────────────────────────────────────── */}
      {step === 'done' && (
        <div className="flex flex-col items-center gap-4 py-8">
          <div className="h-16 w-16 rounded-full bg-apple-green/10 flex items-center justify-center animate-scale-in">
            <CheckCircle size={36} className="text-apple-green" />
          </div>
          <p className="text-[17px] font-semibold text-label-primary">
            {selectedMeta?.name} connected!
          </p>
          <p className="text-[14px] text-label-secondary">
            Your developer activity is now visible on your profile.
          </p>
        </div>
      )}
    </Modal>
  );
}
