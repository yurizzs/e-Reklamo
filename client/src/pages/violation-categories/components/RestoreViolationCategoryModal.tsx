import { useState } from 'react';
import { Modal } from '../../../components/ui';
import { Button, ToastProvider } from '../../../components/ui';
import ViolationCategoryService from '../../../services/ViolationCategoryService';
import type { ViolationCategory } from '../../../interfaces/violationCategory';
import { notify } from '../../../util/notify';

interface RestoreViolationCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: ViolationCategory | null;
  onSuccess: () => void;
}

const RestoreViolationCategoryModal = ({
  isOpen,
  onClose,
  category,
  onSuccess,
}: RestoreViolationCategoryModalProps) => {
  const [isRestoring, setIsRestoring] = useState(false);

  const handleRestore = async () => {
    if (!category) return;

    setIsRestoring(true);
    try {
      await ViolationCategoryService.restore(category.id);
      notify.success('Violation category restored successfully');
      onSuccess();
      onClose();
    } catch (error) {
      console.error(error);
      notify.error('Failed to restore violation category');
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Restore Violation Category" size="sm">
      <div className="space-y-4">
        <p className="text-sm text-slate-400">
          Restore <span className="font-bold text-white">"{category?.category_name}"</span> to
          active violation categories?
        </p>
        <div className="flex justify-end gap-3 pt-4">
          <Button variant="ghost" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button
            variant="primary"
            iconName="FaArrowRotateLeft"
            onClick={handleRestore}
            isLoading={isRestoring}
            loadingText="Restoring..."
          >
            Restore
          </Button>
        </div>
      </div>
      <ToastProvider />
    </Modal>
  );
};

export default RestoreViolationCategoryModal;
