import { useState, useEffect, useCallback, useRef } from "react";


export const useTTS = () => {
  const [isSupported, setIsSupported] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Define loadVoices outside useEffect to avoid re-creation
  const loadVoices = () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      const availableVoices = window.speechSynthesis.getVoices();
      if (availableVoices.length > 0) {
        setVoices(availableVoices);
      }
    }
  };

  useEffect(() => {
    let prevOnVoicesChanged = null;
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      setIsSupported(true);
      loadVoices();
      prevOnVoicesChanged = window.speechSynthesis.onvoiceschanged;
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.onvoiceschanged = prevOnVoicesChanged;
      }
    };
  }, []);


  const speak = useCallback(
    (text: string) => {
      if (typeof window === "undefined" || !isSupported) return;

      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utteranceRef.current = utterance;

      // 🏆 สูตรเลือกเสียง "ธรรมชาติที่สุด"
      const bestVoice =
        voices.find((v) => v.name.includes("Natural") && v.lang.includes("th")) ||
        voices.find((v) => v.name.includes("Online") && v.lang.includes("th")) ||
        voices.find((v) => v.name.includes("Google") && v.lang.includes("th")) ||
        voices.find((v) => v.lang === "th-TH");

      if (bestVoice) {
        utterance.voice = bestVoice;
      }

      utterance.lang = "th-TH";
      utterance.rate = bestVoice?.name.includes("Natural") ? 0.9 : 0.8;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      utterance.onend = () => {
        utteranceRef.current = null;
      };

      window.speechSynthesis.speak(utterance);
    },
    [isSupported, voices],
  );


  const cancel = useCallback(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    utteranceRef.current = null;
  }, []);

  return { speak, cancel, isSupported };
};
