"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  EMPTY_IMAGE_SLOT,
  isGenerationHistoryItem,
  parseGeneratedImageUrl,
  validateImageFile,
  type GenerationHistoryItem,
  type ImageSlotKind,
  type ImageSlotState,
} from "@/lib/generation";

export function useGenerationWorkspace() {
  const router = useRouter();
  const [contentSlot, setContentSlot] = useState<ImageSlotState>(EMPTY_IMAGE_SLOT);
  const [styleSlot, setStyleSlot] = useState<ImageSlotState>(EMPTY_IMAGE_SLOT);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [alpha, setAlpha] = useState(0.5);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [history, setHistory] = useState<GenerationHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    const checkSession = async () => {
      try {
        const response = await fetch("/api/session", { cache: "no-store" });
        const data: unknown = await response.json().catch(() => null);
        const authenticated =
          response.ok &&
          data !== null &&
          typeof data === "object" &&
          "authenticated" in data &&
          data.authenticated === true;
        if (isActive) setIsAuthenticated(authenticated);
      } catch {
        if (isActive) setIsAuthenticated(false);
      }
    };

    void checkSession();
    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    const previewUrls = [contentSlot.previewUrl, styleSlot.previewUrl];
    return () => {
      previewUrls.forEach((url) => {
        if (url) URL.revokeObjectURL(url);
      });
    };
  }, [contentSlot.previewUrl, styleSlot.previewUrl]);

  const loadHistory = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const response = await fetch("/api/generations", { cache: "no-store" });
      if (response.status === 401) {
        setHistoryError("Your session has expired. Please sign in again.");
        setHistory([]);
        setIsAuthenticated(false);
        router.replace("/login");
        return;
      }
      if (!response.ok) {
        setHistoryError(`Couldn't load your generations (error ${response.status}).`);
        return;
      }

      const data: unknown = await response.json();
      const images =
        data && typeof data === "object" && "images" in data
          ? data.images
          : null;
      setHistory(
        Array.isArray(images) ? images.filter(isGenerationHistoryItem) : [],
      );
      setHistoryError(null);
    } catch {
      setHistoryError(
        "Couldn't reach the server. Check your connection and try again.",
      );
    } finally {
      setHistoryLoading(false);
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    const requestId = window.setTimeout(() => {
      void loadHistory();
    }, 0);
    return () => window.clearTimeout(requestId);
  }, [loadHistory]);

  const selectImage = useCallback((kind: ImageSlotKind, file: File) => {
    const error = validateImageFile(file);
    const nextSlot = error
      ? { ...EMPTY_IMAGE_SLOT, error }
      : { file, previewUrl: URL.createObjectURL(file), error: null };

    if (kind === "content") setContentSlot(nextSlot);
    else setStyleSlot(nextSlot);
  }, []);

  const clearImage = useCallback((kind: ImageSlotKind) => {
    if (kind === "content") setContentSlot(EMPTY_IMAGE_SLOT);
    else setStyleSlot(EMPTY_IMAGE_SLOT);
  }, []);

  const canGenerate =
    isAuthenticated &&
    Boolean(contentSlot.file) &&
    Boolean(styleSlot.file) &&
    !isGenerating;

  const generateImage = async () => {
    if (!contentSlot.file || !styleSlot.file || !isAuthenticated) return;

    setIsGenerating(true);
    setGenerateError(null);
    setResultUrl(null);

    try {
      const form = new FormData();
      form.append("content_image", contentSlot.file);
      form.append("style_image", styleSlot.file);
      form.append("alpha", String(alpha));

      const response = await fetch("/api/generate", {
        method: "POST",
        body: form,
      });

      if (response.status === 401) {
        setGenerateError("Your session has expired. Please sign in again.");
        setIsAuthenticated(false);
        router.replace("/login");
        return;
      }
      if (!response.ok) {
        setGenerateError(
          `Generation failed (error ${response.status}). Please try again.`,
        );
        return;
      }

      const url = parseGeneratedImageUrl(await response.text());
      if (!url) {
        setGenerateError("The server returned an unexpected response.");
        return;
      }

      setResultUrl(url);
      void loadHistory();
    } catch {
      setGenerateError(
        "Couldn't reach the server. Check your connection and try again.",
      );
    } finally {
      setIsGenerating(false);
    }
  };

  return {
    isAuthenticated,
    contentSlot,
    styleSlot,
    alpha,
    isGenerating,
    generateError,
    resultUrl,
    history,
    historyLoading,
    historyError,
    canGenerate,
    setAlpha,
    selectImage,
    clearImage,
    generateImage,
  };
}