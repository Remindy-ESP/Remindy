import React from 'react';
import BaseInputModal from './BaseInputModal';
import { useTranslation } from '@/context/I18nContext';

interface RenameFolderModalProps {
  readonly visible: boolean;
  readonly currentName: string;
  readonly onClose: () => void;
  readonly onSubmit: (name: string) => Promise<void>;
}

export default function RenameFolderModal({ visible, currentName, onClose, onSubmit }: RenameFolderModalProps) {
  const { t } = useTranslation();
  return (
    <BaseInputModal
      visible={visible}
      title={t('cloud.modals.renameFolder.title')}
      placeholder={t('cloud.modals.renameFolder.placeholder')}
      submitText={t('cloud.modals.renameFolder.submit')}
      initialValue={currentName}
      onClose={onClose}
      onSubmit={onSubmit}
    />
  );
}
