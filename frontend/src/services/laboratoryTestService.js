import createCrudService from './createCrudService';

const crud = createCrudService('/laboratory-tests');

export const laboratoryTestService = {
  createLabTest: crud.create,
  getLabTests: crud.getAll,
  getLabTestById: crud.getById,
  updateLabTest: crud.update,
  deleteLabTest: crud.delete,
};
