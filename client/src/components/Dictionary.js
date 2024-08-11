import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence, useSpring } from 'framer-motion';
import { onAuthStateChanged } from "firebase/auth";
import { collection, addDoc, query, where, limit, getDocs, getDoc, doc, setDoc, deleteDoc, orderBy, updateDoc } from "firebase/firestore";
import { analytics, auth, db, appCheck } from '../services/firebase_init.mjs';
import { 
  TextField, Button, Card, CardContent, Typography, Modal, 
  Box, CircularProgress, Snackbar, Alert, Container, Grid,
  Paper, IconButton, Tooltip, ThemeProvider, createTheme,
  List, ListItem, ListItemText, Tabs, Tab, AppBar, Toolbar,
  Select, MenuItem, ListItemIcon, Switch, Slider, useMediaQuery,
  ListItemButton
} from '@mui/material';
import AnimatedNavigation from './AnimatedNavigation';
import Logo3D from './Logo3D';
import { styled } from '@mui/system';
import SearchIcon from '@mui/icons-material/Search';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import HistoryIcon from '@mui/icons-material/History';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import DeleteIcon from '@mui/icons-material/Delete';
import ClearAllIcon from '@mui/icons-material/ClearAll';
import LanguageIcon from '@mui/icons-material/Language';
import MicIcon from '@mui/icons-material/Mic';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import AccessibilityNewIcon from '@mui/icons-material/AccessibilityNew';
import { formatRelative, format, parseISO } from 'date-fns';
import { enUS, es, fr, de, it, pt, ru, zhCN, ja, ko, ar, hi } from 'date-fns/locale';

const NeumorphicBox = styled(Box)(({ theme }) => ({
  borderRadius: 15,
  background: theme.palette.background.default,
  boxShadow: theme.palette.mode === 'dark'
    ? '5px 5px 10px #1a1a1a, -5px -5px 10px #242424'
    : '5px 5px 10px #d9d9d9, -5px -5px 10px #ffffff',
  padding: theme.spacing(3),
  transition: 'all 0.3s ease-in-out',
  '&:hover': {
    transform: 'translateY(-5px)',
  },
}));

const GlassBox = styled(Box)(({ theme }) => ({
  background: theme.palette.mode === 'dark'
    ? 'rgba(18, 18, 18, 0.8)'
    : 'rgba(255, 255, 255, 0.8)',
  backdropFilter: 'blur(10px)',
  borderRadius: 15,
  padding: theme.spacing(3),
  boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
}));

const LANGUAGES = [
  { code: 'en', ttsCode: 'en-US', name: 'English', icon: 'us', emoji: '🇺🇸' },
  { code: 'es', ttsCode: 'es-ES', name: 'Español', icon: 'es', emoji: '🇪🇸' },
  { code: 'fr', ttsCode: 'fr-FR', name: 'Français', icon: 'fr', emoji: '🇫🇷' },
  { code: 'de', ttsCode: 'de-DE', name: 'Deutsch', icon: 'de', emoji: '🇩🇪' },
  { code: 'it', ttsCode: 'it-IT', name: 'Italiano', icon: 'it', emoji: '🇮🇹' },
  { code: 'pt', ttsCode: 'pt-PT', name: 'Português', icon: 'pt', emoji: '🇵🇹' },
  { code: 'ru', ttsCode: 'ru-RU', name: 'Русский', icon: 'ru', emoji: '🇷🇺' },
  { code: 'zh', ttsCode: 'zh-CN', name: '中文', icon: 'cn', emoji: '🇨🇳' },
  { code: 'ja', ttsCode: 'ja-JP', name: '日本語', icon: 'jp', emoji: '🇯🇵' },
  { code: 'ko', ttsCode: 'ko-KR', name: '한국어', icon: 'kr', emoji: '🇰🇷' },
  { code: 'ar', ttsCode: 'ar-XA', name: 'العربية', icon: 'sa', emoji: '🇸🇦' },
  { code: 'hi', ttsCode: 'hi-IN', name: 'हिन्दी', icon: 'in', emoji: '🇮🇳' },
];
const locales = {
  en: enUS,
  es: es,
  fr: fr,
  de: de,
  it: it,
  pt: pt,
  ru: ru,
  zh: zhCN,
  ja: ja,
  ko: ko,
  ar: ar,
  hi: hi,
};

const Dictionary = () => {
  const [word, setWord] = useState('');
  const [definitions, setDefinitions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [selectedDefinition, setSelectedDefinition] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [bookmarks, setBookmarks] = useState(() => {
    const cachedBookmarks = localStorage.getItem('bookmarks');
    return cachedBookmarks ? JSON.parse(cachedBookmarks) : {};
  });
  const [error, setError] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [searchHistory, setSearchHistory] = useState(() => {
    const cachedHistory = localStorage.getItem('searchHistory');
    return cachedHistory ? JSON.parse(cachedHistory) : [];
  });
  const [selectedLanguage, setSelectedLanguage] = useState(() => {
    return localStorage.getItem('selectedLanguage') || 'en';
  });
  const [darkMode, setDarkMode] = useState(false);
  const [fontSizeScaling, setFontSizeScaling] = useState(1);
  const [highContrastMode, setHighContrastMode] = useState(false);
  const [aiRecommendations, setAiRecommendations] = useState([]);
  const [gesture, setGesture] = useState({ x: 0, y: 0 });
  const containerRef = useRef(null);
  const isMobile = useMediaQuery('(max-width:600px)');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentAudio, setCurrentAudio] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [userPreferences, setUserPreferences] = useState(null);
  const [isSpeechRecognitionSupported, setIsSpeechRecognitionSupported] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState(null);

  const theme = createTheme({
    palette: {
      mode: darkMode ? 'dark' : 'light',
      primary: {
        main: darkMode ? '#90caf9' : '#1976d2',
      },
      secondary: {
        main: darkMode ? '#f48fb1' : '#dc004e',
      },
      background: {
        default: darkMode ? '#121212' : '#f0f2f5',
        paper: darkMode ? '#1e1e1e' : '#ffffff',
      },
    },
    typography: {
      fontSize: 14 * fontSizeScaling,
    },
    shape: {
      borderRadius: 12,
    },
  });
  
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        console.log('User is signed in:', currentUser.uid);
        setUser(currentUser);
        const prefs = await loadUserPreferences(currentUser.uid);
        setUserPreferences(prefs);
        setSelectedLanguage(prefs.language || 'en');
        await loadBookmarks(currentUser.uid);
        await loadSearchHistory(currentUser.uid);
        fetchAiRecommendations(currentUser.uid);
      } else {
        setUser(null);
        setBookmarks({});
        setSearchHistory([]);
        window.location.replace('/authentication');
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    localStorage.setItem('selectedLanguage', selectedLanguage);
  }, [selectedLanguage]);

  useEffect(() => {
    localStorage.setItem('searchHistory', JSON.stringify(searchHistory));
  }, [searchHistory]);

  useEffect(() => {
    localStorage.setItem('bookmarks', JSON.stringify(bookmarks));
  }, [bookmarks]);

  useEffect(() => {
    const validateAndUpdateHistory = (history) => {
      return history.map(item => ({
        ...item,
        id: item.id || Date.now().toString(),
        timestamp: item.timestamp ? new Date(item.timestamp).toISOString() : new Date().toISOString()
      }));
    };
  
    const cachedHistory = localStorage.getItem('searchHistory');
    if (cachedHistory) {
      try {
        const parsedHistory = JSON.parse(cachedHistory);
        const validatedHistory = validateAndUpdateHistory(parsedHistory);
        setSearchHistory(validatedHistory);
        localStorage.setItem('searchHistory', JSON.stringify(validatedHistory));
      } catch (error) {
        console.error('Error parsing search history:', error);
        setSearchHistory([]);
        localStorage.removeItem('searchHistory');
      }
    }
  }, []);

  useEffect(() => {
    setIsSpeechRecognitionSupported('webkitSpeechRecognition' in window);
  }, []);

  useEffect(() => {
    return () => {
      if (recognition) {
        recognition.stop();
      }
    };
  }, [recognition]);

  const loadUserPreferences = async (userId) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        return userDoc.data().preferences || {};
      }
      return {};
    } catch (error) {
      console.error('Error loading user preferences:', error);
      return {};
    }
  };

  const loadBookmarks = async (userId) => {
    const cachedBookmarks = localStorage.getItem('bookmarks');
    if (cachedBookmarks) {
      setBookmarks(JSON.parse(cachedBookmarks));
      return;
    }

    try {
      const bookmarksRef = collection(db, 'users', userId, 'bookmarks');
      const bookmarksSnapshot = await getDocs(bookmarksRef);
      const bookmarksData = {};
      bookmarksSnapshot.forEach(doc => {
        bookmarksData[doc.id] = doc.data();
      });
      setBookmarks(bookmarksData);
      localStorage.setItem('bookmarks', JSON.stringify(bookmarksData));
    } catch (error) {
      console.error('Error loading bookmarks:', error);
      setSnackbar({ open: true, message: 'Error loading bookmarks', severity: 'error' });
    }
  };

  const loadSearchHistory = async (userId) => {
    const cachedHistory = localStorage.getItem('searchHistory');
    if (cachedHistory) {
      const parsedHistory = JSON.parse(cachedHistory);
      const updatedHistory = parsedHistory.map(item => ({
        ...item,
        id: item.id || `${item.word}_${item.requestLanguage}_${Date.now()}`
      }));
      setSearchHistory(updatedHistory);
      localStorage.setItem('searchHistory', JSON.stringify(updatedHistory));
      return;
    }

    try {
      const historyRef = collection(db, 'users', userId, 'search_history');
      const historyQuery = query(
        historyRef, 
        where('isHidden', '==', false),
        orderBy('timestamp', 'desc'), 
        limit(10)
      );
      const historySnapshot = await getDocs(historyQuery);
      const historyData = historySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate().toISOString()
      }));
      setSearchHistory(historyData);
      localStorage.setItem('searchHistory', JSON.stringify(historyData));
    } catch (error) {
      console.error('Error loading search history:', error);
      setSnackbar({ open: true, message: 'Error loading search history', severity: 'error' });
    }
  };

  const updateSearchHistory = (newSearch) => {
    setSearchHistory(prevHistory => {
      const newItem = {
        ...newSearch,
        id: `${newSearch.word}_${newSearch.requestLanguage}_${Date.now()}`,
        timestamp: newSearch.timestamp ? new Date(newSearch.timestamp).toISOString() : new Date().toISOString()
      };
      const updatedHistory = [newItem, ...prevHistory.filter(item => item.id !== newItem.id)].slice(0, 10);
      localStorage.setItem('searchHistory', JSON.stringify(updatedHistory));
      return updatedHistory;
    });
  };

  const updateLanguagePreference = async (language) => {
    if (!user) {
      console.error('User is not authenticated');
      setSnackbar({ open: true, message: 'Please log in to update language preference', severity: 'error' });
      return;
    }

    setSelectedLanguage(language);
    setIsLoading(true);

    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/user/language-preference', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ language })
      });
      if (response.ok) {
        setSelectedLanguage(language);
        setUserPreferences(prev => ({ ...prev, language }));
        await updateDoc(doc(db, 'users', user.uid), {
          'preferences.language': language
        });
        setSnackbar({ open: true, message: 'Language preference updated', severity: 'success' });
      } else {
        throw new Error('Failed to update language preference');
      }
    } catch (error) {
      console.error('Error updating language preference:', error);
      setSnackbar({ open: true, message: 'Error updating language preference', severity: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const searchWord = useCallback(async (searchTerm = word, language = selectedLanguage) => {
    if (!searchTerm.trim()) {
      setSnackbar({ open: true, message: 'Please enter a word', severity: 'warning' });
      return;
    }
    setLoading(true);
    setError('');

    try {
      const cacheKey = `definitions_${searchTerm}_${language}`;
      const cachedDefinitions = JSON.parse(localStorage.getItem(cacheKey));
      if (cachedDefinitions) {
        setDefinitions(cachedDefinitions);
        updateSearchHistory({
          word: searchTerm,
          timestamp: new Date(),
          requestLanguage: language
        });
        setSnackbar({ open: true, message: 'Word found (cached)', severity: 'success' });
        setLoading(false);
        return;
      }

      const response = await fetch('/api/dictionary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await user.getIdToken()}`
        },
        body: JSON.stringify({ word: searchTerm, language: language })
      });

      if (!response.ok) throw new Error('Dictionary API request failed');

      const data = await response.json();
      setDefinitions(data.definitions);

      localStorage.setItem(cacheKey, JSON.stringify(data.definitions));
      
      updateSearchHistory({
        word: searchTerm,
        timestamp: new Date(),
        requestLanguage: language
      });
      
      setSnackbar({ open: true, message: 'Word found', severity: 'success' });
    } catch (error) {
      console.error('Error:', error);
      setDefinitions([]);
      setError('Failed to fetch definitions. Please try again.');
      setSnackbar({ open: true, message: 'Error searching word', severity: 'error' });
    } finally {
      setLoading(false);
    }
  }, [word, user, selectedLanguage]);

  const toggleBookmark = async (definition) => {
    try {
      const bookmarkRef = doc(db, `users/${user.uid}/bookmarks`, definition.id);
      if (bookmarks[definition.id]) {
        await deleteDoc(bookmarkRef);
        setBookmarks(prev => {
          const newBookmarks = {...prev};
          delete newBookmarks[definition.id];
          localStorage.setItem('bookmarks', JSON.stringify(newBookmarks));
          return newBookmarks;
        });
        setSnackbar({ open: true, message: 'Bookmark removed', severity: 'success' });
      } else {
        await setDoc(bookmarkRef, definition);
        setBookmarks(prev => {
          const newBookmarks = {...prev, [definition.id]: definition};
          localStorage.setItem('bookmarks', JSON.stringify(newBookmarks));
          return newBookmarks;
        });
        setSnackbar({ open: true, message: 'Bookmark added', severity: 'success' });
      }
    } catch (error) {
      console.error('Error toggling bookmark:', error);
      setSnackbar({ open: true, message: 'Error updating bookmark', severity: 'error' });
    }
  };

  const playTTS = async (text, languageCode, isWord = false) => {
    if (isPlaying) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
      setIsPlaying(false);
      return;
    }

    let ttsCode = languageCode;
    if (isWord) {
      // 간단한 언어 감지 로직
      const detectedLanguage = detectLanguage(text);
      ttsCode = detectedLanguage || languageCode;
    }

    const language = LANGUAGES.find(lang => lang.code === ttsCode);
    ttsCode = language ? language.ttsCode : 'en-US';

    try {
      setIsPlaying(true);
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await user.getIdToken()}`
        },
        body: JSON.stringify({ text, languageCode: ttsCode })
      });

      if (!response.ok) {
        throw new Error('TTS request failed');
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);

      audio.addEventListener('ended', () => {
        setIsPlaying(false);
      });

      setCurrentAudio(audio);
      audio.play();
    } catch (error) {
      console.error('Error playing TTS:', error);
      setSnackbar({ open: true, message: 'Failed to play TTS', severity: 'error' });
      setIsPlaying(false);
    }
  };

  const detectLanguage = (text) => {
    const langPatterns = {
      en: /^[a-zA-Z\s]+$/,  // 영어
      ko: /^[ㄱ-ㅎㅏ-ㅣ가-힣\s]+$/,  // 한국어
      ja: /^[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\s]+$/,  // 일본어
      zh: /^[\u4e00-\u9fff\s]+$/,  // 중국어
      es: /^[a-záéíóúüñ\s]+$/i,  // 스페인어
      fr: /^[a-zàâçéèêëîïôûùüÿœæ\s]+$/i,  // 프랑스어
      de: /^[a-zäöüß\s]+$/i,  // 독일어
      it: /^[a-zàèéìíîòóùú\s]+$/i,  // 이탈리아어
      pt: /^[a-zàáâãçéêíóôõú\s]+$/i,  // 포르투갈어
      ru: /^[а-яё\s]+$/i,  // 러시아어
      ar: /^[\u0600-\u06FF\s]+$/,  // 아랍어
      hi: /^[\u0900-\u097F\s]+$/,  // 힌디어
      th: /^[\u0E00-\u0E7F\s]+$/,  // 태국어
      vi: /^[a-zàáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ\s]+$/i,  // 베트남어
    };
  
    for (const [lang, pattern] of Object.entries(langPatterns)) {
      if (pattern.test(text.trim())) return lang;
    }
  
    // 여러 언어가 혼합된 경우나 패턴에 맞지 않는 경우
    let maxScore = 0;
    let detectedLang = null;
  
    for (const [lang, pattern] of Object.entries(langPatterns)) {
      const score = (text.match(pattern) || []).length;
      if (score > maxScore) {
        maxScore = score;
        detectedLang = lang;
      }
    }
  
    return detectedLang || 'unknown';
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleHistoryItemClick = (item) => {
    setWord(item.word);
    setSelectedLanguage(item.requestLanguage);
    const cacheKey = `definitions_${item.word}_${item.requestLanguage}`;
    const cachedDefinitions = JSON.parse(localStorage.getItem(cacheKey));
    if (cachedDefinitions) {
      setDefinitions(cachedDefinitions);
      setSnackbar({ open: true, message: 'Cached definitions loaded', severity: 'info' });
    } else {
      searchWord(item.word, item.requestLanguage);
    }
  };

  const hideHistoryItem = async (itemToHide) => {
    if (!itemToHide || !itemToHide.word || !itemToHide.timestamp) {
      console.error('Invalid item:', itemToHide);
      setSnackbar({ open: true, message: 'Error: Invalid history item', severity: 'error' });
      return;
    }
    
    try {
      if (user) {
        const historyRef = collection(db, 'users', user.uid, 'search_history');
        const q = query(historyRef, where('word', '==', itemToHide.word), limit(1));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          const docToUpdate = querySnapshot.docs[0];
          await updateDoc(docToUpdate.ref, { isHidden: true });
          console.log('Document updated successfully');
        } else {
          console.log('Document not found in Firestore, updating local state only');
        }
      }
  
      // 로컬 상태 및 캐시 업데이트
      setSearchHistory(prevHistory => {
        const updatedHistory = prevHistory.filter(item => item.word !== itemToHide.word);
        localStorage.setItem('searchHistory', JSON.stringify(updatedHistory));
        return updatedHistory;
      });

      setSnackbar({ open: true, message: 'History item hidden', severity: 'success' });
    } catch (error) {
      console.error('Error hiding history item:', error);
      setSnackbar({ open: true, message: 'Error hiding history item', severity: 'error' });
    }
  };

  const clearSearchHistory = async () => {
    try {
      const response = await fetch('/api/clear-search-history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await user.getIdToken()}`
        }
      });
      if (!response.ok) {
        throw new Error('Failed to clear search history');
      }
      setSearchHistory([]);
      localStorage.removeItem('searchHistory');
      setSnackbar({ open: true, message: 'Search history cleared', severity: 'success' });
    } catch (error) {
      console.error('Error clearing search history:', error);
      setSnackbar({ open: true, message: 'Error clearing search history', severity: 'error' });
    }
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
      localStorage.removeItem('selectedLanguage');
      localStorage.removeItem('searchHistory');
      localStorage.removeItem('bookmarks');
      setSnackbar({ open: true, message: 'Logged out successfully', severity: 'success' });
    } catch (error) {
      console.error('Error logging out:', error);
      setSnackbar({ open: true, message: 'Error logging out', severity: 'error' });
    }
  };
  
  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const handleFontSizeChange = (event, newValue) => {
    setFontSizeScaling(newValue);
  };

  const toggleHighContrastMode = () => {
    setHighContrastMode(!highContrastMode);
  };

  const startVoiceSearch = () => {
    if (isListening) {
      stopVoiceSearch();
      return;
    }
  
    const newRecognition = new window.webkitSpeechRecognition();
    const language = LANGUAGES.find(lang => lang.code === selectedLanguage);
    newRecognition.lang = language ? language.ttsCode : 'en-US';
    
    newRecognition.onstart = () => {
      setIsListening(true);
      setSnackbar({ open: true, message: `Listening in ${language ? language.name : 'English'}...`, severity: 'info' });
    };
  
    newRecognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setWord(transcript);
      searchWord(transcript);
    };
  
    newRecognition.onerror = (event) => {
      console.error('Speech recognition error', event.error);
      setSnackbar({ open: true, message: `Error: ${event.error}`, severity: 'error' });
      setIsListening(false);
    };
  
    newRecognition.onend = () => {
      setIsListening(false);
      setSnackbar({ open: true, message: 'Voice search ended', severity: 'info' });
    };
  
    newRecognition.start();
    setRecognition(newRecognition);
  };
  
  const stopVoiceSearch = () => {
    if (recognition) {
      recognition.stop();
      setIsListening(false);
      setSnackbar({ open: true, message: 'Voice search stopped', severity: 'info' });
    }
  };

  const fetchAiRecommendations = async (userId) => {
    // AI 추천 시스템 구현 (실제로는 서버와 통신하여 추천을 받아옴)
    const mockRecommendations = ['example', 'dictionary', 'language'];
    setAiRecommendations(mockRecommendations);
  };

  const handleGesture = useCallback((event) => {
    if (isMobile) {
      const touch = event.touches[0];
      setGesture({ x: touch.clientX, y: touch.clientY });
    }
  }, [isMobile]);

  useEffect(() => {
    if (isMobile && containerRef.current) {
      containerRef.current.addEventListener('touchmove', handleGesture);
      return () => {
        containerRef.current.removeEventListener('touchmove', handleGesture);
      };
    }
  }, [isMobile, handleGesture]);

  const backgroundSpring = useSpring(gesture.y, { stiffness: 100, damping: 30 });

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'Unknown date';
    try {
      return format(parseISO(timestamp), 'PPpp', { locale: locales[selectedLanguage] || locales.en });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid date';
    }
  };
  
  const formatRelativeTimestamp = (timestamp) => {
    if (!timestamp) return 'Unknown date';
    try {
      return formatRelative(parseISO(timestamp), new Date(), { locale: locales[selectedLanguage] || locales.en });
    } catch (error) {
      console.error('Error formatting relative date:', error);
      return 'Invalid date';
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <AnimatedNavigation handleLogout={handleLogout} />
      <Container ref={containerRef} maxWidth="md" sx={{ 
        mt: 4, 
        height: '100vh',
        background: isMobile ? `linear-gradient(180deg, 
          ${theme.palette.background.default} 0%, 
          ${theme.palette.primary.main} ${backgroundSpring}%,
          ${theme.palette.background.default} 100%)` : 'none'
      }}>
        <GlassBox>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Box sx={{ width: 100, height: 100 }}>
              <Logo3D />
            </Box>
            <Typography 
              variant="h4" 
              sx={{ 
                fontWeight: 'bold',
                color: theme.palette.primary.main,
                textShadow: '2px 2px 4px rgba(0,0,0,0.1)',
              }}
            >
              GG Dictionary
            </Typography>
            <Box>
              <IconButton onClick={toggleDarkMode} color="inherit">
                {darkMode ? <Brightness7Icon /> : <Brightness4Icon />}
              </IconButton>
              <IconButton onClick={toggleHighContrastMode} color="inherit">
                <AccessibilityNewIcon />
              </IconButton>
            </Box>
          </Box>
          <NeumorphicBox>
            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <TextField
                fullWidth
                variant="outlined"
                value={word}
                onChange={(e) => setWord(e.target.value)}
                placeholder="Enter a word"
                onKeyDown={(e) => e.key === 'Enter' && searchWord()}
                InputProps={{
                  sx: { borderRadius: theme.shape.borderRadius }
                }}
              />
              {isSpeechRecognitionSupported && (
                <IconButton 
                  onClick={startVoiceSearch} 
                  color={isListening ? "secondary" : "primary"}
                  aria-label={isListening ? "Stop voice search" : "Start voice search"}
                >
                  <MicIcon />
                </IconButton>
              )}
              <Button
                variant="contained"
                onClick={() => searchWord()}
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} /> : <SearchIcon />}
                sx={{ borderRadius: theme.shape.borderRadius }}
              >
                {loading ? 'Searching' : 'Search'}
              </Button>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              {user && (
                <Select
                  value={selectedLanguage}
                  onChange={(e) => updateLanguagePreference(e.target.value)}
                  sx={{ minWidth: 120 }}
                  startAdornment={<LanguageIcon sx={{ mr: 1 }} />}
                >
                  {LANGUAGES.map((lang) => (
                    <MenuItem key={lang.code} value={lang.code}>
                      <ListItemIcon>
                        <Box
                          component="span"
                          sx={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: 16,
                            height: 12,
                            fontSize: '16px',
                            lineHeight: 1,
                          }}
                        >
                          <img 
                            src={`https://flagcdn.com/16x12/${lang.icon}.png`}
                            srcSet={`https://flagcdn.com/32x24/${lang.icon}.png 2x,
                                    https://flagcdn.com/48x36/${lang.icon}.png 3x`}
                            width="16"
                            height="12"
                            alt={lang.emoji}
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'inline';
                            }}
                          />
                          <span style={{ display: 'none' }}>{lang.emoji}</span>
                        </Box>
                      </ListItemIcon>
                      <ListItemText>{lang.name}</ListItemText>
                    </MenuItem>
                  ))}
                </Select>
              )}
              <Slider
                value={fontSizeScaling}
                onChange={handleFontSizeChange}
                aria-labelledby="font-size-slider"
                step={0.1}
                marks
                min={0.8}
                max={1.5}
                sx={{ width: 100, ml: 2 }}
              />
            </Box>
          </NeumorphicBox>
          {error && <Typography color="error" sx={{ mt: 2 }}>{error}</Typography>}
          <Box sx={{ mt: 4 }}>
            <Tabs value={tabValue} onChange={handleTabChange} centered>
              <Tab label="Definitions" icon={<SearchIcon />} iconPosition="start" />
              <Tab label="Bookmarks" icon={<BookmarkIcon />} iconPosition="start" />
              <Tab label="History" icon={<HistoryIcon />} iconPosition="start" />
              <Tab label="AI Recommendations" icon={<AutoAwesomeIcon />} iconPosition="start" />
            </Tabs>
          </Box>
          <AnimatePresence>
            {tabValue === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <Grid container spacing={3} sx={{ mt: 2 }}>
                  {definitions.map((def, index) => (
                    <Grid item xs={12} sm={6} md={4} key={index}>
                      <NeumorphicBox>
                        <Typography variant="h6" gutterBottom sx={{ color: theme.palette.primary.main }}>{def.word}</Typography>
                        <Typography variant="body2">{def.definition}</Typography>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                          <Button size="small" onClick={() => setSelectedDefinition(def)} sx={{ color: theme.palette.secondary.main }}>
                            Example
                          </Button>
                          <Box>
                            <Tooltip title="Pronounce word">
                              <IconButton onClick={() => playTTS(def.word, selectedLanguage, true)} sx={{ color: theme.palette.primary.main }}>
                                <VolumeUpIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Pronounce definition">
                              <IconButton onClick={() => playTTS(def.definition, selectedLanguage)} sx={{ color: theme.palette.primary.main }}>
                                <VolumeUpIcon />
                              </IconButton>
                            </Tooltip>
                            <IconButton onClick={() => toggleBookmark(def)} sx={{ color: theme.palette.secondary.main }}>
                              {bookmarks[def.id] ? <BookmarkIcon /> : <BookmarkBorderIcon />}
                            </IconButton>
                          </Box>
                        </Box>
                      </NeumorphicBox>
                    </Grid>
                  ))}
                </Grid>
              </motion.div>
            )}
            {tabValue === 1 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <List>
                  {Object.values(bookmarks).map((bookmark, index) => (
                    <ListItem key={index}>
                      <ListItemText 
                        primary={bookmark.word}
                        secondary={bookmark.definition}
                      />
                      <IconButton onClick={() => toggleBookmark(bookmark)}>
                        <BookmarkIcon />
                      </IconButton>
                    </ListItem>
                  ))}
                </List>
              </motion.div>
            )}
            {tabValue === 2 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <List>
                {searchHistory.map((item) => (
                  <ListItemButton 
                    key={item.id}
                    onClick={() => handleHistoryItemClick(item)}
                  >
                    <ListItemIcon>
                      <Box
                        component="span"
                        sx={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: 16,
                          height: 12,
                          fontSize: '16px',
                          lineHeight: 1,
                        }}
                      >
                        <img 
                          src={`https://flagcdn.com/16x12/${LANGUAGES.find(lang => lang.code === item.requestLanguage)?.icon || 'xx'}.png`}
                          srcSet={`https://flagcdn.com/32x24/${LANGUAGES.find(lang => lang.code === item.requestLanguage)?.icon || 'xx'}.png 2x,
                                  https://flagcdn.com/48x36/${LANGUAGES.find(lang => lang.code === item.requestLanguage)?.icon || 'xx'}.png 3x`}
                          width="16"
                          height="12"
                          alt={LANGUAGES.find(lang => lang.code === item.requestLanguage)?.emoji || '🏳️'}
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'inline';
                          }}
                        />
                        <span style={{ display: 'none' }}>
                          {LANGUAGES.find(lang => lang.code === item.requestLanguage)?.emoji || '🏳️'}
                        </span>
                      </Box>
                    </ListItemIcon>
                    <ListItemText 
                      primary={item.word}
                      secondary={`Searched in ${LANGUAGES.find(lang => lang.code === item.requestLanguage)?.name || 'Unknown language'}`}
                    />
                    <Tooltip title={formatTimestamp(item.timestamp)}>
                      <Typography variant="caption">
                        {formatRelativeTimestamp(item.timestamp)}
                      </Typography>
                    </Tooltip>
                    <IconButton 
                      edge="end" 
                      aria-label="delete" 
                      onClick={(e) => {
                        e.stopPropagation();
                        hideHistoryItem(item);
                      }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </ListItemButton>
                ))}
                </List>
                {searchHistory.length > 0 && (
                  <Button
                    startIcon={<ClearAllIcon />}
                    onClick={clearSearchHistory}
                    sx={{ mt: 2 }}
                  >
                    Clear All History
                  </Button>
                )}
              </motion.div>
            )}
            {tabValue === 3 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <List>
                  {aiRecommendations.map((recommendation, index) => (
                    <ListItem key={index} button onClick={() => {setWord(recommendation); searchWord(recommendation);}}>
                      <ListItemText primary={recommendation} />
                    </ListItem>
                  ))}
                </List>
              </motion.div>
            )}
          </AnimatePresence>
        </GlassBox>
        <Modal
          open={!!selectedDefinition}
          onClose={() => setSelectedDefinition(null)}
          aria-labelledby="example-modal-title"
        >
          <GlassBox
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: 400,
              p: 4,
            }}
          >
            <Typography id="example-modal-title" variant="h6" component="h2" gutterBottom sx={{ color: theme.palette.primary.main }}>
              Example
            </Typography>
            <Typography>{selectedDefinition?.example}</Typography>
          </GlassBox>
        </Modal>
        <Snackbar 
          open={snackbar.open} 
          autoHideDuration={6000} 
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Container>
    </ThemeProvider>
  );
};

export default Dictionary;