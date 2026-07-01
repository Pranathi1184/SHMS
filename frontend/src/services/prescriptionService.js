import api from './api';
import createCrudService from './createCrudService';

const crud = createCrudService('/prescriptions');

export const prescriptionService = {
  createPrescription: crud.create,
  getPrescriptions: crud.getAll,
  getPrescriptionById: crud.getById,
  updatePrescription: crud.update,
  dispensePrescription: async (id) => {
    const response = await api.put(`/prescriptions/${id}/dispense`);
    return response.data;
  },
  deletePrescription: crud.delete,
};
