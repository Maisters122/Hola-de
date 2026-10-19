/**
 * MainMenuDashboard.tsx
 * Ultra-Modern 2026 Esports Racing Operations Dashboard for Apex GT.
 * Inspired by Gran Turismo 7 & Formula 1 luxury motorsport editorial design.
 * 
 * Features:
 * - Screen 2 (Root View): 2x3 Panoramic Cards with zero scroll (Career, Garage, Free, School, Multiplayer, Grand Prix)
 * - Screen 3 (Paddock & Preparation Command Center):
 *   - Custom user-uploaded background image (/images/screen3_bg.png) with dark vignette
 *   - Zero-scroll layout (h-screen max-h-screen overflow-hidden flex flex-col justify-between)
 *   - 6 Custom Image Selector Buttons styled like GT7 cards (Circuits, Tires, Laps, AI Difficulty, Livery/Team, Assists/Setup)
 *   - High-fidelity superimposed modal overlays for selecting each configuration element seamlessly
 *   - Master Launch CTA button with audio feedback
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Trophy,
  Timer,
  Users,
  Flag,
  Play,
  ArrowLeft,
  Check,
  Copy,
  Zap,
  Compass,
  HelpCircle,
  AlertCircle,
  Sparkles,
  ChevronRight,
  Sliders,
  CheckCircle2,
  Palette,
  Shield,
  Maximize2,
  Minimize2,
  Eye,
  Activity,
  Flame,
  Wind,
  Thermometer,
  Gauge,
  CircleDot,
  Radio,
  Layers,
  ChevronDown,
  GraduationCap,
  Globe,
  Car,
  Coins,
  X,
  Settings,
  Disc,
  Clock,
  Swords,
  User,
} from 'lucide-react';
import { CameraDistanceMode, CameraViewMode } from '../game/RacingGameEngine';
import { MultiplayerRoomState } from '../game/multiplayer/MultiplayerClient';
import { RaceDifficulty, RaceLapOption, CustomLiverySettings, CareerSeasonState, saveLivery } from '../game/career/CareerTypes';
import { TireCompoundType } from '../game/physics/TireCompound';
import { playUiClick, playUiHover, playModeSelectChime } from '../utils/uiAudio';
import { CircuitId } from '../game/circuits/ICircuit';
import { AVAILABLE_CIRCUITS } from '../game/circuits/CircuitRegistry';

export interface MainMenuDashboardProps {
  onStartSolo: (
    cameraDistance: CameraDistanceMode,
    cameraMode: CameraViewMode,
    laps: RaceLapOption,
    difficulty: RaceDifficulty,
    startingCompound: TireCompoundType,
    circuitId?: CircuitId
  ) => void;
  onStartCareerMode?: (
    cameraDistance: CameraDistanceMode,
    cameraMode: CameraViewMode,
    laps: RaceLapOption,
    difficulty: RaceDifficulty,
    startingCompound: TireCompoundType,
    circuitId?: CircuitId
  ) => void;
  onOpenLiveryStudio?: () => void;
  customLivery?: CustomLiverySettings;
  careerSeason?: CareerSeasonState;
  onResetCareerSeason?: () => void;
  onStartFreePractice?: (
    cameraDistance: CameraDistanceMode,
    cameraMode: CameraViewMode,
    startingCompound: TireCompoundType,
    circuitId?: CircuitId
  ) => void;
  selectedCircuit?: CircuitId;
  onSelectCircuit?: (circuitId: CircuitId) => void;
  onCreateRoom: (options: {
    playerName: string;
    laps: number;
    car1Name: string;
    car2Name: string;
    crewName: string;
    cameraDistance: CameraDistanceMode;
    cameraMode: CameraViewMode;
  }) => Promise<void>;
  onJoinRoom: (code: string, playerName: string, cameraDistance: CameraDistanceMode, cameraMode: CameraViewMode) => Promise<void>;
  onStartMultiplayerRace: () => void;
  onSetReady: (isReady: boolean) => void;
  onLeaveRoom: () => void;
  onBackToTitle: () => void;
  roomState: MultiplayerRoomState | null;
  playerId: 'p1' | 'p2' | null;
  isConnecting: boolean;
  errorMessage: string | null;
  onStartFreeCamera?: (circuitId?: CircuitId) => void;
  // Deprecated stubs
  onOpenModelUpload?: (target: 'car1' | 'car2' | 'crew') => void;
  car1Name?: string;
  car2Name?: string;
  crewName?: string;
}

export type MenuDedicatedScreen = 'root' | 'career' | 'free' | 'multiplayer' | 'grand_prix';
export type Screen3Overlay = 'none' | 'tires' | 'circuit' | 'laps' | 'difficulty' | 'setup' | 'livery' | 'multiplayer_modal';

export const MainMenuDashboard: React.FC<MainMenuDashboardProps> = ({
  onStartSolo,
  onStartCareerMode,
  onOpenLiveryStudio,
  customLivery,
  careerSeason,
  onStartFreePractice,
  selectedCircuit: initialCircuit,
  onSelectCircuit,
  onCreateRoom,
  onJoinRoom,
  onStartMultiplayerRace,
  onSetReady,
  onLeaveRoom,
  onBackToTitle,
  roomState,
  playerId,
  isConnecting,
  errorMessage,
  onStartFreeCamera,
}) => {
  // Navigation State: 'root' (Screen 2 Mode Selection) or dedicated mode screen (Screen 3)
  const [activeScreen, setActiveScreen] = useState<MenuDedicatedScreen>('root');

  // Sequential Screen Transition State (Fade-Out completely, then Fade-In next screen: Zero ghosting)
  const [visibleScreen, setVisibleScreen] = useState<'root' | 'mode'>('root');
  const [screenOpacity, setScreenOpacity] = useState<number>(1);
  const [screenScale, setScreenScale] = useState<number>(1);
  const [transitionTiming, setTransitionTiming] = useState<string>(
    'opacity 340ms cubic-bezier(0, 0, 0.2, 1), transform 340ms cubic-bezier(0, 0, 0.2, 1)'
  );
  const [isTransitioning, setIsTransitioning] = useState<boolean>(false);
  const transitionTimerRef = useRef<NodeJS.Timeout | null>(null);
  const rafRef = useRef<number | null>(null);

  // Clean up animation frames and timers on unmount
  useEffect(() => {
    return () => {
      if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // Selected Circuit
  const [selectedCircuit, setSelectedCircuit] = useState<CircuitId>(initialCircuit || 'square_apex');

  // Racing Parameters
  const [laps, setLaps] = useState<RaceLapOption>(9);
  const [difficulty, setDifficulty] = useState<RaceDifficulty>('medium');
  const [startingCompound, setStartingCompound] = useState<TireCompoundType>('soft');

  // Camera Settings
  const [cameraDistance, setCameraDistance] = useState<CameraDistanceMode>('medium');
  const [cameraMode, setCameraMode] = useState<CameraViewMode>('chase');

  // Driving Assists
  const [tractionControl, setTractionControl] = useState<boolean>(true);
  const [absEnabled, setAbsEnabled] = useState<boolean>(true);
  const [racingLine, setRacingLine] = useState<boolean>(true);

  // Multiplayer Form State
  const [mpTab, setMpTab] = useState<'create' | 'join'>('create');
  const [playerName, setPlayerName] = useState<string>(customLivery?.driverName || 'PILOTO APEX');
  const [joinCodeInput, setJoinCodeInput] = useState<string>('');
  const [mpLaps, setMpLaps] = useState<number>(3);
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [isReady, setIsReady] = useState<boolean>(false);

  // Controls Guide Modal
  const [showControlsModal, setShowControlsModal] = useState<boolean>(false);

  // GT7 Style Active Card Index on Screen 2
  const [selectedCardIndex, setSelectedCardIndex] = useState<number>(0);

  // Screen 3: Superimposed Modal Overlays
  const [activeOverlay, setActiveOverlay] = useState<Screen3Overlay>('none');
  const [teamName, setTeamName] = useState<string>(customLivery?.teamName || 'Oracle Red Bull Racing');
  const [carNumber, setCarNumber] = useState<string>(customLivery?.driverNumber || '1');
  const [driverDisplayName, setDriverDisplayName] = useState<string>(customLivery?.driverName || 'M. Verstappen');
  const [driverCode, setDriverCode] = useState<string>(customLivery?.driverCode || 'VER');
  const [primaryColor, setPrimaryColor] = useState<string>(customLivery?.primaryColor || '#040814');
  const [secondaryColor, setSecondaryColor] = useState<string>(customLivery?.secondaryColor || '#cc0022');
  const [accentColor, setAccentColor] = useState<string>(customLivery?.accentColor || '#fec008');

  // Live Digital Clock & Date
  const [currentTime, setCurrentTime] = useState<string>(() => {
    const d = new Date();
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  });
  const [currentDateStr, setCurrentDateStr] = useState<string>(() => {
    const d = new Date();
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    return `${d.getDate()} ${months[d.getMonth()]}`;
  });

  useEffect(() => {
    const timer = setInterval(() => {
      const d = new Date();
      setCurrentTime(`${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`);
      const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
      setCurrentDateStr(`${d.getDate()} ${months[d.getMonth()]}`);
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  // Preload critical backgrounds and card assets for instant, zero-delay screen transitions
  useEffect(() => {
    const assetsToPreload = [
      '/images/dashboard_bg.webp',
      '/images/screen3_bg.png',
      '/images/cards/btn_circuit.jpg',
      '/images/cards/btn_tire.jpg',
      '/images/cards/btn_laps.jpg',
      '/images/cards/btn_helmet.jpg',
      '/images/cards/btn_livery.jpg',
      '/images/cards/btn_sponsors.jpg',
      '/images/cards/card_career.jpg',
      '/images/cards/card_free.jpg',
      '/images/cards/card_multiplayer.jpg',
      '/images/cards/card_grandprix.jpg',
    ];
    assetsToPreload.forEach((src) => {
      const img = new Image();
      img.src = src;
    });
  }, []);

  // Fullscreen State
  const [isFullscreen, setIsFullscreen] = useState<boolean>(() => {
    return typeof document !== 'undefined' ? !!document.fullscreenElement : false;
  });

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'f' || e.key === 'F') {
        toggleFullscreen();
      }
      if (e.key === 'Escape' && activeOverlay !== 'none') {
        setActiveOverlay('none');
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeOverlay]);

  const toggleFullscreen = () => {
    playUiClick(750);
    try {
      if (!document.fullscreenElement) {
        const root = document.documentElement;
        if (root.requestFullscreen) {
          root.requestFullscreen().catch(() => {});
        } else if ((root as unknown as { webkitRequestFullscreen?: () => void }).webkitRequestFullscreen) {
          (root as unknown as { webkitRequestFullscreen: () => void }).webkitRequestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen().catch(() => {});
        } else if ((document as unknown as { webkitExitFullscreen?: () => void }).webkitExitFullscreen) {
          (document as unknown as { webkitExitFullscreen: () => void }).webkitExitFullscreen();
        }
      }
    } catch {}
  };

  const handleSelectCircuitLocal = (id: CircuitId) => {
    playUiClick(650);
    setSelectedCircuit(id);
    onSelectCircuit?.(id);
  };

  const handleNavigateToScreen = (screen: MenuDedicatedScreen) => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    playModeSelectChime();

    // FASE 1: Desvanecer suavemente la pantalla actual al 0% (fondo y botones juntos)
    setTransitionTiming('opacity 280ms cubic-bezier(0.4, 0, 0.2, 1), transform 280ms cubic-bezier(0.4, 0, 0.2, 1)');
    setScreenOpacity(0);
    setScreenScale(0.97);

    if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    transitionTimerRef.current = setTimeout(() => {
      // Pantalla anterior completamente fuera (0% opacidad). Sin solapamiento transparente.
      setActiveScreen(screen);
      setVisibleScreen('mode');
      setTransitionTiming('none');
      setScreenOpacity(0);
      setScreenScale(1.02);

      // FASE 2: Emerge progresivamente la nueva pantalla (fondo y botones a la vez)
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = requestAnimationFrame(() => {
          setTransitionTiming('opacity 340ms cubic-bezier(0, 0, 0.2, 1), transform 340ms cubic-bezier(0, 0, 0.2, 1)');
          setScreenOpacity(1);
          setScreenScale(1);

          transitionTimerRef.current = setTimeout(() => {
            setIsTransitioning(false);
          }, 350);
        });
      });
    }, 280);
  };

  const handleBackToGrid = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    playUiClick(700);
    setActiveOverlay('none');

    // FASE 1: Desvanecer suavemente la pantalla 3 al 0% (fondo y botones juntos)
    setTransitionTiming('opacity 280ms cubic-bezier(0.4, 0, 0.2, 1), transform 280ms cubic-bezier(0.4, 0, 0.2, 1)');
    setScreenOpacity(0);
    setScreenScale(0.97);

    if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    transitionTimerRef.current = setTimeout(() => {
      // Pantalla 3 completamente fuera. Se conmuta sin solapamiento transparente.
      setActiveScreen('root');
      setVisibleScreen('root');
      setTransitionTiming('none');
      setScreenOpacity(0);
      setScreenScale(1.02);

      // FASE 2: Emerge progresivamente la Pantalla 2 (fondo y botones a la vez)
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = requestAnimationFrame(() => {
          setTransitionTiming('opacity 340ms cubic-bezier(0, 0, 0.2, 1), transform 340ms cubic-bezier(0, 0, 0.2, 1)');
          setScreenOpacity(1);
          setScreenScale(1);

          transitionTimerRef.current = setTimeout(() => {
            setIsTransitioning(false);
          }, 350);
        });
      });
    }, 280);
  };

  // Launch handlers for each dedicated screen
  const handleLaunchCareer = () => {
    playUiClick(950);
    if (onStartCareerMode) {
      onStartCareerMode(cameraDistance, cameraMode, laps, difficulty, startingCompound, selectedCircuit);
    } else {
      onStartSolo(cameraDistance, cameraMode, laps, difficulty, startingCompound, selectedCircuit);
    }
  };

  const handleLaunchFreePractice = () => {
    playUiClick(950);
    if (onStartFreePractice) {
      onStartFreePractice(cameraDistance, cameraMode, startingCompound, selectedCircuit);
    } else {
      onStartSolo(cameraDistance, cameraMode, 9, 'easy', startingCompound, selectedCircuit);
    }
  };

  const handleLaunchGrandPrix = () => {
    playUiClick(950);
    onStartSolo(cameraDistance, cameraMode, laps, difficulty, startingCompound, selectedCircuit);
  };

  const handleLaunchFreeCamera = () => {
    playUiClick(750);
    if (onStartFreeCamera) {
      onStartFreeCamera(selectedCircuit);
    } else if (onStartFreePractice) {
      onStartFreePractice(cameraDistance, cameraMode, startingCompound, selectedCircuit);
    }
  };

  const handleCreateRoomAction = async () => {
    playUiClick(850);
    await onCreateRoom({
      playerName: playerName.trim() || 'Piloto Anfitrión',
      laps: mpLaps,
      car1Name: 'F1 Turbo GP (Host)',
      car2Name: 'F1 Turbo GP (Rival)',
      crewName: 'Pit Crew Scuderia',
      cameraDistance,
      cameraMode,
    });
  };

  const handleJoinRoomAction = async () => {
    if (!joinCodeInput.trim()) return;
    playUiClick(850);
    await onJoinRoom(
      joinCodeInput.trim().toUpperCase(),
      playerName.trim() || 'Piloto Invitado',
      cameraDistance,
      cameraMode
    );
  };

  const handleToggleReady = () => {
    playUiClick(800);
    const next = !isReady;
    setIsReady(next);
    onSetReady(next);
  };

  const copyRoomCode = () => {
    if (!roomState?.code) return;
    navigator.clipboard.writeText(roomState.code);
    setIsCopied(true);
    playUiClick(900);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const currentCircuit = AVAILABLE_CIRCUITS.find((c) => c.id === selectedCircuit) || AVAILABLE_CIRCUITS[0];

  // Career stats calculation
  const playerStanding = careerSeason?.standings?.find((s) => s.isPlayer);
  const playerPoints = playerStanding?.points ?? 0;

  // Estimated race duration calculation
  const calculateEstimatedTime = (totalLaps: number) => {
    const lapTime = currentCircuit.expectedLapTimeSec || 35;
    const totalSecs = lapTime * totalLaps;
    const mins = Math.floor(totalSecs / 60);
    const secs = Math.round(totalSecs % 60);
    return `${mins}m ${secs < 10 ? '0' : ''}${secs}s`;
  };

  // Gran Turismo 7 Cards Configuration for Screen 2 (Root View: 4 Core Modes)
  const gt7Cards = [
    {
      id: 'career',
      title: 'MODO CARRERA',
      desc: 'Compite, gana y avanza en tu carrera como piloto profesional.',
      bg: '/images/cards/card_career.jpg',
      icon: Trophy,
      action: () => handleNavigateToScreen('career'),
    },
    {
      id: 'free',
      title: 'CONDUCCIÓN LIBRE',
      desc: 'Explora libremente los circuitos y disfruta de la conducción.',
      bg: '/images/cards/card_free.jpg',
      icon: Timer,
      action: () => handleNavigateToScreen('free'),
    },
    {
      id: 'multiplayer',
      title: 'MULTIJUGADOR',
      desc: 'Compite en línea con jugadores de todo el mundo en 1v1.',
      bg: '/images/cards/card_multiplayer.jpg',
      icon: Globe,
      action: () => handleNavigateToScreen('multiplayer'),
    },
    {
      id: 'grand_prix',
      title: 'GRAN PREMIO',
      desc: 'Parrilla oficial FIA de 5 monoplazas con semáforo y paradas en boxes.',
      bg: '/images/cards/card_grandprix.jpg',
      icon: Flag,
      action: () => handleNavigateToScreen('grand_prix'),
    },
  ];

  // Screen 3 Selectors Configuration (Cards with custom background images)
  const screen3Selectors = [
    {
      id: 'circuit',
      category: 'CIRCUITO FIA',
      title: currentCircuit.name,
      subtitle: `${(currentCircuit.totalLength / 1000).toFixed(2)} KM · ${currentCircuit.cornersCount} Curvas`,
      tag: currentCircuit.flagEmoji || '🏁',
      bg: '/images/cards/btn_circuit.jpg',
      action: () => {
        playUiClick(750);
        setActiveOverlay('circuit');
      },
    },
    {
      id: 'tires',
      category: 'NEUMÁTICOS',
      title:
        startingCompound === 'soft'
          ? 'BLANDO C4 (ROJO)'
          : startingCompound === 'medium'
          ? 'MEDIO C3 (AMARILLO)'
          : 'DURO C2 (BLANCO)',
      subtitle:
        startingCompound === 'soft'
          ? 'Agarre 100% · 8-10 Vueltas'
          : startingCompound === 'medium'
          ? 'Agarre 92% · 18-22 Vueltas'
          : 'Agarre 84% · 35+ Vueltas',
      tag:
        startingCompound === 'soft' ? '🔴 PIRELLI' : startingCompound === 'medium' ? '🟡 PIRELLI' : '⚪ PIRELLI',
      bg: '/images/cards/btn_tire.jpg',
      action: () => {
        playUiClick(750);
        setActiveOverlay('tires');
      },
    },
    {
      id: 'laps',
      category: 'DURACIÓN & VUELTAS',
      title: `${laps} VUELTAS`,
      subtitle: `${calculateEstimatedTime(laps)} · ${
        laps === 9 ? 'Sprint Relámpago' : laps === 20 ? 'Gran Premio Estándar' : 'Resistencia Completa'
      }`,
      tag: '🏁 DISTANCIA',
      bg: '/images/cards/btn_laps.jpg',
      action: () => {
        playUiClick(750);
        setActiveOverlay('laps');
      },
    },
    {
      id: 'difficulty',
      category: activeScreen === 'multiplayer' ? 'SALA MULTIJUGADOR' : 'DIFICULTAD RIVALES',
      title:
        activeScreen === 'multiplayer'
          ? roomState
            ? `SALA: ${roomState.code}`
            : 'DUELO 1V1 EN LÍNEA'
          : difficulty === 'easy'
          ? 'NOVATO'
          : difficulty === 'medium'
          ? 'INTERMEDIO'
          : 'LEYENDA FIA',
      subtitle:
        activeScreen === 'multiplayer'
          ? roomState
            ? `Jugadores: ${roomState.players.p1 ? 1 : 0} + ${roomState.players.p2 ? 1 : 0}/2`
            : 'Crear sala privada o unirse con código'
          : difficulty === 'easy'
          ? 'Ritmo accesible y permisivo'
          : difficulty === 'medium'
          ? 'Competitivo y equilibrado'
          : 'Máxima agresividad de parrilla',
      tag: activeScreen === 'multiplayer' ? '🌐 WEBSOCKET' : '⚡ IA DINÁMICA',
      bg: '/images/cards/card_grandprix.jpg',
      action: () => {
        playUiClick(750);
        if (activeScreen === 'multiplayer') {
          setActiveOverlay('multiplayer_modal');
        } else {
          setActiveOverlay('difficulty');
        }
      },
    },
    {
      id: 'livery',
      category: 'ESCUDERÍA & PILOTO',
      title: teamName,
      subtitle: `#${carNumber} · ${driverDisplayName} (${driverCode})`,
      tag: '🏎️ MONOPLAZA',
      bg: '/images/cards/btn_livery.jpg',
      action: () => {
        playUiClick(750);
        setActiveOverlay('livery');
      },
    },
    {
      id: 'setup',
      category: 'REGLAJES & ASISTENCIAS',
      title: `TC: ${tractionControl ? 'ON' : 'OFF'} · ABS: ${absEnabled ? 'ON' : 'OFF'}`,
      subtitle: `Trazada: ${racingLine ? 'ON' : 'OFF'} · Cámara: ${
        cameraMode === 'chase' ? 'Exterior' : cameraMode === 'bumper' ? 'Morro/Asfalto' : cameraMode === 'hood' ? 'Capó' : 'Órbita'
      }`,
      tag: '🛠️ TELEMETRÍA',
      bg: '/images/cards/btn_helmet.jpg',
      action: () => {
        playUiClick(750);
        setActiveOverlay('setup');
      },
    },
  ];

  // Arrow key navigation for 2x2 cards in root menu
  useEffect(() => {
    if (activeScreen !== 'root' || showControlsModal || activeOverlay !== 'none' || isTransitioning) return;
    const handleMenuNav = (e: KeyboardEvent) => {
      const total = gt7Cards.length;
      if (total === 0) return;
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        playUiHover();
        setSelectedCardIndex((prev) => (prev + 1) % total);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        playUiHover();
        setSelectedCardIndex((prev) => (prev - 1 + total) % total);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        playUiHover();
        setSelectedCardIndex((prev) => (prev + 2) % total);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        playUiHover();
        setSelectedCardIndex((prev) => (prev - 2 + total) % total);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const c = gt7Cards[selectedCardIndex];
        if (c) c.action();
      }
    };
    window.addEventListener('keydown', handleMenuNav);
    return () => window.removeEventListener('keydown', handleMenuNav);
  }, [activeScreen, selectedCardIndex, showControlsModal, activeOverlay, gt7Cards, isTransitioning]);

  const renderModeCard = (card: typeof gt7Cards[0], idx: number) => {
    const isSelected = selectedCardIndex === idx;
    return (
      <button
        key={card.id}
        onClick={() => {
          setSelectedCardIndex(idx);
          playUiClick(800);
          card.action();
        }}
        onMouseEnter={() => {
          setSelectedCardIndex(idx);
          playUiHover();
        }}
        className={`group relative rounded-xl sm:rounded-2xl overflow-hidden text-left cursor-pointer transition-all duration-300 flex flex-col justify-end p-3 sm:p-4 select-none w-full h-full bg-neutral-900/40 backdrop-blur-sm ${
          isSelected
            ? 'border-2 border-cyan-400 shadow-[0_0_24px_rgba(34,211,238,0.65),inset_0_0_12px_rgba(34,211,238,0.2)] ring-1 ring-cyan-300 scale-[1.01]'
            : 'border border-white/20 hover:border-cyan-400/80 hover:shadow-[0_0_16px_rgba(34,211,238,0.35)]'
        }`}
      >
        {/* Background Image with exactly 57% opacity */}
        <img
          src={card.bg}
          alt={card.title}
          style={{ opacity: 0.57 }}
          className="absolute inset-0 w-full h-full object-cover opacity-[0.57] transition-transform duration-500 ease-out group-hover:scale-108 group-hover:opacity-75"
          loading="eager"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/45 to-transparent pointer-events-none" />
        <div className="absolute inset-0 bg-black/15 group-hover:bg-transparent transition-colors pointer-events-none" />

        {isSelected && (
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent pointer-events-none" />
        )}

        <div className="relative z-10 flex flex-col justify-end min-w-0">
          <h3 className="text-sm sm:text-base md:text-lg font-black uppercase tracking-wider text-white drop-shadow font-sans truncate leading-tight">
            {card.title}
          </h3>
          <p className="text-[9px] sm:text-[10.5px] md:text-xs text-neutral-300 line-clamp-2 mt-0.5 sm:mt-1 font-normal leading-tight">
            {card.desc}
          </p>
        </div>
      </button>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-between h-screen max-h-screen overflow-hidden select-none text-white font-sans bg-neutral-950">
      {/* ========================================================================= */}
      {/* SCREEN 2 (ROOT) LAYER: FONDO Y BOTONES 100% COORDINADOS EN UN SOLO BLOQUE */}
      {/* ========================================================================= */}
      <div
        className={`absolute inset-0 flex flex-col justify-between overflow-hidden select-none will-change-transform ${
          visibleScreen === 'root' ? 'flex' : 'hidden pointer-events-none'
        }`}
        style={{
          opacity: visibleScreen === 'root' ? screenOpacity : 0,
          transform: visibleScreen === 'root' ? `scale(${screenScale})` : 'scale(1.02)',
          transition: visibleScreen === 'root' ? transitionTiming : 'none',
          pointerEvents: visibleScreen === 'root' && !isTransitioning ? 'auto' : 'none',
        }}
      >
        {/* Background image & atmospheric vignette for Screen 2 */}
        <img
          src="/images/dashboard_bg.webp"
          alt="Dashboard Background"
          className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none z-0"
          loading="eager"
          decoding="async"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/90 via-neutral-950/35 to-neutral-950/75 pointer-events-none z-0" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-neutral-950/20 to-neutral-950/60 pointer-events-none z-0" />

        {/* Screen 2 Minimal Fullscreen Button only (con fondo casi transparente) */}
        <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-30">
          <button
            onClick={toggleFullscreen}
            onMouseEnter={playUiHover}
            title={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
            className="p-2 sm:p-2.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-neutral-300 hover:text-white transition-all cursor-pointer backdrop-blur-sm shadow-md"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4 sm:w-5 sm:h-5" /> : <Maximize2 className="w-4 h-4 sm:w-5 sm:h-5" />}
          </button>
        </div>

        {/* SCREEN 2: 2x2 Mode Selection Grid (40% Button Opacity & Maximized Space) */}
        <main className="relative z-10 flex-1 flex flex-col justify-center px-3 sm:px-6 md:px-8 py-4 sm:py-6 max-w-7xl mx-auto w-full min-h-0 overflow-hidden">
          {/* Top Title Banner */}
          <div className="flex-shrink-0 mb-2 sm:mb-4 text-left">
            <h1 className="text-lg sm:text-2xl md:text-3xl font-black uppercase tracking-wide text-white drop-shadow font-sans">
              UN MUNDO DE AUTOMOVILISMO
            </h1>
            <p className="text-xs sm:text-sm text-neutral-300 font-normal">
              Elige tu forma de disfrutar Apex GT.
            </p>
          </div>

          {/* 4 Cards Grid: 20% wider cards on left and right, preserving clean center */}
          <div className="flex-1 min-h-0 grid grid-cols-[minmax(165px,29%)_1fr_minmax(165px,29%)] grid-rows-2 gap-y-3 sm:gap-y-4 w-full items-stretch my-auto">
            {/* Col 1 Row 1: MODO CARRERA */}
            <div className="col-start-1 row-start-1 h-full">
              {renderModeCard(gt7Cards[0], 0)}
            </div>

            {/* Col 3 Row 1: CONDUCCIÓN LIBRE */}
            <div className="col-start-3 row-start-1 h-full">
              {renderModeCard(gt7Cards[1], 1)}
            </div>

            {/* Col 1 Row 2: MULTIJUGADOR */}
            <div className="col-start-1 row-start-2 h-full">
              {renderModeCard(gt7Cards[2], 2)}
            </div>

            {/* Col 3 Row 2: GRAN PREMIO */}
            <div className="col-start-3 row-start-2 h-full">
              {renderModeCard(gt7Cards[3], 3)}
            </div>
          </div>
        </main>
      </div>

      {/* ========================================================================= */}
      {/* SCREEN 3 (MODE) LAYER: FONDO Y BOTONES 100% COORDINADOS EN UN SOLO BLOQUE */}
      {/* ========================================================================= */}
      <div
        className={`absolute inset-0 flex flex-col justify-between overflow-hidden select-none will-change-transform ${
          visibleScreen === 'mode' ? 'flex' : 'hidden pointer-events-none'
        }`}
        style={{
          opacity: visibleScreen === 'mode' ? screenOpacity : 0,
          transform: visibleScreen === 'mode' ? `scale(${screenScale})` : 'scale(1.02)',
          transition: visibleScreen === 'mode' ? transitionTiming : 'none',
          pointerEvents: visibleScreen === 'mode' && !isTransitioning ? 'auto' : 'none',
        }}
      >
        {/* Background image & atmospheric vignette for Screen 3 */}
        <img
          src="/images/screen3_bg.png"
          alt="F1 Paddock Background"
          className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none z-0"
          loading="eager"
          decoding="async"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/90 via-neutral-950/35 to-neutral-950/75 pointer-events-none z-0" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-neutral-950/20 to-neutral-950/60 pointer-events-none z-0" />

        {/* Screen 3 Top Header matching the luxury motorsport styling */}
        <header className="relative z-20 w-full border-b border-white/10 bg-neutral-950/85 backdrop-blur-xl px-2.5 sm:px-6 py-1 sm:py-1.5 flex items-center justify-between flex-shrink-0 shadow-lg">
          {/* Left: Mode Title & F1 Badge */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <div className="px-1.5 sm:px-2 py-0.5 rounded bg-red-600 text-white font-black italic tracking-tighter text-xs sm:text-sm font-mono shadow-md border border-red-400/40">
                F1
              </div>
            </div>

            <div className="leading-tight truncate">
              <h2 className="text-xs sm:text-sm md:text-base font-black uppercase tracking-wider text-white font-sans flex items-center gap-1.5 truncate">
                <span className="truncate">
                  {activeScreen === 'career' && 'MODO CARRERA'}
                  {activeScreen === 'free' && 'ENTRENAMIENTO & TIME ATTACK'}
                  {activeScreen === 'multiplayer' && 'PADDOCK MULTIJUGADOR 1V1'}
                  {activeScreen === 'grand_prix' && 'GRAN PREMIO OFICIAL FIA'}
                </span>
              </h2>
            </div>
          </div>

          {/* Right: MODOS & Fullscreen Button (Intercambiada la posición: Pantalla completa a la derecha de todo) */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 flex-shrink-0">
            {/* Back Button to return to Screen 2 */}
            <button
              onClick={handleBackToGrid}
              onMouseEnter={playUiHover}
              className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full bg-red-600/30 hover:bg-red-600/50 border border-red-500/50 text-red-100 hover:text-white transition-all text-xs font-bold cursor-pointer shadow-md"
              title="Volver a selección de modalidades"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>MODOS</span>
            </button>

            {/* Pantalla completa a la derecha de todo */}
            <button
              onClick={toggleFullscreen}
              onMouseEnter={playUiHover}
              title={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
              className="p-1 sm:p-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-neutral-300 hover:text-white transition-all cursor-pointer backdrop-blur-md"
            >
              {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>
          </div>
        </header>

        {/* SCREEN 3: Custom Background + 6 Selector Buttons (60% Opacity) + Zero-Scroll Responsive Layout */}
        <main className="relative z-10 flex-1 flex flex-col px-2 sm:px-4 md:px-6 py-1.5 sm:py-2 max-w-7xl mx-auto w-full min-h-0 overflow-hidden">
          {/* ========================================================================= */}
          {/* LAYOUT A: LANDSCAPE VIEWPORT (Horizontal Phone/Desktop: Left Minimalist Panel + 3x2 Grid) */}
          {/* ========================================================================= */}
          <div className="hidden landscape:flex flex-row gap-2 sm:gap-3 flex-1 min-h-0 items-stretch">
            {/* Left Sidebar: Exact Replica of IMG_20261019_005254.png */}
            <aside className="relative w-52 sm:w-60 md:w-68 flex-shrink-0 flex flex-col justify-between rounded-2xl bg-[#09090b]/90 backdrop-blur-xl border border-white/10 p-2.5 sm:p-3 shadow-2xl min-h-0 overflow-hidden before:absolute before:top-0 before:left-0 before:w-12 before:h-12 before:border-t-2 before:border-l-2 before:border-red-600 before:rounded-tl-2xl before:pointer-events-none">
              {/* Header: Red Dot + FICHA TÉCNICA + FIA Logo */}
              <div className="flex-shrink-0 pb-1.5 flex items-center justify-between border-b border-white/[0.08]">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-red-600 shadow-[0_0_8px_rgba(239,68,68,1)] shrink-0" />
                  <span className="text-[11px] sm:text-xs font-black uppercase tracking-wider text-white font-sans">
                    FICHA TÉCNICA
                  </span>
                </div>
                <div className="w-5 h-5 rounded-full border border-white/80 flex items-center justify-center p-0.5 shrink-0" title="FIA Certified">
                  <svg viewBox="0 0 100 100" className="w-full h-full text-white fill-current">
                    <circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" strokeWidth="6" />
                    <ellipse cx="50" cy="50" rx="46" ry="18" fill="none" stroke="currentColor" strokeWidth="4" />
                    <ellipse cx="50" cy="50" rx="18" ry="46" fill="none" stroke="currentColor" strokeWidth="4" />
                    <text x="50" y="59" textAnchor="middle" fontSize="30" fontWeight="900" fontFamily="sans-serif" fill="currentColor">FIA</text>
                  </svg>
                </div>
              </div>

              {/* 6 Minimalist Telemetry Rows: Compact, evenly spaced and never overlapping */}
              <div className="flex-1 min-h-0 flex flex-col justify-around py-0.5 overflow-hidden">
                {/* 1. CIRCUITO */}
                <div
                  onClick={() => { playUiClick(700); setActiveOverlay('circuit'); }}
                  className="flex items-center gap-2 py-0.5 border-b border-white/[0.08] cursor-pointer hover:bg-white/[0.04] transition-colors rounded px-1 -mx-1"
                >
                  <div className="w-4 h-4 flex items-center justify-center shrink-0">
                    <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 text-white fill-current">
                      <rect x="2" y="2" width="2" height="20" rx="1" fill="#fff" />
                      <path d="M4 4c2.5-1 5 1 7.5 0s5-1 7.5 0v9c-2.5-1-5 1-7.5 0s-5-1-7.5 0V4z" fill="none" stroke="#fff" strokeWidth="1.2" />
                      <path d="M4 4h3.7v3H4zm7.5 0h3.7v3h-3.7zm-3.8 3h3.8v3H7.7zm7.5 0h3.8v3h-3.8zm-7.5 3h3.8v3H7.7zm-3.7 0h3.7v3H4zm7.5 0h3.7v3h-3.7z" fill="#fff" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[7.5px] sm:text-[8px] font-bold uppercase tracking-wider text-neutral-400 font-sans leading-none">
                      CIRCUITO
                    </div>
                    <div className="text-[10px] sm:text-[11px] font-bold text-white truncate font-sans leading-tight mt-0.5">
                      {currentCircuit.name}
                    </div>
                    <div className="text-[7.5px] sm:text-[8px] text-neutral-400 font-medium font-sans leading-none mt-0.5">
                      {(currentCircuit.totalLength / 1000).toFixed(1)} km · {currentCircuit.cornersCount} Curvas
                    </div>
                  </div>
                </div>

                {/* 2. NEUMÁTICO */}
                <div
                  onClick={() => { playUiClick(700); setActiveOverlay('tires'); }}
                  className="flex items-center gap-2 py-0.5 border-b border-white/[0.08] cursor-pointer hover:bg-white/[0.04] transition-colors rounded px-1 -mx-1"
                >
                  <div className="w-4 h-4 flex items-center justify-center shrink-0">
                    <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <circle cx="12" cy="12" r="10" strokeWidth="2" />
                      <circle cx="12" cy="12" r="6.5" strokeWidth="1.5" />
                      <circle cx="12" cy="12" r="2.5" fill="currentColor" />
                      <line x1="12" y1="2" x2="12" y2="5.5" strokeWidth="1.5" />
                      <line x1="12" y1="18.5" x2="12" y2="22" strokeWidth="1.5" />
                      <line x1="2" y1="12" x2="5.5" y2="12" strokeWidth="1.5" />
                      <line x1="18.5" y1="12" x2="22" y2="12" strokeWidth="1.5" />
                      <line x1="4.93" y1="4.93" x2="7.4" y2="7.4" strokeWidth="1.5" />
                      <line x1="16.6" y1="16.6" x2="19.07" y2="19.07" strokeWidth="1.5" />
                      <line x1="4.93" y1="19.07" x2="7.4" y2="16.6" strokeWidth="1.5" />
                      <line x1="16.6" y1="7.4" x2="19.07" y2="4.93" strokeWidth="1.5" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[7.5px] sm:text-[8px] font-bold uppercase tracking-wider text-neutral-400 font-sans leading-none">
                      NEUMÁTICO
                    </div>
                    <div className="flex items-center gap-1 text-[10px] sm:text-[11px] font-bold text-white uppercase truncate font-sans leading-tight mt-0.5">
                      <span
                        className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                          startingCompound === 'soft'
                            ? 'bg-red-600 shadow-[0_0_6px_rgba(239,68,68,0.9)]'
                            : startingCompound === 'medium'
                            ? 'bg-yellow-400 shadow-[0_0_6px_rgba(250,204,21,0.9)]'
                            : 'bg-white shadow-[0_0_6px_rgba(255,255,255,0.9)]'
                        }`}
                      />
                      <span className="truncate">
                        {startingCompound === 'soft' ? 'BLANDO C4 (ROJO)' : startingCompound === 'medium' ? 'MEDIO C3 (AMARILLO)' : 'DURO C2 (BLANCO)'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 3. DISTANCIA */}
                <div
                  onClick={() => { playUiClick(700); setActiveOverlay('laps'); }}
                  className="flex items-center gap-2 py-0.5 border-b border-white/[0.08] cursor-pointer hover:bg-white/[0.04] transition-colors rounded px-1 -mx-1"
                >
                  <div className="w-4 h-4 flex items-center justify-center shrink-0">
                    <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="14" r="8" />
                      <line x1="12" y1="2" x2="12" y2="6" strokeWidth="2" />
                      <line x1="9" y1="2" x2="15" y2="2" strokeWidth="2" />
                      <line x1="19" y1="7" x2="20.5" y2="5.5" strokeWidth="2" />
                      <line x1="12" y1="14" x2="12" y2="10" strokeWidth="2" />
                      <line x1="12" y1="14" x2="15" y2="14" strokeWidth="1.6" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[7.5px] sm:text-[8px] font-bold uppercase tracking-wider text-neutral-400 font-sans leading-none">
                      DISTANCIA
                    </div>
                    <div className="text-[10px] sm:text-[11px] font-bold text-white uppercase font-sans leading-tight mt-0.5">
                      {laps} VUELTAS
                    </div>
                  </div>
                </div>

                {/* 4. DIFICULTAD IA */}
                <div
                  onClick={() => { playUiClick(700); if (activeScreen === 'multiplayer') setActiveOverlay('multiplayer_modal'); else setActiveOverlay('difficulty'); }}
                  className="flex items-center gap-2 py-0.5 border-b border-white/[0.08] cursor-pointer hover:bg-white/[0.04] transition-colors rounded px-1 -mx-1"
                >
                  <div className="w-4 h-4 flex items-center justify-center shrink-0">
                    <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 text-white fill-white">
                      <path d="M13 2L4 14h7v8l9-12h-7l2-8z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[7.5px] sm:text-[8px] font-bold uppercase tracking-wider text-neutral-400 font-sans leading-none">
                      {activeScreen === 'multiplayer' ? 'SALA MULTIJUGADOR' : 'DIFICULTAD IA'}
                    </div>
                    <div className="text-[10px] sm:text-[11px] font-bold text-white uppercase truncate font-sans leading-tight mt-0.5">
                      {activeScreen === 'multiplayer' ? (roomState ? `SALA: ${roomState.code}` : 'DUELO 1V1') : difficulty === 'easy' ? 'NOVATO' : difficulty === 'medium' ? 'INTERMEDIO' : 'LEYENDA FIA'}
                    </div>
                  </div>
                </div>

                {/* 5. PILOTO & ESCUDERÍA */}
                <div
                  onClick={() => { playUiClick(700); setActiveOverlay('livery'); }}
                  className="flex items-center gap-2 py-0.5 border-b border-white/[0.08] cursor-pointer hover:bg-white/[0.04] transition-colors rounded px-1 -mx-1"
                >
                  <div className="w-4 h-4 flex items-center justify-center shrink-0">
                    <svg viewBox="0 0 32 32" className="w-3.5 h-3.5 text-white fill-current">
                      <path d="M16 4C9.37 4 4 9.37 4 16c0 4.14 2.1 7.8 5.3 9.94l2.35-2.35A9.94 9.94 0 0 1 8.1 17.5l6.7 1c.54.08 1.08-.2 1.3-.72l1.65-3.85c.38-.88 1.23-1.43 2.18-1.43h5.9A11.96 11.96 0 0 0 16 4zm7.9 10.5h-4.8c-.33 0-.62.19-.75.49l-1.2 2.8 6.25.93c.34-1.35.53-2.77.5-4.22z"/>
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[7.5px] sm:text-[8px] font-bold uppercase tracking-wider text-neutral-400 font-sans leading-none">
                      PILOTO & ESCUDERÍA
                    </div>
                    <div className="text-[10px] sm:text-[11px] font-bold text-white truncate font-sans leading-tight mt-0.5">
                      #{carNumber} · {driverDisplayName}
                    </div>
                  </div>
                </div>

                {/* 6. ASISTENCIAS */}
                <div
                  onClick={() => { playUiClick(700); setActiveOverlay('setup'); }}
                  className="flex items-center gap-2 py-0.5 cursor-pointer hover:bg-white/[0.04] transition-colors rounded px-1 -mx-1"
                >
                  <div className="w-4 h-4 flex items-center justify-center shrink-0">
                    <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 text-white fill-current">
                      <path d="M22.7 19l-9.1-9.1c.9-2.3.4-5-1.5-6.9-2-2-5-2.4-7.4-1.3L9 6 6 9 1.6 4.7C.5 7.1.9 10.1 2.9 12.1c1.9 1.9 4.6 2.4 6.9 1.5l9.1 9.1c.4.4 1 .4 1.4 0l2.3-2.3c.5-.4.5-1.1.1-1.4z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[7.5px] sm:text-[8px] font-bold uppercase tracking-wider text-neutral-400 font-sans leading-none">
                      ASISTENCIAS
                    </div>
                    <div className="text-[9.5px] sm:text-[10px] text-neutral-200 font-medium font-sans truncate leading-tight mt-0.5">
                      TC: {tractionControl ? 'ON' : 'OFF'} · ABS: {absEnabled ? 'ON' : 'OFF'} · Línea: {racingLine ? 'ON' : 'OFF'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Start Button: Compact, exactly like reference image IMG_20261019_005254.png */}
              <div className="flex-shrink-0 pt-1 mt-auto">
                <button
                  onClick={() => {
                    if (activeScreen === 'free') handleLaunchFreePractice();
                    else if (activeScreen === 'multiplayer') {
                      if (roomState) onStartMultiplayerRace();
                      else setActiveOverlay('multiplayer_modal');
                    } else if (activeScreen === 'grand_prix') handleLaunchGrandPrix();
                    else handleLaunchCareer();
                  }}
                  onMouseEnter={playUiHover}
                  className="relative w-full h-8 sm:h-8.5 transition-all duration-200 cursor-pointer active:scale-98 flex items-center justify-center gap-1.5 shadow-[0_0_16px_rgba(239,68,68,0.7)]"
                  style={{
                    clipPath: 'polygon(12px 0%, 100% 0%, calc(100% - 12px) 100%, 0% 100%)',
                    background: 'linear-gradient(90deg, #991b1b 0%, #dc2626 28%, #ef4444 50%, #dc2626 72%, #991b1b 100%)',
                  }}
                >
                  <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-red-200/60 to-transparent pointer-events-none" />
                  <Play className="w-3.5 h-3.5 fill-white text-white drop-shadow" />
                  <span className="text-xs sm:text-sm font-black tracking-widest text-white drop-shadow font-sans">
                    INICIAR
                  </span>
                </button>
              </div>
            </aside>

            {/* Right: 6 Selector Buttons (3 cols x 2 rows, 60% opacity) */}
            <div className="flex-1 min-h-0 grid grid-cols-3 grid-rows-2 gap-1.5 items-stretch h-full">
              {screen3Selectors.map((btn) => (
                <button
                  key={btn.id}
                  onClick={btn.action}
                  onMouseEnter={playUiHover}
                  className="group relative rounded-xl overflow-hidden text-left cursor-pointer transition-all duration-300 flex flex-col justify-between p-1.5 sm:p-2 select-none border border-white/20 hover:border-red-500/80 hover:shadow-[0_0_14px_rgba(239,68,68,0.4)] hover:scale-[1.01]"
                >
                  {/* Background Image: exactly 60% opacity */}
                  <img
                    src={btn.bg}
                    alt={btn.title}
                    className="absolute inset-0 w-full h-full object-cover opacity-60 transition-transform duration-500 ease-out group-hover:scale-105"
                    loading="eager"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/10 pointer-events-none" />
                  <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors pointer-events-none" />

                  {/* Only Big Letters (letras grandes) */}
                  <div className="relative z-10 flex items-center justify-between gap-1 w-full min-w-0">
                    <span className="text-[10px] sm:text-xs md:text-sm font-black uppercase tracking-wider text-white drop-shadow font-sans truncate">
                      {btn.title}
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-neutral-400 group-hover:text-red-400 transition-colors shrink-0" />
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* ========================================================================= */}
          {/* LAYOUT B: PORTRAIT VIEWPORT (Vertical Phone: Minimalist Top Bar + 2x3 Grid) */}
          {/* ========================================================================= */}
          <div className="flex landscape:hidden flex-col gap-1.5 flex-1 min-h-0">
            {/* Top Minimalist Summary Bar (arriba) */}
            <div className="flex-shrink-0 rounded-xl bg-neutral-950/80 backdrop-blur-md border border-white/15 p-1.5 shadow-lg">
              {/* Row 1: Title + Action Button */}
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-[9.5px] font-black uppercase tracking-wider text-white font-mono">
                    RESUMEN TÉCNICO FIA
                  </span>
                </div>
                <div className="w-32">
                  {activeScreen === 'career' && (
                    <button
                      onClick={handleLaunchCareer}
                      onMouseEnter={playUiHover}
                      className="w-full py-1 px-2 rounded-lg bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-neutral-950 font-black text-[9px] tracking-wider uppercase transition-all shadow-md flex items-center justify-center gap-1 cursor-pointer active:scale-95"
                    >
                      <Play className="w-2.5 h-2.5 fill-current" />
                      <span>INICIAR</span>
                    </button>
                  )}
                  {activeScreen === 'free' && (
                    <button
                      onClick={handleLaunchFreePractice}
                      onMouseEnter={playUiHover}
                      className="w-full py-1 px-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-neutral-950 font-black text-[9px] tracking-wider uppercase transition-all shadow-md flex items-center justify-center gap-1 cursor-pointer active:scale-95"
                    >
                      <Play className="w-2.5 h-2.5 fill-current" />
                      <span>A PISTA</span>
                    </button>
                  )}
                  {activeScreen === 'multiplayer' && (
                    <button
                      onClick={() => { playUiClick(850); setActiveOverlay('multiplayer_modal'); }}
                      onMouseEnter={playUiHover}
                      className="w-full py-1 px-2 rounded-lg bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-400 hover:to-green-400 text-neutral-950 font-black text-[9px] tracking-wider uppercase transition-all shadow-md flex items-center justify-center gap-1 cursor-pointer active:scale-95"
                    >
                      <Zap className="w-2.5 h-2.5 fill-current" />
                      <span>{roomState ? 'GESTIONAR' : 'UNIRSE'}</span>
                    </button>
                  )}
                  {activeScreen === 'grand_prix' && (
                    <button
                      onClick={handleLaunchGrandPrix}
                      onMouseEnter={playUiHover}
                      className="w-full py-1 px-2 rounded-lg bg-gradient-to-r from-red-600 via-rose-500 to-red-600 hover:from-red-500 hover:to-rose-400 text-white font-black text-[9px] tracking-wider uppercase transition-all shadow-md flex items-center justify-center gap-1 cursor-pointer active:scale-95"
                    >
                      <Play className="w-2.5 h-2.5 fill-current" />
                      <span>INICIAR GP</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Row 2: 6 Quick Horizontal Summary Chips */}
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-1 text-[8px] font-mono">
                <div
                  onClick={() => { playUiClick(700); setActiveOverlay('circuit'); }}
                  className="px-1 py-0.5 rounded bg-white/[0.04] border border-white/10 text-center truncate cursor-pointer"
                >
                  <span className="text-neutral-400">🏁 </span>
                  <span className="text-white font-bold truncate">{currentCircuit.name}</span>
                </div>
                <div
                  onClick={() => { playUiClick(700); setActiveOverlay('tires'); }}
                  className="px-1 py-0.5 rounded bg-white/[0.04] border border-white/10 text-center truncate cursor-pointer flex items-center justify-center gap-1"
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      startingCompound === 'soft' ? 'bg-red-500' : startingCompound === 'medium' ? 'bg-yellow-400' : 'bg-white'
                    }`}
                  />
                  <span className="text-white font-bold truncate">{startingCompound.toUpperCase()}</span>
                </div>
                <div
                  onClick={() => { playUiClick(700); setActiveOverlay('laps'); }}
                  className="px-1 py-0.5 rounded bg-white/[0.04] border border-white/10 text-center truncate cursor-pointer"
                >
                  <span className="text-neutral-400">⏱️ </span>
                  <span className="text-amber-300 font-bold">{laps}V</span>
                </div>
                <div
                  onClick={() => { playUiClick(700); if (activeScreen === 'multiplayer') setActiveOverlay('multiplayer_modal'); else setActiveOverlay('difficulty'); }}
                  className="px-1 py-0.5 rounded bg-white/[0.04] border border-white/10 text-center truncate cursor-pointer"
                >
                  <span className="text-neutral-400">⚡ </span>
                  <span className="text-white font-bold truncate">{difficulty.toUpperCase()}</span>
                </div>
                <div
                  onClick={() => { playUiClick(700); setActiveOverlay('livery'); }}
                  className="px-1 py-0.5 rounded bg-white/[0.04] border border-white/10 text-center truncate cursor-pointer"
                >
                  <span className="text-neutral-400">🏎️ </span>
                  <span className="text-white font-bold truncate">#{carNumber} {driverCode}</span>
                </div>
                <div
                  onClick={() => { playUiClick(700); setActiveOverlay('setup'); }}
                  className="px-1 py-0.5 rounded bg-white/[0.04] border border-white/10 text-center truncate cursor-pointer"
                >
                  <span className="text-neutral-400">🛠️ </span>
                  <span className="text-emerald-400 font-bold">TC:{tractionControl ? 'ON' : 'OFF'}</span>
                </div>
              </div>
            </div>

            {/* 6 Selector Buttons Grid (2 cols x 3 rows, only big letters) */}
            <div className="flex-1 min-h-0 grid grid-cols-2 grid-rows-3 gap-1.5 items-stretch">
              {screen3Selectors.map((btn) => (
                <button
                  key={btn.id}
                  onClick={btn.action}
                  onMouseEnter={playUiHover}
                  className="group relative rounded-xl overflow-hidden text-left cursor-pointer transition-all duration-300 flex flex-col justify-end p-2 select-none border border-white/20 hover:border-red-500/80 hover:shadow-[0_0_14px_rgba(239,68,68,0.4)] hover:scale-[1.01]"
                >
                  {/* Background Image: exactly 60% opacity */}
                  <img
                    src={btn.bg}
                    alt={btn.title}
                    className="absolute inset-0 w-full h-full object-cover opacity-60 transition-transform duration-500 ease-out group-hover:scale-105"
                    loading="eager"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/10 pointer-events-none" />
                  <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors pointer-events-none" />

                  {/* Only Big Letters (letras grandes) */}
                  <div className="relative z-10 flex items-center justify-between gap-1 w-full min-w-0">
                    <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-white drop-shadow font-sans truncate">
                      {btn.title}
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-neutral-400 group-hover:text-red-400 transition-colors shrink-0" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        </main>
      </div>

      {/* ========================================================================= */}
      {/* 4. SUPERIMPOSED OVERLAYS (PANTALLAS SUPERPUESTAS)                         */}
      {/* ========================================================================= */}

      {/* OVERLAY 1: TIRES SELECTION MODAL */}
      {activeOverlay === 'tires' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-xl max-h-[94vh] rounded-2xl sm:rounded-3xl bg-neutral-900 border border-white/20 p-3 sm:p-5 shadow-2xl relative flex flex-col justify-between overflow-hidden">
            <div className="flex items-center justify-between mb-2 sm:mb-3 border-b border-white/10 pb-2 flex-shrink-0">
              <div className="flex items-center gap-2">
                <Disc className="w-4 h-4 sm:w-5 sm:h-5 text-red-500" />
                <div>
                  <h3 className="text-xs sm:text-sm md:text-base font-black uppercase tracking-wider text-white font-mono leading-tight">
                    COMPUESTO DE NEUMÁTICOS PIRELLI
                  </h3>
                  <p className="text-[9px] sm:text-[10px] text-neutral-400">Estrategia de salida y agarre en pista</p>
                </div>
              </div>
              <button
                onClick={() => {
                  playUiClick(700);
                  setActiveOverlay('none');
                }}
                className="p-1 sm:p-1.5 rounded-full text-neutral-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 flex-1 min-h-0 items-stretch">
              {[
                {
                  id: 'soft' as TireCompoundType,
                  name: 'BLANDO C4',
                  colorName: 'ROJO',
                  desc: 'Máximo agarre instantáneo y tracción.',
                  range: '8-10 Vueltas',
                  grip: '100% Agarre',
                  degrad: 'Alta degradación',
                  color: 'bg-red-600',
                  border: 'border-red-500',
                  glow: 'shadow-[0_0_15px_rgba(239,68,68,0.4)]',
                },
                {
                  id: 'medium' as TireCompoundType,
                  name: 'MEDIO C3',
                  colorName: 'AMARILLO',
                  desc: 'Compuesto equilibrado para ritmo sostenido.',
                  range: '18-22 Vueltas',
                  grip: '92% Agarre',
                  degrad: 'Degradación media',
                  color: 'bg-yellow-500',
                  border: 'border-yellow-400',
                  glow: 'shadow-[0_0_15px_rgba(234,179,8,0.4)]',
                },
                {
                  id: 'hard' as TireCompoundType,
                  name: 'DURO C2',
                  colorName: 'BLANCO',
                  desc: 'Resistencia extrema para stint largo.',
                  range: '35+ Vueltas',
                  grip: '84% Agarre',
                  degrad: 'Mínima degradación',
                  color: 'bg-neutral-100',
                  border: 'border-neutral-200',
                  glow: 'shadow-[0_0_15px_rgba(255,255,255,0.4)]',
                },
              ].map((tire) => {
                const isSelected = startingCompound === tire.id;
                return (
                  <button
                    key={tire.id}
                    onClick={() => {
                      playUiClick(750);
                      setStartingCompound(tire.id);
                    }}
                    onMouseEnter={playUiHover}
                    className={`p-2.5 sm:p-3 rounded-xl sm:rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between select-none ${
                      isSelected
                        ? `bg-white/15 ${tire.border} text-white ${tire.glow}`
                        : 'bg-white/5 border-white/10 hover:border-white/20 text-neutral-300'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full ${tire.color} shadow-md flex items-center justify-center shrink-0 border-2 border-black/50`}>
                        <Disc className="w-4 h-4 sm:w-5 sm:h-5 text-black/70" />
                      </div>
                      {isSelected ? (
                        <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-white shrink-0" />
                      ) : (
                        <span className="text-[9px] font-mono text-neutral-500 uppercase">{tire.colorName}</span>
                      )}
                    </div>
                    <div className="mt-2">
                      <div className="text-xs sm:text-sm font-black text-white leading-tight">{tire.name}</div>
                      <div className="text-[10px] sm:text-[11px] text-amber-300 font-mono mt-0.5">{tire.range}</div>
                      <div className="text-[9px] sm:text-[10px] text-neutral-400 mt-1 leading-snug">{tire.desc}</div>
                      <div className="flex items-center justify-between mt-1.5 pt-1.5 border-t border-white/10 text-[8.5px] sm:text-[9.5px] font-mono">
                        <span className="text-emerald-400 font-bold">{tire.grip}</span>
                        <span className="text-neutral-400">{tire.degrad}</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => {
                playUiClick(700);
                setActiveOverlay('none');
              }}
              className="w-full mt-2.5 sm:mt-3 py-2 sm:py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white font-bold text-xs uppercase tracking-wider transition-all cursor-pointer font-mono flex-shrink-0"
            >
              CONFIRMAR NEUMÁTICOS
            </button>
          </div>
        </div>
      )}

      {/* OVERLAY 2: CIRCUIT SELECTION MODAL */}
      {activeOverlay === 'circuit' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-2xl max-h-[94vh] rounded-2xl sm:rounded-3xl bg-neutral-900 border border-white/20 p-3 sm:p-5 shadow-2xl relative flex flex-col justify-between overflow-hidden">
            <div className="flex items-center justify-between mb-2 sm:mb-3 border-b border-white/10 pb-2 flex-shrink-0">
              <div className="flex items-center gap-2">
                <Compass className="w-4 h-4 sm:w-5 sm:h-5 text-red-500" />
                <div>
                  <h3 className="text-xs sm:text-sm md:text-base font-black uppercase tracking-wider text-white font-mono leading-tight">
                    SELECCIÓN DE CIRCUITO FIA
                  </h3>
                  <p className="text-[9px] sm:text-[10px] text-neutral-400">Trazado oficial para la carrera</p>
                </div>
              </div>
              <button
                onClick={() => {
                  playUiClick(700);
                  setActiveOverlay('none');
                }}
                className="p-1 sm:p-1.5 rounded-full text-neutral-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2 flex-1 min-h-0 items-stretch">
              {AVAILABLE_CIRCUITS.map((c) => {
                const isSelected = selectedCircuit === c.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => handleSelectCircuitLocal(c.id)}
                    onMouseEnter={playUiHover}
                    className={`p-2.5 sm:p-3 rounded-xl sm:rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between select-none ${
                      isSelected
                        ? 'bg-red-600/25 border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.4)] text-white'
                        : 'bg-white/5 border-white/10 hover:border-white/30 text-neutral-300'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-xl sm:text-2xl">{c.flagEmoji || '🏁'}</span>
                      {isSelected && <CheckCircle2 className="w-4 h-4 text-red-400" />}
                    </div>
                    <div className="mt-2">
                      <div className="text-[11px] sm:text-xs md:text-sm font-black uppercase tracking-wide truncate">{c.name}</div>
                      <div className="text-[9px] sm:text-[10px] text-neutral-300 mt-0.5 font-mono">
                        {(c.totalLength / 1000).toFixed(1)} km · {c.cornersCount} Curvas
                      </div>
                      <div className="text-[8.5px] sm:text-[9.5px] text-amber-400 mt-0.5 font-mono font-bold">
                        V. Máx: {c.topSpeedKmh} km/h
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => {
                playUiClick(700);
                setActiveOverlay('none');
              }}
              className="w-full mt-2.5 sm:mt-3 py-2 sm:py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white font-bold text-xs uppercase tracking-wider transition-all cursor-pointer font-mono flex-shrink-0"
            >
              CONFIRMAR CIRCUITO
            </button>
          </div>
        </div>
      )}

      {/* OVERLAY 3: LAPS & DISTANCE MODAL */}
      {activeOverlay === 'laps' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-lg max-h-[94vh] rounded-2xl sm:rounded-3xl bg-neutral-900 border border-white/20 p-3 sm:p-5 shadow-2xl relative flex flex-col justify-between overflow-hidden">
            <div className="flex items-center justify-between mb-2 sm:mb-3 border-b border-white/10 pb-2 flex-shrink-0">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
                <div>
                  <h3 className="text-xs sm:text-sm md:text-base font-black uppercase tracking-wider text-white font-mono leading-tight">
                    DURACIÓN DEL GRAN PREMIO
                  </h3>
                  <p className="text-[9px] sm:text-[10px] text-neutral-400">Selecciona el número de vueltas</p>
                </div>
              </div>
              <button
                onClick={() => {
                  playUiClick(700);
                  setActiveOverlay('none');
                }}
                className="p-1 sm:p-1.5 rounded-full text-neutral-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 flex-1 min-h-0 items-stretch font-mono">
              {[
                { val: 9 as RaceLapOption, label: '9 VUELTAS', sub: 'Sprint Rápido', desc: 'Carrera corta de alta intensidad' },
                { val: 20 as RaceLapOption, label: '20 VUELTAS', sub: 'Estándar FIA', desc: 'Con ventana táctica de pit stop' },
                { val: 50 as RaceLapOption, label: '50 VUELTAS', sub: 'Resistencia Completa', desc: 'Duración oficial FIA y desgaste' },
              ].map((item) => (
                <button
                  key={item.val}
                  onClick={() => {
                    playUiClick(700);
                    setLaps(item.val);
                  }}
                  onMouseEnter={playUiHover}
                  className={`p-2.5 sm:p-3 rounded-xl sm:rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between select-none ${
                    laps === item.val
                      ? 'bg-amber-500/25 border-amber-400 text-white shadow-[0_0_15px_rgba(245,158,11,0.3)]'
                      : 'bg-white/5 border-white/10 hover:border-white/20 text-neutral-300'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-xs sm:text-sm font-black">{item.label}</span>
                    {laps === item.val && <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />}
                  </div>
                  <div className="mt-1.5">
                    <div className="text-[10.5px] sm:text-xs text-amber-300 font-bold">{item.sub}</div>
                    <div className="text-[9px] sm:text-[10px] text-neutral-400 mt-0.5 line-clamp-2">{item.desc}</div>
                    <div className="text-[8.5px] sm:text-[9.5px] text-cyan-300 font-bold mt-1">Est: {calculateEstimatedTime(item.val)}</div>
                  </div>
                </button>
              ))}
            </div>

            <button
              onClick={() => {
                playUiClick(700);
                setActiveOverlay('none');
              }}
              className="w-full mt-2.5 sm:mt-3 py-2 sm:py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white font-bold text-xs uppercase tracking-wider transition-all cursor-pointer font-mono flex-shrink-0"
            >
              CONFIRMAR DURACIÓN
            </button>
          </div>
        </div>
      )}

      {/* OVERLAY 4: AI DIFFICULTY MODAL */}
      {activeOverlay === 'difficulty' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-lg max-h-[94vh] rounded-2xl sm:rounded-3xl bg-neutral-900 border border-white/20 p-3 sm:p-5 shadow-2xl relative flex flex-col justify-between overflow-hidden">
            <div className="flex items-center justify-between mb-2 sm:mb-3 border-b border-white/10 pb-2 flex-shrink-0">
              <div className="flex items-center gap-2">
                <Swords className="w-4 h-4 sm:w-5 sm:h-5 text-red-500" />
                <div>
                  <h3 className="text-xs sm:text-sm md:text-base font-black uppercase tracking-wider text-white font-mono leading-tight">
                    NIVEL DE COMPETITIVIDAD (IA)
                  </h3>
                  <p className="text-[9px] sm:text-[10px] text-neutral-400">Agresividad y ritmo de los rivales</p>
                </div>
              </div>
              <button
                onClick={() => {
                  playUiClick(700);
                  setActiveOverlay('none');
                }}
                className="p-1 sm:p-1.5 rounded-full text-neutral-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 flex-1 min-h-0 items-stretch font-mono">
              {[
                { id: 'easy' as RaceDifficulty, name: 'NOVATO', desc: 'Frenadas anticipadas y trazadas suaves.', tag: 'Accesible' },
                { id: 'medium' as RaceDifficulty, name: 'INTERMEDIO', desc: 'Ritmo competitivo y adelantamientos.', tag: 'Equilibrado' },
                { id: 'hard' as RaceDifficulty, name: 'LEYENDA FIA', desc: 'Frenadas al límite y ritmo récord.', tag: 'Experto' },
              ].map((diff) => (
                <button
                  key={diff.id}
                  onClick={() => {
                    playUiClick(700);
                    setDifficulty(diff.id);
                  }}
                  onMouseEnter={playUiHover}
                  className={`p-2.5 sm:p-3 rounded-xl sm:rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between select-none ${
                    difficulty === diff.id
                      ? 'bg-red-600/25 border-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.3)]'
                      : 'bg-white/5 border-white/10 hover:border-white/20 text-neutral-300'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-xs sm:text-sm font-black">{diff.name}</span>
                    {difficulty === diff.id && <CheckCircle2 className="w-4 h-4 text-red-400 shrink-0" />}
                  </div>
                  <div className="mt-1.5">
                    <span className="text-[9px] font-mono text-red-400 block font-bold uppercase">{diff.tag}</span>
                    <div className="text-[9px] sm:text-[10px] text-neutral-300 mt-1 line-clamp-3 leading-snug">{diff.desc}</div>
                  </div>
                </button>
              ))}
            </div>

            <button
              onClick={() => {
                playUiClick(700);
                setActiveOverlay('none');
              }}
              className="w-full mt-2.5 sm:mt-3 py-2 sm:py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white font-bold text-xs uppercase tracking-wider transition-all cursor-pointer font-mono flex-shrink-0"
            >
              CONFIRMAR DIFICULTAD
            </button>
          </div>
        </div>
      )}

      {/* OVERLAY 5: LIVERY & DRIVER IDENTITY MODAL */}
      {activeOverlay === 'livery' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-2xl max-h-[94vh] rounded-2xl sm:rounded-3xl bg-neutral-900 border border-white/20 p-3 sm:p-5 shadow-2xl relative flex flex-col justify-between overflow-hidden">
            <div className="flex items-center justify-between mb-2 sm:mb-3 border-b border-white/10 pb-2 flex-shrink-0">
              <div className="flex items-center gap-2">
                <Palette className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400" />
                <div>
                  <h3 className="text-xs sm:text-sm md:text-base font-black uppercase tracking-wider text-white font-mono leading-tight">
                    IDENTIDAD DE ESCUDERÍA Y PILOTO
                  </h3>
                  <p className="text-[9px] sm:text-[10px] text-neutral-400">Personaliza nombre, dorsal y colores del monoplaza</p>
                </div>
              </div>
              <button
                onClick={() => {
                  playUiClick(700);
                  setActiveOverlay('none');
                }}
                className="p-1 sm:p-1.5 rounded-full text-neutral-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 flex-1 min-h-0 items-start">
              {/* Left Column: Inputs */}
              <div className="space-y-2">
                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2">
                    <label className="text-[9px] font-mono text-neutral-400 block mb-0.5 uppercase">Nombre del Piloto</label>
                    <input
                      type="text"
                      value={driverDisplayName}
                      onChange={(e) => setDriverDisplayName(e.target.value)}
                      maxLength={20}
                      className="w-full px-2.5 py-1.5 rounded-xl bg-black/60 border border-white/15 text-white text-xs font-bold font-mono focus:border-red-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-mono text-neutral-400 block mb-0.5 uppercase">Dorsal (#)</label>
                    <input
                      type="text"
                      value={carNumber}
                      onChange={(e) => setCarNumber(e.target.value.replace(/[^0-9]/g, '').slice(0, 2))}
                      maxLength={2}
                      className="w-full px-2.5 py-1.5 rounded-xl bg-black/60 border border-white/15 text-white text-xs font-bold font-mono focus:border-red-500 focus:outline-none text-center"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[9px] font-mono text-neutral-400 block mb-0.5 uppercase">Nombre de Escudería</label>
                  <input
                    type="text"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    maxLength={25}
                    className="w-full px-2.5 py-1.5 rounded-xl bg-black/60 border border-white/15 text-white text-xs font-bold font-mono focus:border-red-500 focus:outline-none"
                  />
                </div>

                {onOpenLiveryStudio && (
                  <button
                    onClick={() => {
                      playUiClick(750);
                      setActiveOverlay('none');
                      onOpenLiveryStudio();
                    }}
                    className="w-full py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 text-amber-300 text-[10px] sm:text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 mt-1"
                  >
                    <Palette className="w-3.5 h-3.5" />
                    <span>ABRIR TALLER COMPLETO DE LIBREAS</span>
                  </button>
                )}
              </div>

              {/* Right Column: 6 Color Palettes in compact 3x2 grid */}
              <div>
                <label className="text-[9px] font-mono text-neutral-400 block mb-1 uppercase">Paletas de Colores de Competición</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { name: 'Red Bull Racing', p: '#040814', s: '#cc0022', a: '#fec008' },
                    { name: 'Ferrari Corsa', p: '#dc2626', s: '#facc15', a: '#ffffff' },
                    { name: 'Mercedes Silver', p: '#94a3b8', s: '#06b6d4', a: '#10b981' },
                    { name: 'McLaren Papaya', p: '#f97316', s: '#0284c7', a: '#ffffff' },
                    { name: 'Aston Emerald', p: '#064e3b', s: '#10b981', a: '#fbbf24' },
                    { name: 'Stealth Carbon', p: '#18181b', s: '#d97706', a: '#fbbf24' },
                  ].map((preset) => (
                    <button
                      key={preset.name}
                      onClick={() => {
                        playUiClick(700);
                        setPrimaryColor(preset.p);
                        setSecondaryColor(preset.s);
                        setAccentColor(preset.a);
                        setTeamName(preset.name);
                      }}
                      className="p-1.5 sm:p-2 rounded-xl bg-white/5 border border-white/10 hover:border-white/30 text-left transition-all cursor-pointer flex flex-col justify-between"
                    >
                      <div className="flex gap-1 mb-1">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: preset.p }} />
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: preset.s }} />
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: preset.a }} />
                      </div>
                      <span className="text-[8.5px] sm:text-[9.5px] font-bold text-neutral-300 block truncate">{preset.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                playUiClick(700);
                setActiveOverlay('none');
              }}
              className="w-full mt-2.5 sm:mt-3 py-2 sm:py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white font-bold text-xs uppercase tracking-wider transition-all cursor-pointer font-mono flex-shrink-0"
            >
              GUARDAR Y CONFIRMAR
            </button>
          </div>
        </div>
      )}

      {/* OVERLAY 6: ASSISTS & SETUP MODAL */}
      {activeOverlay === 'setup' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-xl max-h-[94vh] rounded-2xl sm:rounded-3xl bg-neutral-900 border border-white/20 p-3 sm:p-5 shadow-2xl relative flex flex-col justify-between overflow-hidden">
            <div className="flex items-center justify-between mb-2 sm:mb-3 border-b border-white/10 pb-2 flex-shrink-0">
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400" />
                <div>
                  <h3 className="text-xs sm:text-sm md:text-base font-black uppercase tracking-wider text-white font-mono leading-tight">
                    AYUDAS DE CONDUCCIÓN Y CÁMARA
                  </h3>
                  <p className="text-[9px] sm:text-[10px] text-neutral-400">Calibra las asistencias electrónicas</p>
                </div>
              </div>
              <button
                onClick={() => {
                  playUiClick(700);
                  setActiveOverlay('none');
                }}
                className="p-1 sm:p-1.5 rounded-full text-neutral-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 flex-1 min-h-0 font-mono text-xs">
              {/* TC */}
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                <div>
                  <div className="font-bold text-white text-[11px] sm:text-xs">Control de Tracción (TC)</div>
                  <div className="text-[8.5px] sm:text-[9.5px] text-neutral-400">Evita el derrape en aceleración</div>
                </div>
                <button
                  onClick={() => {
                    playUiClick(700);
                    setTractionControl(!tractionControl);
                  }}
                  className={`px-2.5 py-1 rounded-lg font-bold cursor-pointer transition-colors text-[10px] sm:text-xs ${
                    tractionControl ? 'bg-emerald-500 text-black' : 'bg-neutral-800 text-neutral-400'
                  }`}
                >
                  {tractionControl ? 'ACTIVO' : 'OFF'}
                </button>
              </div>

              {/* ABS */}
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                <div>
                  <div className="font-bold text-white text-[11px] sm:text-xs">Antibloqueo (ABS)</div>
                  <div className="text-[8.5px] sm:text-[9.5px] text-neutral-400">Impide bloqueo de ruedas</div>
                </div>
                <button
                  onClick={() => {
                    playUiClick(700);
                    setAbsEnabled(!absEnabled);
                  }}
                  className={`px-2.5 py-1 rounded-lg font-bold cursor-pointer transition-colors text-[10px] sm:text-xs ${
                    absEnabled ? 'bg-emerald-500 text-black' : 'bg-neutral-800 text-neutral-400'
                  }`}
                >
                  {absEnabled ? 'ACTIVO' : 'OFF'}
                </button>
              </div>

              {/* Racing Line */}
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                <div>
                  <div className="font-bold text-white text-[11px] sm:text-xs">Trazada Dinámica FIA</div>
                  <div className="text-[8.5px] sm:text-[9.5px] text-neutral-400">Trayectoria y frenada óptima</div>
                </div>
                <button
                  onClick={() => {
                    playUiClick(700);
                    setRacingLine(!racingLine);
                  }}
                  className={`px-2.5 py-1 rounded-lg font-bold cursor-pointer transition-colors text-[10px] sm:text-xs ${
                    racingLine ? 'bg-emerald-500 text-black' : 'bg-neutral-800 text-neutral-400'
                  }`}
                >
                  {racingLine ? 'ACTIVO' : 'OFF'}
                </button>
              </div>

              {/* Camera Mode */}
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex flex-col justify-between">
                <div className="font-bold text-white text-[11px] sm:text-xs mb-1">Cámara Principal</div>
                <div className="grid grid-cols-4 gap-1 text-center text-[9px] sm:text-[10px]">
                  {[
                    { id: 'chase' as CameraViewMode, name: 'TERCERA' },
                    { id: 'bumper' as CameraViewMode, name: 'MORRO' },
                    { id: 'hood' as CameraViewMode, name: 'CAPÓ' },
                    { id: 'orbit' as CameraViewMode, name: 'ÓRBITA' },
                  ].map((cm) => (
                    <button
                      key={cm.id}
                      onClick={() => {
                        playUiClick(700);
                        setCameraMode(cm.id);
                      }}
                      className={`py-1 rounded-lg border transition-all cursor-pointer font-bold ${
                        cameraMode === cm.id
                          ? 'bg-cyan-500/25 border-cyan-400 text-white'
                          : 'bg-white/5 border-white/10 text-neutral-400'
                      }`}
                    >
                      {cm.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                playUiClick(700);
                setActiveOverlay('none');
              }}
              className="w-full mt-2.5 sm:mt-3 py-2 sm:py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white font-bold text-xs uppercase tracking-wider transition-all cursor-pointer font-mono flex-shrink-0"
            >
              CONFIRMAR REGLAJES
            </button>
          </div>
        </div>
      )}

      {/* OVERLAY 7: MULTIPLAYER LOBBY MODAL */}
      {activeOverlay === 'multiplayer_modal' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-lg max-h-[94vh] rounded-2xl sm:rounded-3xl bg-neutral-900 border border-white/20 p-3 sm:p-5 shadow-2xl relative flex flex-col justify-between overflow-hidden">
            <div className="flex items-center justify-between mb-2 sm:mb-3 border-b border-white/10 pb-2 flex-shrink-0">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
                <div>
                  <h3 className="text-xs sm:text-sm md:text-base font-black uppercase tracking-wider text-white font-mono leading-tight">
                    LOBBY MULTIJUGADOR 1V1
                  </h3>
                  <p className="text-[9px] sm:text-[10px] text-neutral-400">Servidor en tiempo real con WebSocket</p>
                </div>
              </div>
              <button
                onClick={() => {
                  playUiClick(700);
                  setActiveOverlay('none');
                }}
                className="p-1 sm:p-1.5 rounded-full text-neutral-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>

            {errorMessage && (
              <div className="p-2 mb-2 rounded-xl bg-red-950/60 border border-red-500/40 text-red-200 text-xs flex items-center gap-2">
                <AlertCircle className="w-3.5 h-3.5 shrink-0 text-red-400" />
                <span>{errorMessage}</span>
              </div>
            )}

            {!roomState ? (
              <div className="space-y-2.5 flex-1 min-h-0">
                <div className="flex rounded-xl bg-white/5 p-1 border border-white/10 font-mono text-xs">
                  <button
                    onClick={() => setMpTab('create')}
                    className={`flex-1 py-1.5 rounded-lg font-bold transition-all ${
                      mpTab === 'create' ? 'bg-emerald-500 text-black' : 'text-neutral-400'
                    }`}
                  >
                    CREAR SALA
                  </button>
                  <button
                    onClick={() => setMpTab('join')}
                    className={`flex-1 py-1.5 rounded-lg font-bold transition-all ${
                      mpTab === 'join' ? 'bg-emerald-500 text-black' : 'text-neutral-400'
                    }`}
                  >
                    UNIRSE CON CÓDIGO
                  </button>
                </div>

                <div>
                  <label className="text-[9px] font-mono text-neutral-400 block mb-0.5 uppercase">Tu Alias de Piloto</label>
                  <input
                    type="text"
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    maxLength={16}
                    className="w-full px-2.5 py-1.5 rounded-xl bg-black/60 border border-white/15 text-white text-xs font-bold font-mono focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                {mpTab === 'create' ? (
                  <div>
                    <label className="text-[9px] font-mono text-neutral-400 block mb-0.5 uppercase">Vueltas del Duelo</label>
                    <div className="grid grid-cols-3 gap-1.5 font-mono text-xs">
                      {[3, 5, 10].map((v) => (
                        <button
                          key={v}
                          onClick={() => setMpLaps(v)}
                          className={`py-1.5 rounded-xl border font-bold transition-all ${
                            mpLaps === v
                              ? 'bg-emerald-500/30 border-emerald-400 text-white'
                              : 'bg-white/5 border-white/10 text-neutral-400'
                          }`}
                        >
                          {v} VUELTAS
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="text-[9px] font-mono text-neutral-400 block mb-0.5 uppercase">Código de Sala (4 Letras)</label>
                    <input
                      type="text"
                      value={joinCodeInput}
                      onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase().slice(0, 6))}
                      placeholder="Ej. ABCD"
                      className="w-full px-2.5 py-1.5 rounded-xl bg-black/60 border border-white/15 text-white text-sm font-black font-mono tracking-widest text-center focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                )}

                {mpTab === 'create' ? (
                  <button
                    onClick={handleCreateRoomAction}
                    disabled={isConnecting}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-neutral-950 font-black text-xs uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50 font-mono shadow-lg mt-1"
                  >
                    {isConnecting ? 'CONECTANDO...' : 'CREAR SALA Y ESPERAR RIVAL'}
                  </button>
                ) : (
                  <button
                    onClick={handleJoinRoomAction}
                    disabled={isConnecting || !joinCodeInput.trim()}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-neutral-950 font-black text-xs uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50 font-mono shadow-lg mt-1"
                  >
                    {isConnecting ? 'CONECTANDO...' : 'UNIRSE A LA SALA'}
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-2.5 font-mono text-xs flex-1 min-h-0">
                {/* Active Room Code Card */}
                <div className="p-3 rounded-2xl bg-black/60 border border-emerald-500/40 text-center">
                  <span className="text-[9px] text-neutral-400 uppercase tracking-widest block">Código de Invitación</span>
                  <div className="text-xl font-black text-emerald-400 tracking-widest mt-0.5">{roomState.code}</div>
                  <button
                    onClick={copyRoomCode}
                    className="mt-1.5 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 hover:bg-white/20 text-neutral-200 text-[9.5px] font-bold cursor-pointer transition-colors"
                  >
                    <Copy className="w-3 h-3" />
                    <span>{isCopied ? '¡COPIADO!' : 'COPIAR CÓDIGO'}</span>
                  </button>
                </div>

                {/* Slot P1 & P2 */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                    <span className="text-[8.5px] text-neutral-400 block">PILOTO 1</span>
                    <span className="font-bold text-white truncate block">{roomState.players.p1?.name || 'Esperando...'}</span>
                    <span className={`text-[9.5px] font-bold ${roomState.players.p1?.isReady ? 'text-emerald-400' : 'text-neutral-500'}`}>
                      {roomState.players.p1?.isReady ? '✓ LISTO' : 'NO PREPARADO'}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                    <span className="text-[8.5px] text-neutral-400 block">PILOTO 2</span>
                    <span className="font-bold text-white truncate block">{roomState.players.p2?.name || 'Esperando...'}</span>
                    <span className={`text-[9.5px] font-bold ${roomState.players.p2?.isReady ? 'text-emerald-400' : 'text-neutral-500'}`}>
                      {roomState.players.p2?.isReady ? '✓ LISTO' : 'NO PREPARADO'}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={handleToggleReady}
                    className={`flex-1 py-2 rounded-xl font-bold cursor-pointer transition-colors ${
                      isReady ? 'bg-emerald-500 text-black' : 'bg-white/15 text-white hover:bg-white/25'
                    }`}
                  >
                    {isReady ? '✓ LISTO' : 'MARCAR LISTO'}
                  </button>
                  <button
                    onClick={onLeaveRoom}
                    className="px-3 py-2 rounded-xl bg-red-600/30 border border-red-500/40 text-red-300 hover:bg-red-600/50 font-bold cursor-pointer transition-colors"
                  >
                    SALIR
                  </button>
                </div>

                {playerId === 'p1' && (
                  <button
                    onClick={() => {
                      playUiClick(950);
                      onStartMultiplayerRace();
                    }}
                    disabled={!roomState.players.p1?.isReady || !roomState.players.p2?.isReady}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 disabled:opacity-40 text-black font-black uppercase tracking-wider cursor-pointer shadow-lg"
                  >
                    INICIAR DUELO (AMBOS LISTOS)
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* OVERLAY 8: CONTROLS GUIDE MODAL */}
      {showControlsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-lg max-h-[94vh] rounded-2xl sm:rounded-3xl bg-neutral-900 border border-white/20 p-3 sm:p-5 shadow-2xl relative flex flex-col justify-between overflow-hidden">
            <div className="flex items-center justify-between mb-2 sm:mb-3 border-b border-white/10 pb-2 flex-shrink-0">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-400" />
                <h3 className="text-xs sm:text-sm md:text-base font-black uppercase tracking-wider text-white font-mono leading-tight">GUÍA DE CONTROLES</h3>
              </div>
              <button
                onClick={() => {
                  playUiClick(700);
                  setShowControlsModal(false);
                }}
                className="p-1 sm:p-1.5 rounded-full text-neutral-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs flex-1 min-h-0">
              <div className="p-2 sm:p-2.5 rounded-xl bg-white/5 border border-white/10 flex flex-col justify-between">
                <span className="font-bold text-white text-[11px] sm:text-xs">Acelerar / Freno</span>
                <span className="font-mono text-amber-400 bg-white/10 px-2 py-0.5 rounded text-[10px] sm:text-[11px] mt-1 text-center">W / S o Flechas ↑ / ↓</span>
              </div>
              <div className="p-2 sm:p-2.5 rounded-xl bg-white/5 border border-white/10 flex flex-col justify-between">
                <span className="font-bold text-white text-[11px] sm:text-xs">Girar Dirección</span>
                <span className="font-mono text-amber-400 bg-white/10 px-2 py-0.5 rounded text-[10px] sm:text-[11px] mt-1 text-center">A / D o Flechas ← / →</span>
              </div>
              <div className="p-2 sm:p-2.5 rounded-xl bg-white/5 border border-white/10 flex flex-col justify-between">
                <span className="font-bold text-white text-[11px] sm:text-xs">Freno de Mano / Derrape</span>
                <span className="font-mono text-amber-400 bg-white/10 px-2 py-0.5 rounded text-[10px] sm:text-[11px] mt-1 text-center">Espacio (Space)</span>
              </div>
              <div className="p-2 sm:p-2.5 rounded-xl bg-white/5 border border-white/10 flex flex-col justify-between">
                <span className="font-bold text-white text-[11px] sm:text-xs">Cambiar Cámara</span>
                <span className="font-mono text-cyan-400 bg-white/10 px-2 py-0.5 rounded text-[10px] sm:text-[11px] mt-1 text-center">Tecla C</span>
              </div>
              <div className="p-2 sm:p-2.5 rounded-xl bg-white/5 border border-white/10 flex flex-col justify-between">
                <span className="font-bold text-white text-[11px] sm:text-xs">Pausa / Menú</span>
                <span className="font-mono text-red-400 bg-white/10 px-2 py-0.5 rounded text-[10px] sm:text-[11px] mt-1 text-center">Escape (ESC)</span>
              </div>
              <div className="p-2 sm:p-2.5 rounded-xl bg-white/5 border border-white/10 flex flex-col justify-between">
                <span className="font-bold text-white text-[11px] sm:text-xs">Pantalla Completa</span>
                <span className="font-mono text-white bg-white/10 px-2 py-0.5 rounded text-[10px] sm:text-[11px] mt-1 text-center">Tecla F</span>
              </div>
            </div>

            <button
              onClick={() => {
                playUiClick(700);
                setShowControlsModal(false);
              }}
              className="w-full mt-2.5 sm:mt-3 py-2 sm:py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white font-bold text-xs uppercase tracking-wider transition-all cursor-pointer font-mono flex-shrink-0"
            >
              ENTENDIDO
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
