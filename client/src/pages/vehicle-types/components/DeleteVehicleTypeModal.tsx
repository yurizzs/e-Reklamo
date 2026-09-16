import React, { useState } from 'react';
import { Button, Modal, ToastProvider } from '../../../components/ui';
import VehicleTypeService from '../../../services/VehicleTypeService';
import type { VehicleType } from '../../../interfaces/vehicleType';
import { notify } from '../../../util/notify';

interface DeleteVehicleTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  category: VehicleType | null;
}

const DeleteVehicleTypeModal: React.FC<DeleteVehicleTypeModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  category,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !category) return null;

  const handleDelete = async () => {
    setIsSubmitting(true);
    try {
      await VehicleTypeService.delete(category.id);
      notify.success('Vehicle category moved to recycle bin');
      onSuccess();
      onClose();
    } catch (error) {
      console.error(error);
      notify.error('Failed to delete vehicle category');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Delete Vehicle Category" size="sm">
      <div className="space-y-4">
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Are you sure you want to delete <span className="font-bold text-gray-900 dark:text-white">"{category.vehicle_name}"</span>? It will be moved to the recycle bin.
        </p>

        <div className="flex justify-end gap-3 pt-4">
          <Button variant="ghost" onClick={onClose} type="button" disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDelete} disabled={isSubmitting}>
            {isSubmitting ? 'Deleting...' : 'Delete'}
          </Button>
        </div>
      </div>
      <ToastProvider />
    </Modal>
  );
};

export default DeleteVehicleTypeModal;
