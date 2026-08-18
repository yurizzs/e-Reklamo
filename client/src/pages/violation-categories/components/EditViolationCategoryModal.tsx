import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button, Modal, ToastProvider, LoadingSpinner } from '../../../components/ui';
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
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  useEffect(() => {
    setIsModalOpen(isOpen);
    if (isOpen && user) {
      const fetchDetail = async () => {
        setIsLoadingDetail(true);
        try {
          const response = await ViolationCategoryService.getById(user.id);
          const detail = (response as any).data || response;
          reset({
            category_name: detail.category_name,
            description: detail.description || '',
            penalty_amount: detail.penalty_amount,
          });
        } catch (error) {
          console.error('Failed to fetch violation category details', error);
          notify.error('Failed to load fresh details');
          // fallback to user prop
          reset({
            category_name: user.category_name,
            description: user.description || '',
            penalty_amount: user.penalty_amount,
          });
        } finally {
          setIsLoadingDetail(false);
        }
      };
      fetchDetail();
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
      {isLoadingDetail ? (
        <div className="flex items-center justify-center py-16">
          <LoadingSpinner size="md" text="Loading category details..." />
        </div>
      ) : (
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
            <Button variant="primary" type="submit" disabled={isSubmitting || isLoadingDetail}>
              {isSubmitting ? 'Updating...' : 'Update Category'}
            </Button>
          </div>
        </form>
      )}
      <ToastProvider />
    </Modal>
  );
};

export default EditViolationCategoryModal;
