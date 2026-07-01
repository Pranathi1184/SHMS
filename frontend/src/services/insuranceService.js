import createCrudService from './createCrudService';

const crud = createCrudService('/insurance', { maxLimit: 100 });

export const insuranceService = {
  createInsurance: crud.create,
  getInsurance: crud.getAll,
  getInsuranceById: crud.getById,
  updateInsurance: crud.update,
  deleteInsurance: crud.delete,
};
