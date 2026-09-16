import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button, Modal, ToastProvider } from '../../../components/ui';
import { InputField } from '../../../components/ui/forms';
import VehicleTypeService from '../../../services/VehicleTypeService';
import { notify } from '../../../util/notify';

interface CreateVehicleTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CreateVehicleTypeModal: React.FC<CreateVehicleTypeModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
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
  }>({
    defaultValues: {
      vehicle_name: '',
      description: '',
      status: 'active',
    },
  });

  const [isModalOpen, setIsModalOpen] = useState(isOpen);

  useEffect(() => {
    setIsModalOpen(isOpen);
    if (!isOpen) {
      reset();
    }
  }, [isOpen, reset]);

  const onSubmit = async (data: any) => {
    try {
      await VehicleTypeService.create(data);
      notify.success('Vehicle category created successfully');
      onSuccess();
      onClose();
    } catch (error) {
      console.error(error);
      notify.error('Failed to create vehicle category');
    }
  };

  if (!isModalOpen) return null;

  return (
    <Modal isOpen={isModalOpen} onClose={onClose} title="Add Vehicle Category" size="md">
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
          placeholder="e.g. 3-wheeled public utility vehicle"
          fullWidth
          {...register('description')}
          error={errors.description?.message}
        />

        <div className="flex justify-end gap-3 pt-4">
          <Button variant="ghost" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button variant="primary" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Creating...' : 'Create Category'}
          </Button>
        </div>
      </form>
      <ToastProvider />
    </Modal>
  );
};

export default CreateVehicleTypeModal;
