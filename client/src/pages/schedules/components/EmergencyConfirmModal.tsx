import React, { useState } from "react";
import { Modal, Button, Icon } from "../../../components/ui";
import OperatorScheduleService from "../../../services/OperatorScheduleService";
import { notify } from "../../../util/notify";

interface EmergencyConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  scheduleId?: number;
  employeeId?: number;
  employeeName: string;
  supervisorName?: string;
}

const PRESET_REASONS = [
  "Device Camera Hardware Fault / Damaged Lens",
  "Extreme Weather / Low-Light Field Conditions",
  "Immediate Urgent Emergency Field Dispatch",
  "Field Connectivity / Mobile Device Malfunction",
  "Direct Supervisor Physical Presence Verification",
];

export const EmergencyConfirmModal: React.FC<EmergencyConfirmModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  scheduleId,
  employeeName,
  supervisorName = "Supervisor",
}) => {
  const [selectedPreset, setSelectedPreset] = useState<string>(PRESET_REASONS[0]);
  const [customNotes, setCustomNotes] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!scheduleId) {
      notify.error("No active schedule ID found to confirm. Please ensure schedule is selected.");
      return;
    }

    const fullReason = customNotes.trim()
      ? `${selectedPreset} — ${customNotes.trim()}`
      : selectedPreset;

    setIsSubmitting(true);
    try {
      await OperatorScheduleService.emergencyConfirm(scheduleId, {
        emergency_reason: fullReason,
      });

      notify.success(`Emergency attendance manually confirmed for ${employeeName}`);
      onSuccess();
      onClose();
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to submit manual confirmation.";
      notify.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md" hideHeader>
      <form onSubmit={handleSubmit} className="space-y-5 p-1 font-sans text-slate-800 dark:text-slate-100">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 dark:border-white/10 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300">
                <Icon iconName="FaTriangleExclamation" className="text-amber-600 text-xs" />
                Emergency Protocol
              </span>
              <span className="text-slate-400 text-xs">•</span>
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                Staff Override
              </span>
            </div>
            <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              Manual Attendance Confirmation
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Authorized supervisor override for <strong className="text-slate-700 dark:text-slate-200">{employeeName}</strong> when facial scan is unavailable.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 transition-all"
          >
            <Icon iconName="FaXmark" className="text-base" />
          </button>
        </div>

        {/* Audit Warning */}
        <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-amber-900 dark:text-amber-200 text-xs leading-relaxed">
          <Icon iconName="FaShield" className="text-amber-600 mt-0.5 shrink-0 text-sm" />
          <div>
            <strong>Supervisor Audit Log Notice:</strong> This action permanently marks the operator as present via manual override. The authorizer (<strong>{supervisorName}</strong>) and justification reason will be logged in the working schedule audit view.
          </div>
        </div>

        {/* Form Fields */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-2">
              Emergency Override Reason
            </label>
            <div className="space-y-2">
              {PRESET_REASONS.map((reason) => (
                <label
                  key={reason}
                  className={`flex items-center gap-3 p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                    selectedPreset === reason
                      ? "border-blue-500 bg-blue-50/50 dark:bg-blue-500/10 text-blue-900 dark:text-blue-200 font-bold"
                      : "border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5"
                  }`}
                >
                  <input
                    type="radio"
                    name="override_reason"
                    checked={selectedPreset === reason}
                    onChange={() => setSelectedPreset(reason)}
                    className="accent-blue-600 w-4 h-4"
                  />
                  <span>{reason}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
              Additional Incident Notes (Optional)
            </label>
            <textarea
              rows={2}
              value={customNotes}
              onChange={(e) => setCustomNotes(e.target.value)}
              placeholder="e.g. Officer arrived on-site at Sector 4 checkpoint; phone camera lens cracked during transit."
              className="w-full text-xs p-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-black/20 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-white/10">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={isSubmitting}
            className="text-xs font-bold px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10"
          >
            Cancel
          </Button>

          <Button
            type="submit"
            variant="primary"
            disabled={isSubmitting}
            className="bg-amber-600 hover:bg-amber-700 text-white font-black text-xs px-5 py-2.5 rounded-xl shadow-lg shadow-amber-600/25 transition-all flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Icon iconName="FaSpinner" className="animate-spin" />
                <span>Confirming Override...</span>
              </>
            ) : (
              <>
                <Icon iconName="FaCheck" />
                <span>Confirm Emergency Attendance</span>
              </>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default EmergencyConfirmModal;
