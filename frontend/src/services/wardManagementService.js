import api from './api';
import createCrudService from './createCrudService';

const wardCrud = createCrudService('/ward-management/wards');
const bedCrud = createCrudService('/ward-management/beds');
const admissionCrud = createCrudService('/ward-management/admissions');

export const wardManagementService = {
  // Wards
  createWard: wardCrud.create,
  getWards: wardCrud.getAll,
  getWardById: wardCrud.getById,
  updateWard: wardCrud.update,
  deleteWard: wardCrud.delete,

  // Beds
  createBed: bedCrud.create,
  getBeds: bedCrud.getAll,
  getBedById: bedCrud.getById,
  updateBed: bedCrud.update,
  deleteBed: bedCrud.delete,

  // Admissions
  createAdmission: admissionCrud.create,
  getAdmissions: admissionCrud.getAll,
  getAdmissionById: admissionCrud.getById,
  updateAdmission: admissionCrud.update,
  dischargePatient: async (id) => {
    const response = await api.put(`/ward-management/admissions/${id}/discharge`);
    return response.data;
  },
  deleteAdmission: admissionCrud.delete,
};
