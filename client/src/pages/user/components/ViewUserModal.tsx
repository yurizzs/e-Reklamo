import { useState, useEffect } from 'react';
import { Button, LoadingSpinner, Icon, Modal } from '../../../components/ui';
import UserService from '../../../services/UserService';
import type { User } from '../../../interfaces/user';
import { notify } from '../../../util/notify';
import { useDateFormatter } from '../../../hooks/index';
import EditUserModal from './EditUserModal';
import DeleteUserModal from './DeleteUserModal';
import RestoreUserModal from './RestoreUserModal';

interface ViewUserModalProps {
    isOpen: boolean;
    onClose: () => void;
    userSlug: string | null;
    onSuccess?: () => void;
}

/* =========================
   DETAIL ROW
   ========================= */
const DetailRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <div className="flex flex-col gap-1 py-3 border-b border-slate-100 dark:border-white/5 last:border-0">
        <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {label}
        </span>
        <span className="text-xs text-slate-800 dark:text-slate-200 font-semibold">
            {value || <span className="text-slate-400 dark:text-slate-500 italic">—</span>}
        </span>
    </div>
);

/* =========================
   BADGE
   ========================= */
const RoleBadge = ({ role }: { role: string }) => {
    const isAdmin = role === 'admin';
    return (
        <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${isAdmin
                ? 'bg-rose-100 border-rose-250 text-rose-700 dark:bg-red-500/10 dark:border-red-500/20 dark:text-red-400'
                : 'bg-slate-100 border-slate-300 text-slate-800 dark:bg-white/10 dark:border-white/10 dark:text-white'
                }`}
        >
            <Icon iconName={isAdmin ? 'FaShieldHalved' : 'FaUser'} size={10} className="shrink-0" />
            {role}
        </span>
    );
};

/* =========================
   VIEW USER MODAL
   ========================= */
const ViewUserModal = ({ isOpen, onClose, userSlug, onSuccess }: ViewUserModalProps) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(false);

    const dateFormat = useDateFormatter();
    const displayName = user?.name || `${user?.first_name ?? ''} ${user?.last_name ?? ''}`.trim();
    const isDeleted = Boolean(user?.deleted_at);

    /* =========================
       FETCH USER
       ========================= */
    const fetchUser = async () => {
        if (!userSlug) return;
        setIsLoading(true);
        try {
            const response = await UserService.getOne(userSlug);
            setUser(response.data?.user ?? response.user ?? null);
        } catch (error) {
            notify.error("Failed to load user details");
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (!isOpen || !userSlug) {
            setUser(null);
            return;
        }
        fetchUser();
    }, [isOpen, userSlug]);

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Personnel Account Information"
            size="xl"
        >
            {isLoading ? (
                <div className="flex h-64 items-center justify-center">
                    <LoadingSpinner size="lg" text="Loading user details..." />
                </div>
            ) : !user ? (
                <div className="py-12 text-center text-slate-500">
                    <Icon iconName="FaUserSlash" className="mx-auto mb-2 text-2xl text-slate-400" />
                    <p className="text-sm font-semibold">User record not found.</p>
                </div>
            ) : (
                <div className="space-y-6 text-slate-800 dark:text-slate-200">
                    {/* User Action Buttons inside the modal */}
                    <div className="flex items-center justify-end gap-2">
                        {isDeleted ? (
                            <Button
                                variant="primary"
                                iconName="FaArrowRotateLeft"
                                onClick={() => setIsRestoreModalOpen(true)}
                                className="bg-blue-600 hover:bg-blue-500 font-extrabold text-xs"
                            >
                                Restore User
                            </Button>
                        ) : (
                            <>
                                <Button
                                    variant="primary"
                                    iconName="FaPencil"
                                    onClick={() => setIsEditModalOpen(true)}
                                    className="bg-blue-600 hover:bg-blue-500 font-extrabold text-xs"
                                >
                                    Edit User
                                </Button>
                                <Button
                                    variant="danger"
                                    iconName="FaTrash"
                                    onClick={() => setIsDeleteModalOpen(true)}
                                    className="font-extrabold text-xs"
                                >
                                    Delete
                                </Button>
                            </>
                        )}
                    </div>

                    {/* User Details Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Left — Avatar */}
                        <div className="md:col-span-1">
                            <div className="bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/5 rounded-2xl p-6 flex flex-col items-center text-center gap-4 transition-colors">
                                {user.avatar ? (
                                    <img
                                        src={`${import.meta.env.VITE_STORAGE_URL}/${user.avatar}`}
                                        alt={displayName}
                                        className="w-24 h-24 rounded-full object-cover ring-2 ring-blue-500/20"
                                    />
                                ) : (
                                    <div className="w-24 h-24 rounded-full bg-blue-500/10 flex items-center justify-center text-3xl font-black text-blue-600 dark:text-blue-450 border border-blue-200 dark:border-blue-500/20">
                                        {displayName.charAt(0).toUpperCase()}
                                    </div>
                                )}

                                <div className="space-y-1.5">
                                    <div className="flex flex-col items-center gap-2">
                                        <h2 className="text-base font-black text-slate-900 dark:text-white leading-tight">{displayName}</h2>
                                        {isDeleted && (
                                            <span className="px-2 py-0.5 rounded bg-rose-100 dark:bg-red-500/10 text-rose-700 dark:text-red-400 font-mono text-[9px] uppercase border border-rose-250 dark:border-red-500/20">
                                                Deleted
                                            </span>
                                        )}
                                    </div>
                                    <RoleBadge role={user.role} />
                                </div>
                            </div>
                        </div>

                        {/* Right — Fields */}
                        <div className="md:col-span-2">
                            <div className="bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/5 rounded-2xl p-6 space-y-0 transition-colors">
                                <h3 className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2 pb-3 border-b border-slate-200 dark:border-white/10">
                                    Account Information
                                </h3>

                                <DetailRow label="Full Name" value={displayName} />
                                <DetailRow label="Email Address" value={user.email} />
                                <DetailRow label="Username" value={`@${user.username}`} />
                                <DetailRow label="Phone Number" value={user.phone} />
                                <DetailRow label="Role" value={<RoleBadge role={user.role} />} />
                                <DetailRow label="Theme Preference" value={
                                    <span className="capitalize font-semibold text-slate-700 dark:text-slate-350">{user.theme}</span>
                                } />
                                <DetailRow
                                    label="Account Created"
                                    value={dateFormat.dateTime(user.created_at)}
                                />
                                <DetailRow
                                    label="Last Updated"
                                    value={dateFormat.dateTime(user.updated_at)}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <EditUserModal
                isOpen={isEditModalOpen}
                onClose={() => {
                    setIsEditModalOpen(false);
                    fetchUser();
                    if (onSuccess) onSuccess();
                }}
                user={user}
                onSuccess={() => {
                    fetchUser();
                    if (onSuccess) onSuccess();
                }}
            />

            <DeleteUserModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                user={user}
                onSuccess={() => {
                    setIsDeleteModalOpen(false);
                    onClose();
                    if (onSuccess) onSuccess();
                }}
            />

            <RestoreUserModal
                isOpen={isRestoreModalOpen}
                onClose={() => setIsRestoreModalOpen(false)}
                user={user}
                onSuccess={() => {
                    setIsRestoreModalOpen(false);
                    fetchUser();
                    if (onSuccess) onSuccess();
                }}
            />
        </Modal>
    );
};

export default ViewUserModal;
