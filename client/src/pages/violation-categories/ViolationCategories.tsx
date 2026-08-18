import { useState, useEffect } from 'react';
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
import CreateViolationCategoryModal from './components/CreateViolationCategoryModal';
import EditViolationCategoryModal from './components/EditViolationCategoryModal';
import DeleteViolationCategoryModal from './components/DeleteViolationCategoryModal';
import RestoreViolationCategoryModal from './components/RestoreViolationCategoryModal';
import ViolationCategoryService from '../../services/ViolationCategoryService';
import type { ViolationCategory } from '../../interfaces/violationCategory';
import { notify } from '../../util/notify';
import { useDebounce } from '../../hooks/index';

/* =========================
   TYPES
========================= */
type SortState = {
  key: keyof ViolationCategory;
  direction: "asc" | "desc";
};

type PaginationMeta = {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
};

type RecycleFilter = 'active' | 'deleted' | 'all';

type ViolationCategoryListPayload = {
  violation_categories?: ViolationCategory[] | { data?: ViolationCategory[] };
  data?: ViolationCategory[];
  meta?: Partial<PaginationMeta>;
};

type ApiResponse<T> = {
  status?: string;
  message?: string;
  data?: T;
};

const normalizeCategoryList = (
  response: ViolationCategoryListPayload | ApiResponse<ViolationCategoryListPayload>,
) => {
  const payload = (
    response.data && !Array.isArray(response.data) && ('violation_categories' in response.data || 'meta' in response.data)
      ? response.data
      : response
  ) as ViolationCategoryListPayload;

  const categorySource = payload.violation_categories || payload.data || [];
  const categories = Array.isArray(categorySource)
    ? categorySource
    : categorySource.data || [];

  return {
    categories,
    meta: payload.meta,
  };
};

const ViolationCategories = () => {
  const [categories, setCategories] = useState<ViolationCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState<PaginationMeta>({
    current_page: 1,
    last_page: 1,
    per_page: 10,
    total: 0,
  });

  const [sort, setSort] = useState<SortState>({
    key: "category_name",
    direction: "asc",
  });

  const [filter, setFilter] = useState<RecycleFilter>('active');
  const filters = {
    active: {
      icon: 'FaCheck',
      label: 'Active',
    },
    deleted: {
      icon: 'FaTrash',
      label: 'Recycle Bin',
    },
    all: {
      icon: 'FaList',
      label: 'All',
    },
  } as const;

  const [searchTerm, setSearchTerm] = useState("");
  const isSearching = searchTerm?.trim() !== "";
  const debouncedSearchTerm = useDebounce(searchTerm);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  /* =========================
     FETCH CATEGORIES
  ========================= */
  const fetchCategories = async (currentPage = 1, pageLimit = 10) => {
    setIsLoading(true);
    try {
      const response = (await ViolationCategoryService.getAll({
        page: currentPage,
        limit: pageLimit,
        search: debouncedSearchTerm,
        sort_by: sort.key,
        sort_order: sort.direction,
        filter,
      })) as ViolationCategoryListPayload | ApiResponse<ViolationCategoryListPayload>;

      const { categories: categoryList, meta } = normalizeCategoryList(response);
      setCategories(categoryList);

      // Update pagination metadata
      if (meta) {
        setPagination({
          current_page: meta.current_page || currentPage,
          last_page: meta.last_page || 1,
          per_page: meta.per_page || pageLimit,
          total: meta.total || 0,
        });
      }
    } catch (error) {
      notify.error("Failed to load categories");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories(page, pageSize);
  }, [page, pageSize, sort, debouncedSearchTerm, filter]);

  /* =========================
     SORT HANDLER
  ========================= */
  const handleSort = (key: keyof ViolationCategory) => {
    setPage(1);
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
     MODAL STATE
  ========================= */
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const handleCreateClose = () => {
    setIsCreateModalOpen(false);
  };

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<ViolationCategory | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<ViolationCategory | null>(null);
  const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(false);
  const [categoryToRestore, setCategoryToRestore] = useState<ViolationCategory | null>(null);

  const handleEdit = (category: ViolationCategory) => {
    setSelectedCategory(category);
    setIsEditModalOpen(true);
  };

  const handleEditClose = () => {
    setIsEditModalOpen(false);
    setSelectedCategory(null);
  };

  const handleSuccess = async () => {
    await fetchCategories();

    setIsCreateModalOpen(false);
    setIsEditModalOpen(false);

    setSelectedCategory(null);
  };

  /* =========================
     DELETE HANDLER
  ========================= */
  const handleDelete = (category: ViolationCategory) => {
    setCategoryToDelete(category);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteSuccess = async () => {
    await fetchCategories(page, pageSize);
    setCategoryToDelete(null);
  };

  const handleCancelDelete = () => {
    setIsDeleteModalOpen(false);
    setCategoryToDelete(null);
  };

  /* =========================
     RESTORE HANDLER
  ========================= */
  const handleRestore = (category: ViolationCategory) => {
    setCategoryToRestore(category);
    setIsRestoreModalOpen(true);
  };

  const handleRestoreSuccess = async () => {
    await fetchCategories(page, pageSize);
    setCategoryToRestore(null);
  };

  const handleCancelRestore = () => {
    setIsRestoreModalOpen(false);
    setCategoryToRestore(null);
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
            Violation Categories
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-mono uppercase tracking-[0.2em]">
            Classification Management
          </p>
        </div>

        <Button
          variant='primary'
          iconName='FaPlus'
          size="lg"
          className="bg-blue-950 hover:bg-blue-900 text-white dark:bg-white dark:hover:bg-slate-100 dark:text-slate-950 border border-slate-950 dark:border-transparent shadow-sm font-extrabold"
          onClick={() => setIsCreateModalOpen(true)}
        >
          Add Category
        </Button>
      </div>

      {/* Search and Filter Bar */}
      <div className="relative z-10 bg-white dark:bg-bg-light border border-slate-200 dark:border-white/5 rounded-2xl p-6 shadow-sm space-y-6 transition-colors duration-300">
        <div className="flex flex-col lg:flex-row gap-6 items-end">
          <div className="flex-1 w-full">
            <InputField
              label='Categories Search'
              name='search'
              placeholder='Search by category name or description...'
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

          <div className="bg-slate-100 dark:bg-black/40 rounded-xl p-1 flex items-center gap-1 border border-slate-200/50 dark:border-white/5 self-start lg:self-end">
            {(Object.keys(filters) as RecycleFilter[]).map((f) => {
              const { icon, label } = filters[f];
              const isActive = filter === f;
              return (
                <button
                  key={f}
                  type="button"
                  onClick={() => {
                    setFilter(f);
                    setPage(1);
                  }}
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
              <TableCell isHeader sortKey="category_name" currentSort={sort} onSort={handleSort} className="text-slate-700 dark:text-slate-300 py-4 w-1/4">
                Category Name
              </TableCell>
              <TableCell isHeader className="text-slate-700 dark:text-slate-300 py-4 w-2/5">
                Description
              </TableCell>
              <TableCell isHeader sortKey="penalty_amount" currentSort={sort} onSort={handleSort} className="text-slate-700 dark:text-slate-300 py-4 w-1/5">
                Penalty Amount
              </TableCell>
              <TableCell isHeader className="text-slate-700 dark:text-slate-300 py-4 text-right pr-8 content-center w-28">Command</TableCell>
            </tr>
          </TableHeader>

          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-24">
                  <div className="flex items-center justify-center w-full">
                    <LoadingSpinner size="lg" text={isSearching ? "Scanning Categories..." : "Syncing Category Data..."} />
                  </div>
                </TableCell>
              </TableRow>
            ) : categories.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center" className="py-24">
                  <div className="flex w-full flex-col items-center justify-center text-center space-y-6">
                    <div className="w-20 h-20 flex items-center justify-center rounded-3xl bg-slate-100 border border-slate-200 dark:bg-white/10 dark:border-white/10">
                      <Icon iconName="FaList" className="text-4xl text-slate-400 dark:text-slate-500" />
                    </div>
                    <div className="space-y-2">
                      <h2 className="text-xl font-bold text-slate-800 dark:text-white uppercase tracking-tighter">
                        {filter === 'deleted' ? 'Recycle Bin Is Empty' : 'Zero Categories Found'}
                      </h2>
                      <p className="text-sm text-slate-500 max-w-xs mx-auto text-wrap">
                        {filter === 'deleted'
                          ? 'Deleted categories will appear here when moved to the recycle bin.'
                          : 'The query returned no results. Verify your search term or add a new category.'}
                      </p>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              categories.map((category) => {
                const isDeleted = Boolean(category.deleted_at);

                return (
                  <TableRow key={category.id} className="border-b border-slate-100 dark:border-white/5 last:border-0 hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors">
                    <TableCell className="font-extrabold text-sm text-slate-900 dark:text-white">
                      <div className="flex items-center gap-2">
                        <span>{category.category_name}</span>
                        {isDeleted && (
                          <span className="px-2 py-0.5 rounded-md bg-rose-100 dark:bg-red-500/15 text-rose-700 dark:text-red-400 font-mono text-[10px] uppercase border border-rose-300 dark:border-red-500/30">
                            Deleted
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-700 dark:text-slate-300 text-xs font-semibold">{category.description || '-'}</TableCell>
                    <TableCell className="text-slate-900 dark:text-white font-mono text-sm font-bold">{category.penalty_amount}</TableCell>
                    <TableCell className="text-right pr-2">
                      <div className='flex gap-2 items-center justify-end'>
                        {isDeleted ? (
                          <Button
                            size='sm'
                            variant='ghost'
                            iconName='FaArrowRotateLeft'
                            className='text-emerald-600 hover:bg-emerald-500/10 border-transparent'
                            onClick={() => handleRestore(category)}
                            tooltip="Restore"
                          />
                        ) : (
                          <>
                            <Button
                              size='sm'
                              variant='ghost'
                              iconName='FaPencil'
                              className='text-slate-500 hover:text-emerald-600 border-transparent hover:bg-emerald-500/10'
                              onClick={() => handleEdit(category)}
                              tooltip="Edit"
                            />
                            <Button
                              size='sm'
                              variant='ghost'
                              iconName='FaTrash'
                              className='text-slate-500 hover:text-red-650 border-transparent hover:bg-red-500/10'
                              onClick={() => handleDelete(category)}
                              tooltip="Move to recycle bin"
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
        {!isLoading && categories.length > 0 && (
          <div className="bg-slate-50 dark:bg-black/20 border-t border-slate-100 dark:border-white/5 p-6">
            <TablePagination
              currentPage={pagination.current_page}
              totalPages={totalPages}
              pageSize={pageSize}
              totalResults={pagination.total}
              onPageChange={setPage}
              onPageSizeChange={(size) => {
                setPageSize(size);
                setPage(1);
              }}
              resourceLabel="Categories"
            />
          </div>
        )}
      </div>

      <CreateViolationCategoryModal
        isOpen={isCreateModalOpen}
        onClose={handleCreateClose}
        onSuccess={handleSuccess}
      />

      <EditViolationCategoryModal
        isOpen={isEditModalOpen}
        onClose={handleEditClose}
        user={selectedCategory}
        onSuccess={handleSuccess}
        size="sm"
      />

      <DeleteViolationCategoryModal
        isOpen={isDeleteModalOpen}
        onClose={handleCancelDelete}
        user={categoryToDelete}
        onSuccess={handleDeleteSuccess}
      />

      <RestoreViolationCategoryModal
        isOpen={isRestoreModalOpen}
        onClose={handleCancelRestore}
        category={categoryToRestore}
        onSuccess={handleRestoreSuccess}
      />

      <ToastProvider />
    </div>
  );

  return <MainLayout content={content} />;
};

export default ViolationCategories;
