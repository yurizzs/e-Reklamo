import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button, Modal, ToastProvider } from '../../../components/ui';
import { InputField } from '../../../components/ui/forms';
import ViolationCategoryService from '../../../services/ViolationCategoryService';
import type { ViolationCategory } from '../../../interfaces/violationCategory';
import { notify } from '../../../util/notify';

interface EditViolationCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: ViolationCategory | null; // Using 'user' to match existing pattern in User.tsx
  onSuccess: () => void;
  size?: 'sm' | 'md' | 'lg';
}

const EditViolationCategoryModal: React.FC<EditViolationCategoryModalProps> = ({
  isOpen,
  onClose,
  user,
  onSuccess,
  size = 'md',
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
  }>();

  const [isModalOpen, setIsModalOpen] = useState(isOpen);

  useEffect(() => {
    setIsModalOpen(isOpen);
    if (user) {
      reset({
        category_name: user.category_name,
        description: user.description || '',
        penalty_amount: user.penalty_amount,
      });
    } else {
      reset({
        category_name: '',
        description: '',
        penalty_amount: '',
      });
    }
  }, [isOpen, user, reset]);

  const onSubmit = async (data: any) => {
    if (!user) return;

    try {
      await ViolationCategoryService.update(user.id, data);
      notify.success('Violation category updated successfully');
      onSuccess();
      onClose();
    } catch (error) {
      console.error(error);
      notify.error('Failed to update violation category');
    }
  };

  if (!isModalOpen) return null;

  return (
    <Modal isOpen={isModalOpen} onClose={onClose} title="Edit Violation Category" size={size}>
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
            {isSubmitting ? 'Updating...' : 'Update Category'}
          </Button>
        </div>
      </form>
      <ToastProvider />
    </Modal>
  );
};

export default EditViolationCategoryModal;
