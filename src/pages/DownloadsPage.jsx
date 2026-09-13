import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import confetti from 'canvas-confetti';
import BentoCard from '../components/ui/BentoCard';
import StatusBadge from '../components/ui/StatusBadge';
import CopyPill from '../components/ui/CopyPill';
import SectionHeader from '../components/ui/SectionHeader';

export default function DownloadsPage() {
  const {
    clientDownloads,
    olderDownloads,
    availableVersions,
    selectedVersion,
    selectReleaseByVersion,
    latestClientVersion,
    latestClientBuild,
    downloadError,
    retryFetchDownloads,
    loading,
    downloadApiBaseUrl,
  } = useApp();

  const [detectedOS, setDetectedOS] = useState('windows');
  const [selectedWinFormat, setSelectedWinFormat] = useState('setup'); // 'setup' | 'portable' | 'msi'
  const [verifyHashInput, setVerifyHashInput] = useState('');
  const [showArchive, setShowArchive] = useState(false);
  const [showVerifier, setShowVerifier] = useState(false);
  const [downloadAttemptFailed, setDownloadAttemptFailed] = useState(false);

  // Auto-detect visitor operating system on mount
  useEffect(() => {
    const ua = (typeof window !== 'undefined' && navigator.userAgent) ? navigator.userAgent.toLowerCase() : '';
    if (ua.includes('android')) setDetectedOS('android');
    else if (ua.includes('linux')) setDetectedOS('linux');
    else if (ua.includes('mac') || ua.includes('darwin')) setDetectedOS('macos');
    else setDetectedOS('windows');
  }, []);

  // Categorize specific release artifacts
  const winSetup = clientDownloads.find(
    (d) => d.key === 'windows_nsis' || d.filename?.endsWith('-setup.exe') || (d.platform_key === 'windows' && d.filename?.endsWith('.exe') && !d.filename?.toLowerCase().includes('portable'))
  );
  const winPortable = clientDownloads.find(
    (d) => d.key === 'windows_portable' || d.filename?.toLowerCase().includes('portable') || d.filename?.endsWith('.zip')
  );
  const winMsi = clientDownloads.find(
    (d) => d.key === 'windows_msi' || d.filename?.endsWith('.msi')
  );

  const latestAppImage = clientDownloads.find((d) => d.platform_key === 'linux' && d.filename?.endsWith('.AppImage'));
  const latestDeb = clientDownloads.find((d) => d.platform_key === 'linux' && d.filename?.endsWith('.deb'));
  const latestTarGz = clientDownloads.find((d) => d.platform_key === 'linux' && d.filename?.endsWith('.tar.gz'));
  const latestApk = clientDownloads.find(
    (d) => d.platform_key === 'android' || d.key === 'android_apk' || d.filename?.endsWith('.apk')
  );

  const triggerDownload = (dl) => {
    if (!dl) {
      setDownloadAttemptFailed(true);
      setTimeout(() => setDownloadAttemptFailed(false), 5000);
      return;
    }
    try {
      confetti({
        particleCount: 75,
        spread: 65,
        origin: { y: 0.75 },
        colors: ['#39FF14', '#22C55E', '#4ADE80'],
      });
    } catch {}

    const isApk = dl.platform_key === 'android' || dl.key === 'android_apk' || (dl.filename && dl.filename.endsWith('.apk'));
    let downloadFilename = dl.filename;
    if (!downloadFilename) {
      downloadFilename = isApk ? `vexta-v${dl.version || 'latest'}.apk` : `vexta-${dl.platform_key || 'client'}`;
    }
    if (isApk && !downloadFilename.endsWith('.apk')) {
      downloadFilename = `${downloadFilename}.apk`;
    }

    const base = downloadApiBaseUrl || 'https://downloads.nexusec.space';
    // For direct binary downloads, especially APKs on Android, point directly to the static file path
    // ending with the extension. This prevents Android DownloadManager from deriving "api.zip"
    // from an API redirect URL path segment (/api/v1/apps/...).
    const url =
      dl.url ||
      (downloadFilename && downloadFilename.includes('.')
        ? `${base}/vexta/${downloadFilename}`
        : dl.platform_key && dl.version
        ? `${base}/api/v1/apps/vexta/download/${dl.version}/${dl.platform_key}`
        : `${base}/api/v1/apps/vexta/download/${dl.platform_key || 'windows'}`);

    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', downloadFilename);
    link.setAttribute('target', '_blank');
    link.setAttribute('rel', 'noopener noreferrer');
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      document.body.removeChild(link);
    }, 150);
  };

  // Determine active Windows target based on user selection
  const getActiveWinTarget = () => {
    if (selectedWinFormat === 'portable') return winPortable || winSetup || winMsi;
    if (selectedWinFormat === 'msi') return winMsi || winSetup || winPortable;
    return winSetup || winPortable || winMsi;
  };

  // Determine Primary Recommended Download
  const getPrimaryDownload = () => {
    if (detectedOS === 'linux') {
      return {
        target: latestAppImage || latestDeb || latestTarGz,
        osName: 'Linux',
        icon: 'fa-brands fa-linux',
        typeLabel: 'AppImage (x86_64)',
        altTarget: latestDeb,
        altLabel: 'Download .deb Package',
      };
    }
    if (detectedOS === 'android') {
      return {
        target: latestApk,
        osName: 'Android',
        icon: 'fa-brands fa-android',
        typeLabel: 'ARM64 APK Installer',
        altTarget: null,
        altLabel: '',
      };
    }

    const winTarget = getActiveWinTarget();
    const typeLabel = selectedWinFormat === 'portable' 
      ? 'Standalone Portable (.exe)' 
      : selectedWinFormat === 'msi' 
      ? 'Enterprise Package (.msi)' 
      : 'Setup Wizard (.exe)';

    return {
      target: winTarget,
      osName: 'Windows',
      icon: 'fa-brands fa-windows',
      typeLabel: typeLabel,
      altTarget: null,
      altLabel: '',
    };
  };

  const primary = getPrimaryDownload();

  // Check if entered hash matches any download
  const allDownloadsList = [...clientDownloads, ...olderDownloads];
  const matchingDownload = verifyHashInput.trim()
    ? allDownloadsList.find((d) => d.sha256 && d.sha256.toLowerCase() === verifyHashInput.trim().toLowerCase())
    : null;

  return (
    <div className="flex flex-col gap-12 py-4 w-full min-h-[75vh]">
      
      {/* 1. HERO HEADER */}
      <SectionHeader
        tag="// OFFICIAL RELEASES"
        title="Get Vexta Client"
        description="Zero-knowledge, end-to-end encrypted messaging. All cryptography and private keys remain strictly on your local device."
      />

      {loading ? (
        /* LOADING STATE */
        <div className="flex flex-col gap-8 animate-in fade-in duration-300">
          <BentoCard hover={false} className="p-8 md:p-12 border-[#22C55E]/40 shadow-[0_15px_40px_rgba(0,0,0,0.7)] flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-5 w-full md:w-auto">
              <div className="relative w-16 h-16 rounded-2xl bg-[#22C55E]/15 border border-[#22C55E]/40 flex items-center justify-center text-[#39FF14] text-3xl shrink-0 shadow-lg">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-2xl bg-[#22C55E]/20"></span>
                <i className="fa-solid fa-cloud-arrow-down animate-bounce text-2xl"></i>
              </div>
              <div className="flex flex-col text-left flex-1 gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#39FF14] animate-pulse"></span>
                  <span className="text-base md:text-lg font-mono font-bold text-white uppercase tracking-wider">
                    Querying Release Repositories...
                  </span>
                </div>
                <span className="text-xs md:text-sm text-[#7E927F] font-mono">
                  Fetching verified binary manifests, signed checksums, and mirror endpoints
                </span>
                <div className="w-48 h-1.5 bg-[#060805] rounded-full overflow-hidden border border-[#243022] mt-1 relative">
                  <div className="h-full bg-gradient-to-r from-[#22C55E] via-[#39FF14] to-[#4ADE80] rounded-full animate-scan-beam w-1/2"></div>
                </div>
              </div>
            </div>
            <div className="w-full md:w-44 h-12 rounded-xl bg-[#141C13] border border-[#243022] flex items-center justify-center font-mono text-xs md:text-sm text-[#4ADE80] font-bold uppercase tracking-wider select-none">
              <i className="fa-solid fa-circle-notch fa-spin mr-2 text-[#39FF14]"></i>
              Connecting
            </div>
          </BentoCard>
        </div>
      ) : downloadError ? (
        /* DOWNLOADS SERVER QUERY FAILURE STATE - ONLY SHOW THIS CARD */
        <div className="flex flex-col gap-8 animate-in fade-in duration-300">
          <BentoCard
            hover={false}
            className="p-8 md:p-12 border-red-500/50 bg-[#0E0707] shadow-[0_10px_35px_rgba(239,68,68,0.2)] flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
          >
            <div className="flex items-start gap-5">
              <div className="w-16 h-16 rounded-2xl bg-red-500/15 border border-red-500/40 flex items-center justify-center text-red-400 text-3xl shrink-0 shadow-lg">
                <i className="fa-solid fa-triangle-exclamation animate-pulse"></i>
              </div>
              <div className="flex flex-col gap-2 text-left">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-lg md:text-xl font-mono font-bold text-white uppercase tracking-wider">
                    Downloads Server Unreachable
                  </span>
                  <StatusBadge label="OFFLINE // MIRROR UNAVAILABLE" variant="red" pulse={true} />
                </div>
                <p className="text-xs md:text-sm text-gray-300 font-sans leading-relaxed max-w-2xl">
                  Unable to retrieve official client release manifests and signed checksums from the distribution mirror. The release server may be temporarily offline or unreachable.
                </p>
                <span className="text-xs font-mono text-red-400/90">
                  Diagnostics: {downloadError}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto shrink-0">
              <button
                onClick={() => retryFetchDownloads()}
                disabled={loading}
                className="w-full md:w-auto px-6 py-3.5 bg-red-500/20 hover:bg-red-500/30 text-red-300 hover:text-white border border-red-500/40 hover:border-red-500 rounded-xl font-mono text-xs md:text-sm font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2.5 shadow-md select-none"
              >
                <i className={`fa-solid fa-rotate-right ${loading ? 'fa-spin text-red-400' : ''}`}></i>
                <span>{loading ? 'Reconnecting...' : 'Retry Connection'}</span>
              </button>
            </div>
          </BentoCard>
        </div>
      ) : (
        /* LOADED STATE WITH BENTO CARDS */
        <div className="flex flex-col gap-10 animate-in fade-in duration-300">
          
          {/* 2. PRIMARY SPOTLIGHT BENTO CARD */}
          <BentoCard hover={false} glow={true} className="p-7 md:p-9 flex flex-col md:flex-row items-center justify-between gap-6 border-[#22C55E]/40">
            <div className="flex items-center gap-5 w-full md:w-auto">
              <div className="w-18 h-18 rounded-2xl bg-[#22C55E]/15 border border-[#22C55E]/40 flex items-center justify-center text-[#39FF14] text-4xl shrink-0 shadow-lg p-4">
                <i className={primary.icon}></i>
              </div>
              <div className="flex flex-col text-left flex-1">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-xl md:text-3xl font-extrabold text-white uppercase tracking-wider">
                    Vexta for {primary.osName}
                  </span>
                  {(selectedVersion || latestClientVersion) && (
                    <StatusBadge
                      label={`v${selectedVersion || latestClientVersion}${primary.target?.build_number ? ` (Build ${primary.target.build_number})` : (latestClientBuild ? ` (Build ${latestClientBuild})` : '')}`}
                      variant="neon"
                    />
                  )}
                </div>
                <span className="text-xs md:text-sm text-[#7E927F] font-mono mt-1.5">
                  Recommended for your device • {primary.typeLabel} {primary.target?.size ? `(${primary.target.size})` : ''}
                </span>

                {/* Windows Format Switcher */}
                {detectedOS === 'windows' && (
                  <div className="flex items-center gap-2 mt-3.5 bg-[#060805] p-1.5 rounded-xl border border-[#243022] w-fit">
                    <button
                      onClick={() => setSelectedWinFormat('setup')}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                        selectedWinFormat === 'setup'
                          ? 'bg-[#22C55E] text-black shadow-sm'
                          : 'text-gray-300 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <i className="fa-solid fa-box mr-1.5"></i> Setup (.exe)
                    </button>
                    <button
                      onClick={() => setSelectedWinFormat('portable')}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                        selectedWinFormat === 'portable'
                          ? 'bg-[#22C55E] text-black shadow-sm'
                          : 'text-gray-300 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <i className="fa-solid fa-bolt mr-1.5"></i> Portable (.exe)
                    </button>
                    <button
                      onClick={() => setSelectedWinFormat('msi')}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                        selectedWinFormat === 'msi'
                          ? 'bg-[#22C55E] text-black shadow-sm'
                          : 'text-gray-300 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <i className="fa-solid fa-building mr-1.5"></i> MSI (.msi)
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Action Button & Hash Pill */}
            <div className="flex flex-col items-center md:items-end gap-3.5 w-full md:w-auto shrink-0">
              <button
                onClick={() => {
                  if (!primary.target) {
                    retryFetchDownloads();
                    setDownloadAttemptFailed(true);
                    setTimeout(() => setDownloadAttemptFailed(false), 5000);
                  } else {
                    triggerDownload(primary.target);
                  }
                }}
                className={`w-full md:w-auto px-8 py-4 font-extrabold text-sm md:text-base uppercase tracking-widest rounded-xl transition-all duration-200 cursor-pointer flex items-center justify-center gap-3 shadow-lg select-none ${
                  primary.target
                    ? 'bg-[#22C55E] hover:bg-[#39FF14] text-black hover:shadow-[0_0_30px_rgba(57,255,20,0.5)] hover:-translate-y-0.5 border border-[#39FF14]'
                    : 'bg-[#180D0D] hover:bg-[#241212] text-red-400 border border-red-500/40'
                }`}
              >
                <i className={`fa-solid ${primary.target ? 'fa-download text-base' : 'fa-cloud-slash text-base'}`}></i>
                <span>{primary.target ? `Download ${primary.typeLabel.split(' ')[0]}` : 'Mirror Offline • Retry'}</span>
              </button>

              {downloadAttemptFailed && !primary.target && (
                <div className="text-xs font-mono text-red-400 flex items-center gap-1.5 animate-in fade-in">
                  <i className="fa-solid fa-circle-exclamation"></i>
                  <span>Release binary unavailable. Re-attempting repository sync...</span>
                </div>
              )}

              {primary.target?.sha256 && (
                <CopyPill
                  text={primary.target.sha256}
                  displayValue={`SHA-256: ${primary.target.sha256.slice(0, 16)}...`}
                  className="w-full md:w-auto"
                />
              )}
            </div>
          </BentoCard>

          {/* 3. ALL PLATFORMS BENTO GRID */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-[#243022] pb-3">
              <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-[#4ADE80] flex items-center gap-2">
                <i className="fa-solid fa-layer-group text-[#39FF14]"></i> Available Platforms &amp; Formats
              </h2>
              <span className="text-xs font-mono text-[#7E927F]">Direct Verified Packages</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              
              {/* WINDOWS CARD */}
              <BentoCard span="col-span-1" className="p-6 justify-between gap-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-[#22C55E]/15 border border-[#22C55E]/30 flex items-center justify-center text-[#39FF14] text-2xl">
                      <i className="fa-brands fa-windows"></i>
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white uppercase font-mono">Windows</h3>
                      <span className="text-xs font-mono text-[#7E927F]">x64 (Windows 10 / 11)</span>
                    </div>
                  </div>
                  <StatusBadge label="STABLE" variant="green" />
                </div>

                <div className="flex flex-col gap-3 pt-3 border-t border-[#243022]">
                  {winSetup && (
                    <div className="flex items-center justify-between text-xs md:text-sm font-mono">
                      <div className="flex flex-col">
                        <span className="text-gray-200 font-bold">Setup (.exe)</span>
                        <span className="text-[11px] text-[#7E927F]">Standard Installer</span>
                      </div>
                      <button
                        onClick={() => triggerDownload(winSetup)}
                        className="px-3.5 py-1.5 bg-[#22C55E]/15 text-[#39FF14] hover:bg-[#22C55E] hover:text-black border border-[#22C55E]/40 rounded-lg text-xs font-bold uppercase transition-all cursor-pointer"
                      >
                        Get .exe
                      </button>
                    </div>
                  )}
                  {winPortable && (
                    <div className="flex items-center justify-between text-xs md:text-sm font-mono">
                      <div className="flex flex-col">
                        <span className="text-gray-200 font-bold">Portable (.exe)</span>
                        <span className="text-[11px] text-[#7E927F]">Zero-Install Standalone</span>
                      </div>
                      <button
                        onClick={() => triggerDownload(winPortable)}
                        className="px-3.5 py-1.5 bg-[#141C13] text-gray-200 hover:text-white hover:bg-[#1A2419] border border-[#243022] rounded-lg text-xs font-bold uppercase transition-all cursor-pointer"
                      >
                        Get .exe
                      </button>
                    </div>
                  )}
                  {winMsi && (
                    <div className="flex items-center justify-between text-xs md:text-sm font-mono">
                      <div className="flex flex-col">
                        <span className="text-gray-200 font-bold">Enterprise (.msi)</span>
                        <span className="text-[11px] text-[#7E927F]">Windows Installer</span>
                      </div>
                      <button
                        onClick={() => triggerDownload(winMsi)}
                        className="px-3.5 py-1.5 bg-[#141C13] text-gray-200 hover:text-white hover:bg-[#1A2419] border border-[#243022] rounded-lg text-xs font-bold uppercase transition-all cursor-pointer"
                      >
                        Get .msi
                      </button>
                    </div>
                  )}
                  {!winSetup && !winPortable && !winMsi && (
                    <div className="text-xs font-mono text-[#7E927F] py-1 flex items-center gap-2">
                      <i className="fa-solid fa-triangle-exclamation text-yellow-500/80"></i>
                      <span>Windows packages unavailable from mirror</span>
                    </div>
                  )}
                </div>
              </BentoCard>

              {/* ANDROID CARD */}
              <BentoCard span="col-span-1" className="p-6 justify-between gap-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-[#22C55E]/15 border border-[#22C55E]/30 flex items-center justify-center text-[#39FF14] text-2xl">
                      <i className="fa-brands fa-android"></i>
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white uppercase font-mono">Android</h3>
                      <span className="text-xs font-mono text-[#7E927F]">ARM64 / APK Sideload</span>
                    </div>
                  </div>
                  <StatusBadge label="ACTIVE" variant="mint" />
                </div>

                <div className="flex flex-col gap-3 pt-3 border-t border-[#243022]">
                  {latestApk ? (
                    <div className="flex items-center justify-between text-xs md:text-sm font-mono">
                      <div className="flex flex-col">
                        <span className="text-gray-200 font-bold">Direct Package (.apk)</span>
                        <span className="text-[11px] text-[#7E927F]">Android 8.0+ (ARM64)</span>
                      </div>
                      <button
                        onClick={() => triggerDownload(latestApk)}
                        className="px-3.5 py-1.5 bg-[#22C55E]/15 text-[#39FF14] hover:bg-[#22C55E] hover:text-black border border-[#22C55E]/40 rounded-lg text-xs font-bold uppercase transition-all cursor-pointer"
                      >
                        Get .apk
                      </button>
                    </div>
                  ) : (
                    <div className="text-xs font-mono text-[#7E927F] py-1 flex items-center gap-2">
                      <i className="fa-solid fa-triangle-exclamation text-yellow-500/80"></i>
                      <span>Android build unavailable from mirror</span>
                    </div>
                  )}
                </div>
              </BentoCard>

              {/* LINUX CARD */}
              <BentoCard span="col-span-1" className="p-6 justify-between gap-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-[#22C55E]/15 border border-[#22C55E]/30 flex items-center justify-center text-[#4ADE80] text-2xl">
                      <i className="fa-brands fa-linux"></i>
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white uppercase font-mono">Linux</h3>
                      <span className="text-xs font-mono text-[#7E927F]">x86_64 / Debian</span>
                    </div>
                  </div>
                  <StatusBadge label="STABLE" variant="green" />
                </div>

                <div className="flex flex-col gap-3 pt-3 border-t border-[#243022]">
                  {latestAppImage && (
                    <div className="flex items-center justify-between text-xs md:text-sm font-mono">
                      <span className="text-gray-200 font-bold">AppImage (x86_64)</span>
                      <button
                        onClick={() => triggerDownload(latestAppImage)}
                        className="px-3.5 py-1.5 bg-[#22C55E]/15 text-[#39FF14] hover:bg-[#22C55E] hover:text-black border border-[#22C55E]/40 rounded-lg text-xs font-bold uppercase transition-all cursor-pointer"
                      >
                        Get AppImage
                      </button>
                    </div>
                  )}
                  {latestDeb && (
                    <div className="flex items-center justify-between text-xs md:text-sm font-mono">
                      <span className="text-gray-300 font-bold">Debian (.deb)</span>
                      <button
                        onClick={() => triggerDownload(latestDeb)}
                        className="px-3.5 py-1.5 bg-[#141C13] text-gray-200 hover:text-white hover:bg-[#1A2419] border border-[#243022] rounded-lg text-xs font-bold uppercase transition-all cursor-pointer"
                      >
                        Get .deb
                      </button>
                    </div>
                  )}
                  {!latestAppImage && !latestDeb && (
                    <div className="text-xs font-mono text-[#7E927F] py-1 flex items-center gap-2">
                      <i className="fa-solid fa-triangle-exclamation text-yellow-500/80"></i>
                      <span>Linux packages unavailable from mirror</span>
                    </div>
                  )}
                </div>
              </BentoCard>

            </div>
          </div>

          {/* 4. ADVANCED VERIFIER & ARCHIVE BENTO ACCORDIONS */}
          <div className="flex flex-col gap-4">
            
            {/* SHA-256 Checksum Verifier Bento Card */}
            <BentoCard hover={false} className="p-0 overflow-hidden">
              <button
                onClick={() => setShowVerifier(!showVerifier)}
                className="w-full p-6 flex items-center justify-between text-sm font-mono font-bold uppercase text-[#4ADE80] hover:text-white bg-[#0E120D] transition-colors cursor-pointer select-none"
              >
                <span className="flex items-center gap-2.5">
                  <i className="fa-solid fa-fingerprint text-base text-[#39FF14]"></i>
                  <span>Verify SHA-256 Checksum</span>
                </span>
                <i className={`fa-solid ${showVerifier ? 'fa-chevron-up' : 'fa-chevron-down'} text-xs text-[#7E927F]`}></i>
              </button>

              {showVerifier && (
                <div className="p-6 border-t border-[#243022] flex flex-col gap-4 bg-[#08080A]">
                  <input
                    type="text"
                    value={verifyHashInput}
                    onChange={(e) => setVerifyHashInput(e.target.value)}
                    placeholder="Paste SHA-256 checksum to test match against official release..."
                    className="w-full bg-[#0E120D] border border-[#243022] rounded-xl p-4 font-mono text-sm text-white focus:outline-none focus:border-[#22C55E] transition-colors"
                  />

                  {verifyHashInput.trim() && (
                    <div>
                      {matchingDownload ? (
                        <div className="p-4 rounded-xl bg-[#22C55E]/10 border border-[#22C55E]/40 flex items-center gap-3 text-sm font-mono text-[#39FF14]">
                          <i className="fa-solid fa-circle-check text-lg"></i>
                          <span><strong>CHECKSUM VERIFIED:</strong> Matches official release <strong>{matchingDownload.filename}</strong></span>
                        </div>
                      ) : (
                        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/40 flex items-center gap-3 text-sm font-mono text-red-400">
                          <i className="fa-solid fa-triangle-exclamation text-lg"></i>
                          <span><strong>NO MATCH FOUND:</strong> Checksum does not match official release artifacts.</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </BentoCard>

            {/* Release History Archive Bento Card */}
            <BentoCard hover={false} className="p-0 overflow-hidden">
              <button
                onClick={() => setShowArchive(!showArchive)}
                className="w-full p-6 flex items-center justify-between text-sm font-mono font-bold uppercase text-[#4ADE80] hover:text-white bg-[#0E120D] transition-colors cursor-pointer select-none"
              >
                <span className="flex items-center gap-2.5">
                  <i className="fa-solid fa-clock-rotate-left text-base text-[#22C55E]"></i>
                  <span>Release Archive &amp; Older Versions</span>
                </span>
                <i className={`fa-solid ${showArchive ? 'fa-chevron-up' : 'fa-chevron-down'} text-xs text-[#7E927F]`}></i>
              </button>

              {showArchive && (
                <div className="p-6 border-t border-[#243022] flex flex-col gap-4 bg-[#08080A]">
                  {availableVersions && availableVersions.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-mono text-[#7E927F] mr-1">Filter by Version:</span>
                      {availableVersions.map((v) => (
                        <button
                          key={v}
                          onClick={() => selectReleaseByVersion(v)}
                          className={`px-3.5 py-1.5 rounded-lg font-mono text-xs md:text-sm uppercase cursor-pointer transition-all ${
                            (selectedVersion || latestClientVersion) === v
                              ? 'bg-[#22C55E] text-black font-bold'
                              : 'bg-[#141C13] text-gray-300 hover:text-white hover:bg-[#1A2419] border border-[#243022]'
                          }`}
                        >
                          v{v}
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="flex flex-col gap-2 max-h-60 overflow-y-auto">
                    {olderDownloads.length > 0 ? (
                      olderDownloads.map((dl) => (
                        <div
                          key={dl.filename}
                          className="flex items-center justify-between p-3.5 rounded-xl bg-[#0E120D] border border-[#243022] text-xs md:text-sm font-mono"
                        >
                          <div className="flex items-center gap-3 truncate">
                            <span className="text-[#39FF14] font-bold">v{dl.version}{dl.build_number ? ` (b${dl.build_number})` : ''}</span>
                            <span className="text-gray-200 truncate">{dl.filename}</span>
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            <span className="text-[#7E927F] text-xs">{dl.size}</span>
                            <button
                              onClick={() => triggerDownload(dl)}
                              className="px-3.5 py-1 border border-[#22C55E] text-[#39FF14] hover:bg-[#22C55E] hover:text-black rounded-lg text-xs font-bold uppercase transition-all cursor-pointer"
                            >
                              GET
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-xs md:text-sm font-mono text-[#7E927F] text-center py-3">
                        No older releases archived.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </BentoCard>

          </div>
        </div>
      )}

    </div>
  );
}
