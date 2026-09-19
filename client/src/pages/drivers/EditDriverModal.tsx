import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Button, Modal } from '../../components/ui';
import { InputField } from '../../components/ui/forms';
import DriverService from '../../services/DriverService';
import { notify } from '../../util/notify';

interface DriverToEdit {
  id: number;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  suffix_1name?: string | null;
  address: string | null;
}

interface EditDriverModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  driver: DriverToEdit | null;
}

interface EditDriverFormData {
  first_name: string;
  middle_name: string;
  last_name: string;
  suffix_1name: string;
  address: string;
}

const EditDriverModal: React.FC<EditDriverModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  driver,
}) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<EditDriverFormData>();

  useEffect(() => {
    if (driver) {
      reset({
        first_name: driver.first_name || '',
        middle_name: driver.middle_name || '',
        last_name: driver.last_name || '',
        suffix_1name: driver.suffix_1name || '',
        address: driver.address || '',
      });
    }
  }, [driver, reset]);

  const onSubmit = async (data: EditDriverFormData) => {
    if (!driver) return;
    try {
      await DriverService.updateDriver(driver.id, {
        first_name: data.first_name,
        middle_name: data.middle_name || undefined,
        last_name: data.last_name,
        suffix_1name: data.suffix_1name || undefined,
        address: data.address,
      });
      notify.success('Driver record updated successfully');
      onSuccess();
      onClose();
    } catch (error) {
      console.error(error);
      notify.error('Failed to update driver record');
    }
  };

  if (!isOpen || !driver) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Driver Profile" size="md">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputField
            label="First Name"
            placeholder="First Name"
            fullWidth
            {...register('first_name', {
              required: 'First name is required',
            })}
            error={errors.first_name?.message}
            required
          />
          <InputField
            label="Middle Name"
            placeholder="Middle Name (Optional)"
            fullWidth
            {...register('middle_name')}
            error={errors.middle_name?.message}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <InputField
              label="Last Name"
              placeholder="Last Name"
              fullWidth
              {...register('last_name', {
                required: 'Last name is required',
              })}
              error={errors.last_name?.message}
              required
            />
          </div>
          <div>
            <InputField
              label="Suffix"
              placeholder="e.g. Jr., Sr., III (Optional)"
              fullWidth
              {...register('suffix_1name')}
              error={errors.suffix_1name?.message}
            />
          </div>
        </div>

        <InputField
          label="Address"
          placeholder="Driver Residential Address"
          fullWidth
          {...register('address', {
            required: 'Address is required',
          })}
          error={errors.address?.message}
          required
        />

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-white/5">
          <Button variant="ghost" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button variant="primary" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default EditDriverModal;
