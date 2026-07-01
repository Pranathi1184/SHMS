import createCrudService from './createCrudService';

const crud = createCrudService('/medicines');

export const medicineService = {
  createMedicine: crud.create,
  getMedicines: crud.getAll,
  getMedicineById: crud.getById,
  updateMedicine: crud.update,
  deleteMedicine: crud.delete,
};
