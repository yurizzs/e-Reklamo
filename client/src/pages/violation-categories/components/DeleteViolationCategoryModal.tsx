import React, { useEffect, useState } from 'react';
import { Button, Modal, ToastProvider } from '../../../components/ui';
import ViolationCategoryService from '../../../services/ViolationCategoryService';
import type { ViolationCategory } from '../../../interfaces/violationCategory';
import { notify } from '../../../util/notify';

interface DeleteViolationCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: ViolationCategory | null; // Using 'user' to match existing pattern in User.tsx
  onSuccess: () => void;
}

const DeleteViolationCategoryModal: React.FC<DeleteViolationCategoryModalProps> = ({
  isOpen,
  onClose,
  user,
  onSuccess,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(isOpen);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    setIsModalOpen(isOpen);
  }, [isOpen]);

  const handleDelete = async () => {
    if (!user) return;

    setIsDeleting(true);
    try {
      await ViolationCategoryService.delete(user.id);
      notify.success('Violation category moved to recycle bin');
      onSuccess();
      onClose();
    } catch (error) {
      console.error(error);
      notify.error('Failed to delete violation category');
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isModalOpen) return null;

  return (
    <Modal isOpen={isModalOpen} onClose={onClose} title="Delete Violation Category">
      <div className="space-y-4">
        <p className="text-slate-400">
          Move <span className="text-white font-bold">"{user?.category_name}"</span> to the recycle bin? It can be restored later.
        </p>
        <div className="flex justify-end gap-3 pt-4">
          <Button variant="ghost" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={handleDelete}
            isLoading={isDeleting}
            loadingText="Deleting..."
          >
            Delete
          </Button>
        </div>
      </div>
      <ToastProvider />
    </Modal>
  );
};

export default DeleteViolationCategoryModal;
