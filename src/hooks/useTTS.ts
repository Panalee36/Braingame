import { useState, useEffect, useCallback, useRef } from "react";

export const useTTS = () => {
  const [isSupported, setIsSupported] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      setIsSupported(true);

      const loadVoices = () => {
        const availableVoices = window.speechSynthesis.getVoices();
        if (availableVoices.length > 0) {
          setVoices(availableVoices);
        }
      };

      loadVoices();
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  const speak = useCallback(
    (text: string) => {
      if (!isSupported) return;

      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utteranceRef.current = utterance;

      // 🏆 สูตรเลือกเสียง "ธรรมชาติที่สุด"
      const bestVoice =
        // 1. เสียง AI Online (Edge)
        voices.find(
          (v) => v.name.includes("Natural") && v.lang.includes("th"),
        ) ||
        voices.find(
          (v) => v.name.includes("Online") && v.lang.includes("th"),
        ) ||
        // 2. เสียง Google (Chrome)
        voices.find(
          (v) => v.name.includes("Google") && v.lang.includes("th"),
        ) ||
        // 3. เสียงพื้นฐาน
        voices.find((v) => v.lang === "th-TH");

      if (bestVoice) {
        utterance.voice = bestVoice;
      }

      // ⚙️ ปรับจูนเสียง
      utterance.lang = "th-TH";

      // ปรับความเร็วเสียงพูด
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
  }, []);

  return { speak, cancel, isSupported };
};
