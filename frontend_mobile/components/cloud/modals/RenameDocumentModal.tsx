import React from 'react';
import BaseInputModal from './BaseInputModal';

interface RenameDocumentModalProps {
  readonly visible: boolean;
  readonly currentName: string;
  readonly onClose: () => void;
  readonly onSubmit: (name: string) => Promise<void>;
}

export default function RenameDocumentModal({ visible, currentName, onClose, onSubmit }: RenameDocumentModalProps) {
  return (
    <BaseInputModal
      visible={visible}
      title="Renommer le document"
      placeholder="Nom du document"
      submitText="Renommer"
      initialValue={currentName}
      onClose={onClose}
      onSubmit={onSubmit}
    />
  );
}
