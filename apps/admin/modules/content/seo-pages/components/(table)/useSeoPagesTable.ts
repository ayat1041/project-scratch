'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { handleCreateSeoPage, handleDeleteSeoPage } from '../../handlers';

export interface SeoPagesTableState {
  isCreateOpen: boolean;
  openCreate: () => void;
  closeCreate: () => void;
  deletingPageId: string | null;
  openDelete: (id: string) => void;
  closeDelete: () => void;
  isSubmitting: boolean;
  createPage: (path: string) => Promise<boolean>;
  deletePage: () => Promise<boolean>;
}

export const useSeoPagesTable = (): SeoPagesTableState => {
  const router = useRouter();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [deletingPageId, setDeletingPageId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createPage = async (path: string): Promise<boolean> => {
    setIsSubmitting(true);
    try {
      const result = await handleCreateSeoPage(path);
      setIsCreateOpen(false);
      router.push(`/dashboard/content/seo-pages/${result.id}`);
      return true;
    } catch {
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const deletePage = async (): Promise<boolean> => {
    if (!deletingPageId) return false;
    setIsSubmitting(true);
    try {
      await handleDeleteSeoPage(deletingPageId);
      setDeletingPageId(null);
      router.refresh();
      return true;
    } catch {
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    isCreateOpen,
    openCreate: () => setIsCreateOpen(true),
    closeCreate: () => setIsCreateOpen(false),
    deletingPageId,
    openDelete: (id: string) => setDeletingPageId(id),
    closeDelete: () => setDeletingPageId(null),
    isSubmitting,
    createPage,
    deletePage,
  };
};
