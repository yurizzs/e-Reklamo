import { useState, useEffect } from 'react';
import { useDebounce, useDateFormatter } from '../../hooks/index';
import { MainLayout } from '../../components/layouts';
import {
  Table,
  TableHeader,
  TableCell,
  TableBody,
  TableRow,
  TablePagination,
} from '../../components/ui/table/Table';
import { Button, ToastProvider, LoadingSpinner, Icon } from '../../components/ui';
import { InputField } from '../../components/ui/forms';
import CreateUserModal from './components/CreateUserModal';
import EditUserModal from './components/EditUserModal';
import DeleteUserModal from './components/DeleteUserModal';
import RestoreUserModal from './components/RestoreUserModal';
import ViewUserModal from './components/ViewUserModal';
import UserService from '../../services/UserService';
import type { User } from '../../interfaces/user';
import { notify } from '../../util/notify';
import { useAuth } from '../../contexts/AuthContext';

/* =========================
   TYPES
========================= */
type SortState = {
  key: keyof User;
  direction: "asc" | "desc";
};

type PaginationMeta = {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
};

const Users = () => {
  const dateFormat = useDateFormatter();
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState<PaginationMeta>({
    current_page: 1,
    last_page: 1,
    per_page: 10,
    total: 0,
  });

  const [sort, setSort] = useState<SortState>({
    key: "first_name",
    direction: "asc",
  });

  const [filter, setFilter] = useState<'active' | 'deleted' | 'all'>('active');
  const filters = {
    active: {
      icon: 'FaCheck',
      label: 'Active Users',
    },
    deleted: {
      icon: 'FaTrash',
      label: 'Deleted Users',
    },
    all: {
      icon: 'FaList',
      label: 'All Users',
    },
  } as const;

  const [searchTerm, setSearchTerm] = useState("");
  const isSearching = searchTerm?.trim() !== "";
  const debouncedSearchTerm = useDebounce(searchTerm);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  /* =========================
     FETCH USERS
  ========================= */
  const fetchUsers = async (currentPage = 1, pageLimit = 10) => {
    setIsLoading(true);
    try {
      const response = await UserService.getAll({
        page: currentPage,
        limit: pageLimit,
        search: debouncedSearchTerm,
        sort_by: sort.key,
        sort_order: sort.direction,
        filter: filter,
      });

      // Extract users and pagination metadata
      const userData = response.data || response;
      setUsers(userData.users || userData.data || []);

      // Update pagination metadata
      if (userData.meta) {
        setPagination({
          current_page: userData.meta.current_page || currentPage,
          last_page: userData.meta.last_page || 1,
          per_page: userData.meta.per_page || pageLimit,
          total: userData.meta.total || 0,
        });
      }
    } catch (error) {
      notify.error("Failed to load users");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setPage(1); // Reset to first page when filter changes
    fetchUsers(1, pageSize);
  }, [filter]);

  useEffect(() => {
    fetchUsers(page, pageSize);
  }, [page, pageSize, sort, debouncedSearchTerm, filter]);

  /* =========================
     SORT HANDLER
  ========================= */
  const handleSort = (key: keyof User) => {
    setPage(1); // Reset to first page when sorting
    setSort((prev) => ({
      key,
      direction:
        prev.key === key && prev.direction === "asc"
          ? "desc"
          : "asc",
    }));
  };

  /* =========================
     PAGINATION
  ========================= */
  const totalPages = pagination.last_page;

  /* =========================
    Date Formmater 
  ========================= */


  /* =========================
     MODAL STATE
  ========================= */
  const [isCreateUserModalOpen, setIsCreateModalOpen] = useState(false);

  const handleCreateUserClose = () => {
    setIsCreateModalOpen(false);
    setPage(1);
  };

  const [isEditUserModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(false);
  const [userToRestore, setUserToRestore] = useState<User | null>(null);
  const [isViewUserModalOpen, setIsViewUserModalOpen] = useState(false);
  const [selectedUserSlug, setSelectedUserSlug] = useState<string | null>(null);

  const handleViewUser = (slug: string) => {
    setSelectedUserSlug(slug);
    setIsViewUserModalOpen(true);
  };

  const handleViewUserClose = () => {
    setIsViewUserModalOpen(false);
    setSelectedUserSlug(null);
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setIsEditModalOpen(true);
  };

  const handleEditUserClose = () => {
    setIsEditModalOpen(false);
    setSelectedUser(null);
  };

  const handleUserSuccess = async () => {
    await fetchUsers();

    setIsCreateModalOpen(false);
    setIsEditModalOpen(false);

    setSelectedUser(null);
  };

  /* =========================
     DELETE HANDLER
  ========================= */
  const handleDeleteUser = (user: User) => {
    setUserToDelete(user);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteSuccess = async () => {
    await fetchUsers(page, pageSize);
    setUserToDelete(null);
  };

  const handleCancelDelete = () => {
    setIsDeleteModalOpen(false);
    setUserToDelete(null);
  };

  /* =========================
     RESTORE HANDLER
  ========================= */
  const handleRestoreUser = (user: User) => {
    setUserToRestore(user);
    setIsRestoreModalOpen(true);
  };

  const handleRestoreSuccess = async () => {
    await fetchUsers(page, pageSize);
    setUserToRestore(null);
  };

  const handleCancelRestore = () => {
    setIsRestoreModalOpen(false);
    setUserToRestore(null);
  };

  const content = (
    <div className="relative space-y-8 pb-12 text-slate-800 dark:text-slate-200 transition-colors duration-300">
      {/* Background Decorative Glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-green-600/5 rounded-full blur-[100px]" />
      </div>

      {/* Header Section */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-black uppercase tracking-tighter text-slate-900 dark:text-white">
            User Personnel
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-mono uppercase tracking-[0.2em]">
            System Access Management
          </p>
        </div>

        <Button
          variant='primary'
          iconName='FaPlus'
          size="lg"
          className="bg-blue-950 hover:bg-blue-900 text-white dark:bg-white dark:hover:bg-slate-100 dark:text-slate-950 border border-slate-950 dark:border-transparent shadow-sm font-extrabold"
          onClick={() => setIsCreateModalOpen(true)}
        >
          Add User
        </Button>
      </div>

      {/* Search and Filter Bar */}
      <div className="relative z-10 bg-white dark:bg-bg-light border border-slate-200 dark:border-white/5 rounded-2xl p-6 shadow-sm space-y-6 transition-colors duration-300">
        <div className="flex flex-col lg:flex-row gap-6 items-end">
          <div className="flex-1 w-full">
            <InputField
              label='Users Search'
              name='search'
              placeholder='Search by name, username, or email...'
              fullWidth
              iconName='FaMagnifyingGlass'
              className="bg-slate-50 dark:bg-black/20 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:border-slate-400 dark:focus:border-white/20"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
            />
          </div>

          {/* Filter Tabs */}
          <div className="bg-slate-100 dark:bg-black/40 rounded-xl p-1 flex items-center gap-1 border border-slate-200/50 dark:border-white/5 self-start lg:self-end">
            {(Object.keys(filters) as Array<keyof typeof filters>).map((f) => {
              const { icon, label } = filters[f];
              const isActive = filter === f;
              return (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`
                    px-4 py-2 rounded-xl font-bold uppercase text-[10px] tracking-widest transition-all duration-200 flex items-center gap-2
                    ${isActive
                      ? 'bg-blue-800 text-white dark:bg-white dark:text-slate-950 shadow-sm'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-white/5'}
                  `}
                >
                  <Icon iconName={icon} size={12} />
                  <span className="hidden sm:inline">{label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Table Container */}
      <div className="relative z-10 bg-white dark:bg-bg-light border border-slate-200 dark:border-white/5 rounded-2xl shadow-sm overflow-hidden transition-colors duration-300">
        <Table className="border-collapse bg-white dark:bg-bg-light border-0 shadow-none transition-colors duration-300">
          <TableHeader className="bg-slate-50 dark:bg-black/25 border-b border-slate-100 dark:border-white/5 text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider text-[11px]">
            <tr>
              <TableCell isHeader align="center" className="text-slate-700 dark:text-slate-300 py-4 w-20">Avatar</TableCell>
              <TableCell
                isHeader
                sortKey="name"
                currentSort={sort}
                onSort={handleSort}
                className="text-slate-700 dark:text-slate-300 py-4"
              >
                Full Name
              </TableCell>

              <TableCell isHeader align="left" className="text-slate-700 dark:text-slate-300 py-4">Email</TableCell>
              <TableCell isHeader align="left" className="text-slate-700 dark:text-slate-300 py-4">Provisioned</TableCell>

              <TableCell isHeader align="left" className="text-slate-700 dark:text-slate-300 py-4">Username</TableCell>

              <TableCell isHeader align="left" className="text-emerald-500/50 font-mono text-[10px] uppercase tracking-widest py-5">Phone</TableCell>

              <TableCell isHeader align="left" className="text-emerald-500/50 font-mono text-[10px] uppercase tracking-widest py-5">Address</TableCell>

              <TableCell
                isHeader
                sortKey="role"
                currentSort={sort}
                onSort={handleSort}
                className="text-slate-700 dark:text-slate-300 py-4"
              >
                Role
              </TableCell>
              <TableCell isHeader align="center" className="text-slate-700 dark:text-slate-300 py-4 text-right pr-8 content-center">Command</TableCell>
            </tr>
          </TableHeader>

          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-24">
                  <div className="flex items-center justify-center w-full">
                    <LoadingSpinner size="lg" text={isSearching ? "Scanning Users..." : "Syncing User Data..."} />
                  </div>
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} align="center" className="py-24">
                  <div className="flex flex-col items-center justify-center text-center space-y-6">
                    <div className="w-20 h-20 flex items-center justify-center rounded-3xl bg-slate-100 border border-slate-200 dark:bg-white/10 dark:border-white/10">
                      <Icon iconName="FaUsersSlash" className="text-4xl text-slate-400 dark:text-slate-500" />
                    </div>
                    <div className="space-y-2">
                      <h2 className="text-xl font-bold text-slate-800 dark:text-white uppercase tracking-tighter">Zero Users Found</h2>
                      <p className="text-sm text-slate-500 max-w-xs mx-auto">The user query returned null. Verify filters or add a new system user.</p>
                    </div>
                    <Button
                      variant='primary'
                      iconName='FaPlus'
                      className="bg-blue-950 hover:bg-blue-900 text-white dark:bg-white dark:hover:bg-slate-100 dark:text-slate-950 border border-slate-950 dark:border-transparent font-extrabold shadow-sm"
                      onClick={() => setIsCreateModalOpen(true)}
                    >
                      Add User
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => {
                const isDeleted = Boolean(user.deleted_at);
                const isCurrentUser = currentUser?.id === user.id;
                const displayName = user.name || `${user.first_name} ${user.last_name}`.trim();

                return (
                  <TableRow key={user.id} className="border-b border-slate-100 dark:border-white/5 last:border-0 hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors">
                    <TableCell>
                      {user.avatar ? (
                        <div className="relative">
                          <img
                            src={`${import.meta.env.VITE_STORAGE_URL}/${user.avatar}`}
                            alt={displayName}
                            className="w-10 h-10 rounded-xl object-cover border border-slate-200 dark:border-white/10"
                          />
                          {!isDeleted && <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 bg-emerald-500 border-2 border-white dark:border-[#0B0F1A] rounded-full" />}
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-black/20 border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-700 dark:text-primary font-black">
                          {displayName.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="font-extrabold text-sm text-slate-900 dark:text-white">
                      <div className="flex items-center gap-2">
                        <span>{displayName}</span>
                        {isDeleted && (
                          <span className="px-2 py-0.5 rounded-md bg-rose-100 dark:bg-red-500/15 text-rose-700 dark:text-red-400 font-mono text-[10px] uppercase border border-rose-300 dark:border-red-500/30">
                            Deleted
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-700 dark:text-slate-300 text-xs font-semibold">{user.email}</TableCell>
                    <TableCell className="text-slate-700 dark:text-slate-300 font-mono text-xs font-semibold">{dateFormat.date(user.created_at)}</TableCell>
                    <TableCell>
                      <span className="px-2 py-1 rounded-md bg-slate-100 dark:bg-black/30 text-slate-900 dark:text-white font-mono text-xs font-extrabold border border-slate-200 dark:border-white/10">
                        @{user.username}
                      </span>
                    </TableCell>
                    <TableCell className="text-slate-400 font-mono text-xs">{user.phone || '-'}</TableCell>
                    <TableCell className="text-slate-300 text-xs max-w-xs truncate">{user.address || '-'}</TableCell>
                    <TableCell>
                      <span className={`
                        px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border
                        ${user.role === 'admin'
                          ? 'bg-rose-100 border-rose-300 text-rose-700 dark:bg-red-500/10 dark:border-red-500/20 dark:text-red-400'
                          : 'bg-slate-100 border-slate-300 text-slate-800 dark:bg-white/10 dark:border-white/10 dark:text-white'}
                      `}>
                        {user.role}
                      </span>
                    </TableCell>
                    <TableCell className="text-right pr-2">
                      <div className='flex gap-2 items-center justify-end'>
                        <Button
                          size='sm'
                          variant='ghost'
                          iconName='FaEye'
                          className='text-slate-500 hover:text-emerald-600 border-transparent hover:bg-emerald-500/10'
                          onClick={() => handleViewUser(user.slug)}
                          tooltip="View"
                        />
                        {isDeleted ? (
                          <Button
                            size='sm'
                            variant='ghost'
                            iconName='FaArrowRotateLeft'
                            className='text-emerald-600 hover:bg-emerald-500/10 border-transparent'
                            onClick={() => handleRestoreUser(user)}
                            tooltip="Restore"
                          />
                        ) : (
                          <>
                            <Button
                              size='sm'
                              variant='ghost'
                              iconName='FaPencil'
                              className='text-slate-500 hover:text-emerald-600 border-transparent hover:bg-emerald-500/10'
                              onClick={() => handleEditUser(user)}
                              tooltip="Edit"
                            />
                            <Button
                              size='sm'
                              variant='ghost'
                              iconName='FaTrash'
                              className='text-slate-500 hover:text-red-650 border-transparent hover:bg-red-500/10 disabled:hover:text-slate-500 disabled:hover:bg-transparent'
                              onClick={() => handleDeleteUser(user)}
                              disabled={isCurrentUser}
                              tooltip={isCurrentUser ? "You cannot delete your own account" : "Delete"}
                            />
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>

        {/* Pagination Section */}
        {!isLoading && users.length > 0 && (
          <div className="bg-slate-50 dark:bg-black/20 border-t border-slate-100 dark:border-white/5 p-6">
            <TablePagination
              currentPage={pagination.current_page}
              totalPages={totalPages}
              totalResults={pagination.total}
              pageSize={pageSize}
              onPageChange={setPage}
              onPageSizeChange={(size) => {
                setPageSize(size);
                setPage(1);
              }}
              resourceLabel="Users"
            />
          </div>
        )}
      </div>

      <CreateUserModal
        isOpen={isCreateUserModalOpen}
        onClose={handleCreateUserClose}
        onSuccess={handleUserSuccess}
      />

      <EditUserModal
        isOpen={isEditUserModalOpen}
        onClose={handleEditUserClose}
        user={selectedUser}
        onSuccess={handleUserSuccess}
        size="sm"
      />

      <DeleteUserModal
        isOpen={isDeleteModalOpen}
        onClose={handleCancelDelete}
        user={userToDelete}
        onSuccess={handleDeleteSuccess}
      />

      <RestoreUserModal
        isOpen={isRestoreModalOpen}
        onClose={handleCancelRestore}
        user={userToRestore}
        onSuccess={handleRestoreSuccess}
      />

      <ViewUserModal
        isOpen={isViewUserModalOpen}
        onClose={handleViewUserClose}
        userSlug={selectedUserSlug}
        onSuccess={handleUserSuccess}
      />

      <ToastProvider />
    </div>
  );

  return <MainLayout content={content} />;
};

export default Users;
