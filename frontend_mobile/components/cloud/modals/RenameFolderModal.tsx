import React from 'react';
import BaseInputModal from './BaseInputModal';

interface RenameFolderModalProps {
  readonly visible: boolean;
  readonly currentName: string;
  readonly onClose: () => void;
  readonly onSubmit: (name: string) => Promise<void>;
}

export default function RenameFolderModal({ visible, currentName, onClose, onSubmit }: RenameFolderModalProps) {
  return (
    <BaseInputModal
      visible={visible}
      title="Renommer le dossier"
      placeholder="Nom du dossier"
      submitText="Renommer"
      initialValue={currentName}
      onClose={onClose}
      onSubmit={onSubmit}
    />
  );
}
