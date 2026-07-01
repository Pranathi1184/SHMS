import createCrudService from './createCrudService';

const crud = createCrudService('/bills', { maxLimit: 100 });

export const billService = {
  createBill: crud.create,
  getBills: crud.getAll,
  getBillById: crud.getById,
  updateBill: crud.update,
  deleteBill: crud.delete,
};
