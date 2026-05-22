import React from 'react';
import BaseInputModal from './BaseInputModal';
import { useTranslation } from '@/context/I18nContext';

interface RenameDocumentModalProps {
  readonly visible: boolean;
  readonly currentName: string;
  readonly onClose: () => void;
  readonly onSubmit: (name: string) => Promise<void>;
}

export default function RenameDocumentModal({ visible, currentName, onClose, onSubmit }: RenameDocumentModalProps) {
  const { t } = useTranslation();
  return (
    <BaseInputModal
      visible={visible}
      title={t('cloud.modals.renameDocument.title')}
      placeholder={t('cloud.modals.renameDocument.placeholder')}
      submitText={t('cloud.modals.renameDocument.submit')}
      initialValue={currentName}
      onClose={onClose}
      onSubmit={onSubmit}
    />
  );
}
