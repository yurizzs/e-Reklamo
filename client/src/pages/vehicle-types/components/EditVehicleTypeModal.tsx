import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Button, Modal, ToastProvider } from '../../../components/ui';
import { InputField } from '../../../components/ui/forms';
import VehicleTypeService from '../../../services/VehicleTypeService';
import type { VehicleType } from '../../../interfaces/vehicleType';
import { notify } from '../../../util/notify';

interface EditVehicleTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  category: VehicleType | null;
}

const EditVehicleTypeModal: React.FC<EditVehicleTypeModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  category,
}) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<{
    vehicle_name: string;
    description: string;
    status: string;
  }>();

  useEffect(() => {
    if (category) {
      reset({
        vehicle_name: category.vehicle_name,
        description: category.description || '',
        status: category.status || 'active',
      });
    }
  }, [category, reset]);

  const onSubmit = async (data: any) => {
    if (!category) return;
    try {
      await VehicleTypeService.update(category.id, data);
      notify.success('Vehicle category updated successfully');
      onSuccess();
      onClose();
    } catch (error) {
      console.error(error);
      notify.error('Failed to update vehicle category');
    }
  };

  if (!isOpen || !category) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Vehicle Category" size="md">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <InputField
          label="Vehicle Category Name"
          placeholder="e.g. Tricycle, Jeepney, Bus"
          fullWidth
          {...register('vehicle_name', {
            required: 'Vehicle category name is required',
          })}
          error={errors.vehicle_name?.message}
          required
        />
        <InputField
          label="Description"
          placeholder="e.g. Description of vehicle category"
          fullWidth
          {...register('description')}
          error={errors.description?.message}
        />

        <div className="flex justify-end gap-3 pt-4">
          <Button variant="ghost" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button variant="primary" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Updating...' : 'Save Changes'}
          </Button>
        </div>
      </form>
      <ToastProvider />
    </Modal>
  );
};

export default EditVehicleTypeModal;
