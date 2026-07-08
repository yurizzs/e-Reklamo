import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button, Modal, ToastProvider } from '../../../components/ui';
import { InputField } from '../../../components/ui/forms';
import ViolationCategoryService from '../../../services/ViolationCategoryService';
import { notify } from '../../../util/notify';

interface CreateViolationCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CreateViolationCategoryModal: React.FC<CreateViolationCategoryModalProps> = ({
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
    category_name: string;
    description: string;
    penalty_amount: string;
  }>({
    defaultValues: {
      category_name: '',
      description: '',
      penalty_amount: '',
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
      await ViolationCategoryService.create(data);
      notify.success('Violation category created successfully');
      onSuccess();
      onClose();
    } catch (error) {
      console.error(error);
      notify.error('Failed to create violation category');
    }
  };

  if (!isModalOpen) return null;

  return (
    <Modal isOpen={isModalOpen} onClose={onClose} title="Add Violation Category" size="md">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <InputField
          label="Category Name"
          placeholder="e.g. Speeding"
          fullWidth
          {...register('category_name', {
            required: 'Category name is required',
          })}
          error={errors.category_name?.message}
          required
        />
        <InputField
          label="Description"
          placeholder="e.g. Exceeding the speed limit"
          fullWidth
          {...register('description')}
          error={errors.description?.message}
        />
        <InputField
          label="Penalty Amount"
          placeholder="e.g. 1500.00"
          fullWidth
          {...register('penalty_amount', {
            required: 'Penalty amount is required',
          })}
          error={errors.penalty_amount?.message}
          required
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

export default CreateViolationCategoryModal;
