import { useEffect, useRef, useState, ChangeEvent } from 'react';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Radio, 
  Music, 
  Clock, 
  ChevronRight, 
  Volume1, 
  Maximize2, 
  SkipForward, 
  Sparkles,
  Wifi,
  HelpCircle,
  Clock3,
  Share2,
  Check
} from 'lucide-react';

interface Track {
  title: string;
  artist: string;
  cover: string;
  file: string;
  duration: number;
}
export default function App() {
  const [playlist, setPlaylist] = useState<Track[]>([]);
  const [currentTrackIndex, setCurrentTrackIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [volume, setVolume] = useState<number>(0.8);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [showJoinButton, setShowJoinButton] = useState<boolean>(true);
  const [digitalTime, setDigitalTime] = useState<string>('');
  const [totalPlaylistTime, setTotalPlaylistTime] = useState<string>('');
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);
  const [displayTrackIndex, setDisplayTrackIndex] = useState<number>(0);
  const [isFading, setIsFading] = useState<boolean>(false);
  const [isFirstLoad, setIsFirstLoad] = useState<boolean>(true);

  useEffect(() => {
    if (playlist.length === 0) return;
    
    if (isFirstLoad) {
      setDisplayTrackIndex(currentTrackIndex);
      setIsFirstLoad(false);
      return;
    }
    
    setIsFading(true);
    const timeout = setTimeout(() => {
      setDisplayTrackIndex(currentTrackIndex);
      setIsFading(false);
    }, 400);
    
    return () => clearTimeout(timeout);
  }, [currentTrackIndex, playlist.length]);

  const handleShare = async () => {
    const shareData = {
      title: 'NewRadioProject v1.0',
      text: 'Sen de katıl!',
      url: window.location.href,
    };

    if (navigator.share && typeof navigator.share === 'function') {
      try {
        await navigator.share(shareData);
        return;
      } catch (err) {
        console.warn('Sistem paylaşımı başarısız veya iptal edildi, kopyalamaya geçiliyor:', err);
      }
    }

    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Kopyalama hatası:', err);
    }
  };

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const isAudioConnectedRef = useRef<boolean>(false);
  const pendingOffsetRef = useRef<number | null>(null);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
      audioRef.current.muted = isMuted;
    }
  }, [volume, isMuted]);

  useEffect(() => {
    const loadPlaylist = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(import.meta.env.BASE_URL + 'playlist.json');
        if (!response.ok) {
          throw new Error('Playlist dosyası okunamadı.');
        }
        const data: Track[] = await response.json();
        setPlaylist(data);

        const totalSec = data.reduce((sum, track) => sum + track.duration, 0);
        const min = Math.floor(totalSec / 60);
        const sec = totalSec % 60;
        setTotalPlaylistTime(`${min} dk ${sec > 0 ? sec + ' sn' : ''}`);
      } catch (err) {
        console.error('Playlist yükleme hatası:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadPlaylist();
  }, []);

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const hrs = String(now.getHours()).padStart(2, '0');
      const mins = String(now.getMinutes()).padStart(2, '0');
      const secs = String(now.getSeconds()).padStart(2, '0');
      setDigitalTime(`${hrs}:${mins}:${secs}`);
    };

    updateClock();
    const clockInterval = setInterval(updateClock, 1000);
    return () => clearInterval(clockInterval);
  }, []);

  const getGlobalSyncPosition = (tracks: Track[]) => {
    if (tracks.length === 0) return { index: 0, offset: 0 };

    const totalDuration = tracks.reduce((sum, t) => sum + t.duration, 0);
    const now = new Date();
    
    const utcMidnight = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
    const secondsSinceMidnight = (now.getTime() - utcMidnight.getTime()) / 1000;

    const currentOffset = secondsSinceMidnight % totalDuration;

    let accumulatedTime = 0;
    for (let i = 0; i < tracks.length; i++) {
      const trackDuration = tracks[i].duration;
      if (currentOffset >= accumulatedTime && currentOffset < accumulatedTime + trackDuration) {
        return {
          index: i,
          offset: currentOffset - accumulatedTime
        };
      }
      accumulatedTime += trackDuration;
    }

    return { index: 0, offset: 0 };
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current && pendingOffsetRef.current !== null) {
      try {
        audioRef.current.currentTime = pendingOffsetRef.current;
        pendingOffsetRef.current = null;
      } catch (err) {
        console.warn('onLoadedMetadata içinde currentTime ayarlanamadı:', err);
      }
    }
  };

  const handleCanPlay = () => {
    if (audioRef.current && pendingOffsetRef.current !== null) {
      try {
        audioRef.current.currentTime = pendingOffsetRef.current;
        pendingOffsetRef.current = null;
      } catch (err) {
        console.warn('onCanPlay içinde currentTime ayarlanamadı:', err);
      }
    }
  };

  const syncWithLiveBroadcast = () => {
    if (!audioRef.current || playlist.length === 0) return;

    const { index, offset } = getGlobalSyncPosition(playlist);
    
    const targetSrc = playlist[index].file;
    const absoluteTargetSrc = targetSrc.startsWith('http') ? targetSrc : import.meta.env.BASE_URL + targetSrc;
    const currentSrcPath = audioRef.current.src;
    
    if (currentTrackIndex !== index || !currentSrcPath.endsWith(targetSrc)) {
      setCurrentTrackIndex(index);
      audioRef.current.src = absoluteTargetSrc;
      audioRef.current.load();
      pendingOffsetRef.current = offset;
      
      if (isPlaying) {
        audioRef.current.play()
          .then(() => {
            if (audioRef.current) {
              audioRef.current.currentTime = offset;
              pendingOffsetRef.current = null;
            }
          })
          .catch((err) => console.warn('Şarkı değişimi sonrası oynatılamadı:', err));
      }
    } else {
      const diff = Math.abs(audioRef.current.currentTime - offset);
      if (diff > 1.5) {
        try {
          audioRef.current.currentTime = offset;
          pendingOffsetRef.current = null;
        } catch (err) {
          console.warn('currentTime hemen ayarlanamadı, onLoadedMetadata/onCanPlay ile ayarlanacak:', err);
          pendingOffsetRef.current = offset;
        }
      }
    }
  };

  useEffect(() => {
    if (playlist.length === 0) return;
    
    syncWithLiveBroadcast();

    const syncInterval = setInterval(() => {
      if (isPlaying) {
        const { index, offset } = getGlobalSyncPosition(playlist);
        if (currentTrackIndex === index && audioRef.current) {
          const diff = Math.abs(audioRef.current.currentTime - offset);
          if (diff > 2) {
            try {
              audioRef.current.currentTime = offset;
            } catch (err) {
              console.warn('Interval sync sırasında currentTime ayarlanamadı:', err);
            }
          }
        } else {
          syncWithLiveBroadcast();
        }
      }
    }, 15000);

    return () => clearInterval(syncInterval);
  }, [playlist]);

  const initVisualizer = () => {
    if (!audioRef.current || isAudioConnectedRef.current) return;

    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;

      const ctx = new AudioContextClass();
      audioContextRef.current = ctx;

      const analyser = ctx.createAnalyser();
      analyser.fftSize = 128;
      analyserRef.current = analyser;

      const source = ctx.createMediaElementSource(audioRef.current);
      source.connect(analyser);
      analyser.connect(ctx.destination);

      sourceRef.current = source;
      isAudioConnectedRef.current = true;
    } catch (err) {
      console.warn('AudioContext ilk tık işleminden önce başlatılamadı:', err);
    }
  };

  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.scale(dpr, dpr);

    const draw = () => {
      animationFrameRef.current = requestAnimationFrame(draw);
      
      const width = rect.width;
      const height = rect.height;
      ctx.clearRect(0, 0, width, height);

      let dataArray = new Uint8Array(64);
      let isAnalyserActive = false;
      
      if (analyserRef.current && isPlaying) {
        dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(dataArray);
        const maxVal = Math.max(...Array.from(dataArray));
        if (maxVal > 0) {
          isAnalyserActive = true;
        }
      }

      ctx.lineWidth = 2.5;
      ctx.strokeStyle = '#ffffff';
      ctx.shadowBlur = 0;
      ctx.beginPath();

      const sliceWidth = width / 32;
      let x = 0;

      for (let i = 0; i < 32; i++) {
        let amplitude = 0;
        if (isPlaying) {
          if (isAnalyserActive) {
            amplitude = dataArray[i] / 255;
          } else {
            const time = Date.now() * 0.005;
            const wave1 = Math.sin(time + i * 0.15) * 0.35;
            const wave2 = Math.cos(time * 0.7 + i * 0.25) * 0.25;
            const wave3 = Math.sin(time * 1.4 + i * 0.08) * 0.15;
            const frequencyWeight = Math.sin((i / 31) * Math.PI) * 0.6 + 0.4;
            
            amplitude = Math.abs(wave1 + wave2 + wave3) * frequencyWeight * 0.8 + 0.04;
            amplitude += (Math.random() * 0.02);
            amplitude = Math.min(Math.max(amplitude, 0.02), 0.95);
          }
        } else {
          amplitude = Math.sin(Date.now() * 0.002 + i * 0.2) * 0.04 + 0.04;
        }

        const yOffset = amplitude * (height * 0.75);
        const y = height / 2 - yOffset;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }

        x += sliceWidth;
      }
      
      for (let i = 31; i >= 0; i--) {
        let amplitude = 0;
        if (isPlaying) {
          if (isAnalyserActive) {
            amplitude = dataArray[i] / 255;
          } else {
            const time = Date.now() * 0.005;
            const wave1 = Math.sin(time + i * 0.15) * 0.35;
            const wave2 = Math.cos(time * 0.7 + i * 0.25) * 0.25;
            const wave3 = Math.sin(time * 1.4 + i * 0.08) * 0.15;
            const frequencyWeight = Math.sin((i / 31) * Math.PI) * 0.6 + 0.4;
            
            amplitude = Math.abs(wave1 + wave2 + wave3) * frequencyWeight * 0.8 + 0.04;
            amplitude += (Math.random() * 0.02);
            amplitude = Math.min(Math.max(amplitude, 0.02), 0.95);
          }
        } else {
          amplitude = Math.sin(Date.now() * 0.002 + i * 0.2) * 0.04 + 0.04;
        }

        const yOffset = amplitude * (height * 0.75);
        const yMirror = height / 2 + yOffset;
        ctx.lineTo(x, yMirror);
        x -= sliceWidth;
      }

      ctx.closePath();
      
      const fillGradient = ctx.createLinearGradient(0, 0, 0, height);
      fillGradient.addColorStop(0, 'rgba(255, 255, 255, 0.02)');
      fillGradient.addColorStop(1, 'rgba(255, 255, 255, 0.05)');
      ctx.fillStyle = fillGradient;
      ctx.fill();

      ctx.stroke();
    };

    draw();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying]);

  const handlePlay = async () => {
    if (!audioRef.current || playlist.length === 0) return;

    initVisualizer();

    if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
      await audioContextRef.current.resume();
    }

    syncWithLiveBroadcast();

    try {
      await audioRef.current.play();
      setIsPlaying(true);
      setShowJoinButton(false);
      
      const { offset } = getGlobalSyncPosition(playlist);
      audioRef.current.currentTime = offset;
      pendingOffsetRef.current = null;
    } catch (err) {
      console.warn('Otomatik oynatma engellendi, kurtarma mekanizması deneniyor:', err);
      try {
        const { index, offset } = getGlobalSyncPosition(playlist);
        setCurrentTrackIndex(index);
        const retrySrc = playlist[index].file;
        const absoluteRetrySrc = retrySrc.startsWith('http') ? retrySrc : import.meta.env.BASE_URL + retrySrc;
        audioRef.current.src = absoluteRetrySrc;
        audioRef.current.load();
        await audioRef.current.play();
        audioRef.current.currentTime = offset;
        setIsPlaying(true);
        setShowJoinButton(false);
        pendingOffsetRef.current = null;
      } catch (retryErr) {
        console.error('Oynatma tamamen başarısız oldu:', retryErr);
        setShowJoinButton(true);
      }
    }
  };

  const handlePause = () => {
    if (!audioRef.current) return;
    audioRef.current.pause();
    setIsPlaying(false);
  };

  const handleVolumeChange = (e: ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (audioRef.current) {
      audioRef.current.volume = val;
    }
    if (val > 0) {
      setIsMuted(false);
    }
  };

  const handleToggleMute = () => {
    if (!audioRef.current) return;
    const targetMute = !isMuted;
    setIsMuted(targetMute);
    audioRef.current.muted = targetMute;
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'BUTTON'].includes((e.target as HTMLElement).tagName)) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        if (isPlaying) {
          handlePause();
        } else {
          handlePlay();
        }
      } else if (e.code === 'KeyM') {
        e.preventDefault();
        handleToggleMute();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, isMuted, playlist]);

  const handleTimeUpdate = () => {
    if (!audioRef.current) return;
    setCurrentTime(audioRef.current.currentTime);
  };

  const handleTrackEnded = () => {
    syncWithLiveBroadcast();
    if (audioRef.current) {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch(err => {
        console.error('Şarkı sonu geçiş hatası:', err);
      });
    }
  };

  const currentTrack = playlist[currentTrackIndex];
  const displayTrack = playlist[displayTrackIndex];
  const nextTrackIndex = (currentTrackIndex + 1) % playlist.length;
  const nextTrack = playlist[nextTrackIndex];

  const formatTime = (time: number) => {
    if (isNaN(time)) return '00:00';
    const min = Math.floor(time / 60);
    const sec = Math.floor(time % 60);
    return `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  const progressPercent = currentTrack ? (currentTime / currentTrack.duration) * 100 : 0;

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-center overflow-hidden font-sans bg-black text-white">
      
      {/* --- ARKA PLAN EFEKTLERİ --- */}
      {/* Grid deseni bindirmesi */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.1) 1px, transparent 1px)`,
          backgroundSize: '40px 40px'
        }}
      />

      {/* --- ANA RADYO PANELİ --- */}
      {isLoading ? (
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 rounded-full animate-spin border-t-white border-r-transparent border-b-neutral-800 border-l-transparent" />
          <p className="font-mono tracking-wider animate-pulse text-xs text-neutral-400">Müzik listesi yükleniyor...</p>
        </div>
      ) : (
        <div className="z-10 w-full max-w-4xl px-4 flex flex-col items-center">
          
          {/* Üst Logo ve Dijital Saat Alanı */}
          <div className="w-full flex flex-col gap-3 mb-5 px-1">
            <div className="w-full flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 bg-red-400"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                </div>
                <span className="text-xs font-mono font-semibold tracking-wide animate-pulse text-white">
                  Canlı Yayın
                </span>
              </div>

              <div className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-neutral-950 border border-neutral-800 text-neutral-300">
                <Clock className="w-3.5 h-3.5 text-white" />
                <span className="font-mono font-semibold tracking-wider text-xs">
                  {digitalTime}
                </span>
              </div>
            </div>
          </div>

          {/* Merkez Radyo Kartı */}
          <div 
            id="radio-card"
            className="w-full rounded-2xl p-6 md:p-8 flex flex-col relative overflow-hidden transition-all duration-500 bg-[#0a0a0a] border border-neutral-800 hover:border-neutral-700"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            {/* Kart Üst Bilgisi: Dinleyici Sayısı & Paylaş Butonu */}
            <div className="w-full flex justify-between items-center mb-6">
              <div className="flex items-center gap-1.5 text-[11px] text-neutral-400 font-mono tracking-wide">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 bg-emerald-400"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-white font-semibold">Çevrimiçi</span>
              </div>

              {/* Paylaş Butonu */}
              <button
                id="share-button"
                onClick={handleShare}
                className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded border text-xs font-medium font-sans transition-all duration-300 ${
                  copied 
                    ? 'bg-neutral-800 border-neutral-600 text-white'
                    : 'bg-neutral-900 border-neutral-800 text-neutral-300 hover:text-white hover:bg-neutral-800 hover:border-neutral-700'
                }`}
                title="Paylaş"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 animate-pulse text-white" />
                    <span>Kopyalandı</span>
                  </>
                ) : (
                  <>
                    <Share2 className="w-3.5 h-3.5 text-white" />
                    <span>Paylaş</span>
                  </>
                )}
              </button>
            </div>

            {/* Yatay Format Düzeni (Responsive grid/flex) */}
            <div className="flex flex-col md:flex-row gap-8 items-center md:items-start w-full">
              
              {/* Sol Taraf: Albüm Kapağı Alanı */}
              <div className="relative w-60 h-60 md:w-64 md:h-64 flex-shrink-0 group">
                {/* Gerçek Resim Kartı */}
                <div className={`absolute inset-0 rounded-2xl overflow-hidden border shadow-2xl transition-all duration-300 group-hover:scale-[1.02] border-neutral-800 bg-neutral-950 ${
                  isFading ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
                }`}>
                  {displayTrack ? (
                    <img 
                      src={import.meta.env.BASE_URL + displayTrack.cover} 
                      alt={displayTrack.title}
                      referrerPolicy="no-referrer"
                      className={`w-full h-full object-cover transition-transform duration-[10000ms] ease-out ${
                        isPlaying ? 'scale-110 rotate-1' : 'scale-100'
                      }`}
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-500">
                      <Music className="w-12 h-12 mb-2 animate-bounce" />
                      <span className="text-xs">Görsel Yüklenemedi</span>
                    </div>
                  )}

                  {/* Cam Oynatma Göstergesi Bindirmesi */}
                  <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-300">
                    <div className="p-4 rounded-full bg-white/10 border border-white/20 backdrop-blur-md">
                      {isPlaying ? (
                        <Pause className="w-8 h-8 text-white fill-white cursor-pointer" onClick={handlePause} />
                      ) : (
                        <Play className="w-8 h-8 text-white fill-white translate-x-0.5 cursor-pointer" onClick={handlePlay} />
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Sağ Taraf: Şarkı Bilgileri, Ekolayzer, İlerleme ve Kontroller */}
              <div className="flex-1 w-full flex flex-col justify-between self-stretch">
                
                {/* Şarkı ve Sanatçı Bilgileri */}
                <div className={`w-full text-center md:text-left mb-4 transition-all duration-300 ${
                  isFading ? 'opacity-0 translate-y-1' : 'opacity-100 translate-y-0'
                }`}>
                  <h2 className="text-xl md:text-2xl font-bold tracking-tight mb-1 leading-snug line-clamp-1 truncate text-white font-sans">
                    {displayTrack?.title || 'Bilinmeyen Şarkı'}
                  </h2>
                  <p className="text-sm font-sans font-medium line-clamp-1 truncate text-center md:text-left text-neutral-400">
                    {displayTrack?.artist || 'Bilinmeyen Sanatçı'}
                  </p>
                </div>

                {/* Kanvas Ses Görselleştirici */}
                <div className="w-full h-12 mb-4 rounded-xl overflow-hidden transition-all border bg-neutral-950 border-neutral-900">
                  <canvas 
                    ref={canvasRef} 
                    className="w-full h-full block" 
                  />
                </div>

                {/* İlerleme Çubuğu (Progress Bar) */}
                <div className="w-full flex flex-col gap-1 mb-5">
                  <div className="w-full h-1.5 rounded-full overflow-hidden relative bg-neutral-800">
                    {/* Oynatma İlerlemesi */}
                    <div 
                      className="h-full rounded-full transition-all duration-300 ease-out bg-white"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                  <div className="flex justify-between items-center text-[11px] font-mono text-neutral-400">
                    <span>{formatTime(currentTime)}</span>
                    <span className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full animate-pulse bg-white"></span>
                      Canlı
                      <span className="text-neutral-700">|</span>
                      {currentTrack ? formatTime(currentTrack.duration) : '00:00'}
                    </span>
                  </div>
                </div>

                {/* Kontroller (Oynat, Durdur, Ses Seviyesi) */}
                <div className="w-full flex items-center justify-between gap-4">
                  
                  {/* Sol: Ses Kapat/Aç Düğmesi */}
                  <button 
                    id="mute-button"
                    onClick={handleToggleMute}
                    className="p-3.5 rounded-full border border-neutral-850 bg-neutral-950 text-neutral-400 hover:text-white hover:border-neutral-500 hover:bg-neutral-900 transition-all duration-200 active:scale-95"
                    title={isMuted ? 'Sesi Aç (M)' : 'Sesi Kapat (M)'}
                  >
                    {isMuted ? (
                      <VolumeX className="w-5 h-5 text-red-500" />
                    ) : volume < 0.3 ? (
                      <Volume1 className="w-5 h-5" />
                    ) : (
                      <Volume2 className="w-5 h-5" />
                    )}
                  </button>

                  {/* Merkez: Oynat / Durdur Düğmesi */}
                  <button 
                    id="play-button"
                    onClick={isPlaying ? handlePause : handlePlay}
                    className="flex items-center justify-center p-5 rounded-full border-2 border-white bg-white text-black hover:bg-transparent hover:text-white transition-all duration-300 transform active:scale-95"
                    title={isPlaying ? 'Durdur (Space)' : 'Yayına Katıl (Space)'}
                  >
                    {isPlaying ? (
                      <Pause className="w-6 h-6 fill-current" />
                    ) : (
                      <Play className="w-6 h-6 fill-current translate-x-0.5" />
                    )}
                  </button>

                  {/* Sağ: Ses Seviyesi Sürgüsü */}
                  <div className="flex items-center gap-2 px-4 py-3.5 rounded-full border border-neutral-850 bg-neutral-950 w-28 transition-all hover:border-neutral-750">
                    <input 
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={volume}
                      onChange={handleVolumeChange}
                      className="w-full h-1 appearance-none cursor-pointer focus:outline-none bg-neutral-800 accent-white"
                      title="Ses Seviyesi"
                    />
                  </div>
                </div>

              </div>
            </div>

          </div>

        </div>
      )}

      {/* --- BLOKE EDİLMİŞ OYNATMA (AUTOPLAY BLOCK) OVERLAY DÜĞMESİ --- */}
      {showJoinButton && !isLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black">
          <button 
            id="join-stream-button"
            onClick={handlePlay}
            className="px-8 py-4 rounded-full text-base font-semibold transition-all duration-300 flex items-center gap-3 bg-white text-black border-2 border-white hover:bg-transparent hover:text-white"
          >
            <Wifi className="w-5 h-5 animate-pulse" />
            Yayına Katıl
          </button>
        </div>
      )}

      {/* Gizli HTML5 Audio Elementi */}
      <audio 
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleTrackEnded}
        onLoadedMetadata={handleLoadedMetadata}
        onCanPlay={handleCanPlay}
        preload="auto"
      />

    </div>
  );
}
