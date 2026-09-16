import { apiHandler } from '../api/apiHandler';
import type { VehicleType } from '../interfaces/vehicleType';

type RecycleFilter = 'active' | 'deleted' | 'all';

class VehicleTypeService {
  async getAll(params: {
    page?: number;
    limit?: number;
    search?: string;
    sort_by?: string;
    sort_order?: string;
    filter?: RecycleFilter;
  }) {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.search) queryParams.append('search', params.search);
    if (params.sort_by) queryParams.append('sort_by', params.sort_by);
    if (params.sort_order) queryParams.append('sort_order', params.sort_order);
    if (params.filter) queryParams.append('filter', params.filter);

    const response = await apiHandler.get(`/vehicle-types?${queryParams.toString()}`);
    return response.data;
  }

  async getById(id: number) {
    const response = await apiHandler.get(`/vehicle-types/${id}`);
    return response.data;
  }

  async create(data: Omit<VehicleType, 'id' | 'created_at' | 'updated_at'>) {
    const response = await apiHandler.post('/vehicle-types', data);
    return response.data;
  }

  async update(id: number, data: Partial<VehicleType>) {
    const response = await apiHandler.put(`/vehicle-types/${id}`, data);
    return response.data;
  }

  async delete(id: number) {
    const response = await apiHandler.delete(`/vehicle-types/${id}`);
    return response.data;
  }

  async restore(id: number) {
    const response = await apiHandler.post(`/vehicle-types/${id}/restore`);
    return response.data;
  }
}

export default new VehicleTypeService();
