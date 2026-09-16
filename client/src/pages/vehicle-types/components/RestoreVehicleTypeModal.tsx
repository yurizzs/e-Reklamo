import React, { useState } from 'react';
import { Button, Modal, ToastProvider } from '../../../components/ui';
import VehicleTypeService from '../../../services/VehicleTypeService';
import type { VehicleType } from '../../../interfaces/vehicleType';
import { notify } from '../../../util/notify';

interface RestoreVehicleTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  category: VehicleType | null;
}

const RestoreVehicleTypeModal: React.FC<RestoreVehicleTypeModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  category,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !category) return null;

  const handleRestore = async () => {
    setIsSubmitting(true);
    try {
      await VehicleTypeService.restore(category.id);
      notify.success('Vehicle category restored successfully');
      onSuccess();
      onClose();
    } catch (error) {
      console.error(error);
      notify.error('Failed to restore vehicle category');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Restore Vehicle Category" size="sm">
      <div className="space-y-4">
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Are you sure you want to restore <span className="font-bold text-gray-900 dark:text-white">"{category.vehicle_name}"</span>? It will become active again.
        </p>

        <div className="flex justify-end gap-3 pt-4">
          <Button variant="ghost" onClick={onClose} type="button" disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleRestore} disabled={isSubmitting}>
            {isSubmitting ? 'Restoring...' : 'Restore'}
          </Button>
        </div>
      </div>
      <ToastProvider />
    </Modal>
  );
};

export default RestoreVehicleTypeModal;
