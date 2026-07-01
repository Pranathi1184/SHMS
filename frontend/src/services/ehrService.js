import createCrudService from './createCrudService';

const crud = createCrudService('/ehr');

export const ehrService = {
  createEHR: crud.create,
  getEHRs: crud.getAll,
  getEHRById: crud.getById,
  updateEHR: crud.update,
  deleteEHR: crud.delete,
};
