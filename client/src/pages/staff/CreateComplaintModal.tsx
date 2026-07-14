import { useEffect, useState } from "react";
import Modal from "../../components/ui/Modal";
import { InputField, Select, TextArea } from "../../components/ui/forms";
import ComplaintService from "../../services/ComplaintService";
import { notify } from "../../util/notify";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

type Option = {
  id: number;
  name?: string;
  category_name?: string;
  plate_number?: string;
};

interface ComplaintFormData {
  complainant_first_name: string;
  complainant_last_name: string;
  driver_id: string;
  category_id: string;
  title: string;
  description: string;
  incident_date_time: string;
  incident_location: string;
  status: string;
}

interface FormErrors {
  [key: string]: string;
}

const initialForm: ComplaintFormData = {
  complainant_first_name: "",
  complainant_last_name: "",
  driver_id: "",
  category_id: "",
  title: "",
  description: "",
  incident_date_time: "",
  incident_location: "",
  status: "new",
};

const CreateComplaintModal = ({ isOpen, onClose, onSuccess }: Props) => {
  const [form, setForm] = useState<ComplaintFormData>(initialForm);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isOptionsLoading, setIsOptionsLoading] = useState(false);
  const [drivers, setDrivers] = useState<Option[]>([]);
  const [categories, setCategories] = useState<Option[]>([]);

  useEffect(() => {
    if (!isOpen) return;

    const fetchOptions = async () => {
      setIsOptionsLoading(true);

      try {
        const response = (await ComplaintService.getOptions()) as any;
        const payload = response?.data ?? response;

        setDrivers(payload?.drivers ?? []);
        setCategories(payload?.categories ?? []);
      } catch {
        setDrivers([]);
        setCategories([]);
      } finally {
        setIsOptionsLoading(false);
      }
    };

    fetchOptions();
  }, [isOpen]);

  const handleChange = (name: keyof ComplaintFormData, value: string) => {
    setForm((prev) => ({ ...prev, [name]: value }));

    if (errors[name]) {
      setErrors((prev) => {
        const { [name]: _removed, ...rest } = prev;
        return rest;
      });
    }
  };

  const handleClose = () => {
    if (isLoading) return;
    setForm(initialForm);
    setErrors({});
    onClose();
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    setErrors({});

    try {
      await ComplaintService.create(form);
      notify.success("Complaint added successfully.");
      setForm(initialForm);
      onClose();
      onSuccess();
    } catch (error: any) {
      const validationErrors = error.response?.data?.errors;

      if (validationErrors && typeof validationErrors === "object") {
        const formattedErrors: FormErrors = {};

        for (const [field, messages] of Object.entries(validationErrors)) {
          if (Array.isArray(messages) && messages.length > 0) {
            formattedErrors[field] = messages[0] as string;
          }
        }

        setErrors(formattedErrors);
        notify.error("Please review the complaint details.");
      } else {
        notify.error("Failed to add complaint.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Add Complaint"
      size="lg"
      primaryAction={{
        label: "Add Complaint",
        onClick: handleSubmit,
        variant: "primary",
        iconName: "FaFloppyDisk",
        isLoading,
        loadingText: "Saving...",
      }}
      secondaryAction={{
        label: "Cancel",
        onClick: handleClose,
        variant: "secondary",
      }}
    >
      <form className="space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <InputField
            label="Complainant First Name"
            iconName="FaUser"
            placeholder="Enter first name"
            value={form.complainant_first_name}
            onChange={(event) => handleChange("complainant_first_name", event.target.value)}
            error={errors.complainant_first_name}
            fullWidth
            required
          />

          <InputField
            label="Complainant Last Name"
            iconName="FaUser"
            placeholder="Enter last name"
            value={form.complainant_last_name}
            onChange={(event) => handleChange("complainant_last_name", event.target.value)}
            error={errors.complainant_last_name}
            fullWidth
            required
          />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Select
            label="Driver"
            iconName="FaIdCard"
            value={form.driver_id}
            onChange={(event) => handleChange("driver_id", event.target.value)}
            options={[
              {
                value: "",
                label: isOptionsLoading ? "Loading drivers..." : "Select driver",
              },
              ...drivers.map((driver) => ({
                value: driver.id.toString(),
                label: `${driver.name || `Driver #${driver.id}`}${driver.plate_number ? ` - ${driver.plate_number}` : ""}`,
              })),
            ]}
            error={errors.driver_id}
            disabled={isOptionsLoading}
            fullWidth
            required
          />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Select
            label="Category"
            iconName="FaListUl"
            value={form.category_id}
            onChange={(event) => handleChange("category_id", event.target.value)}
            options={[
              {
                value: "",
                label: isOptionsLoading ? "Loading categories..." : "Select category",
              },
              ...categories.map((category) => ({
                value: category.id.toString(),
                label: category.category_name || `Category #${category.id}`,
              })),
            ]}
            error={errors.category_id}
            disabled={isOptionsLoading}
            fullWidth
            required
          />

          <Select
            label="Status"
            iconName="FaFilter"
            value={form.status}
            onChange={(event) => handleChange("status", event.target.value)}
            options={[
              { value: "new", label: "New" },
              { value: "pending", label: "Pending" },
              { value: "resolved", label: "Resolved" },
            ]}
            error={errors.status}
            fullWidth
          />
        </div>

        <InputField
          label="Title"
          iconName="FaPen"
          placeholder="Enter complaint title"
          value={form.title}
          onChange={(event) => handleChange("title", event.target.value)}
          error={errors.title}
          fullWidth
          required
        />

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <InputField
            label="Incident Time"
            type="datetime-local"
            iconName="FaCalendarDays"
            value={form.incident_date_time}
            onChange={(event) => handleChange("incident_date_time", event.target.value)}
            error={errors.incident_date_time}
            fullWidth
            required
          />

          <InputField
            label="Incident Location"
            iconName="FaLocationDot"
            placeholder="Enter incident location"
            value={form.incident_location}
            onChange={(event) => handleChange("incident_location", event.target.value)}
            error={errors.incident_location}
            fullWidth
            required
          />
        </div>

        <TextArea
          label="Description"
          placeholder="Enter complaint details"
          value={form.description}
          onChange={(event) => handleChange("description", event.target.value)}
          error={errors.description}
          rows={4}
          maxLength={1000}
          showCounter
          fullWidth
          required
        />
      </form>
    </Modal>
  );
};

export default CreateComplaintModal;
